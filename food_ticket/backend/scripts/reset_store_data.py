"""
各店舗の在庫情報と売上データを初期状態に戻すスクリプト

機能:
- 売上データ（orders, order_details, customer_attributes）を削除
- 在庫情報（store_inventories）を初期値に戻す
"""

import sys
from pathlib import Path

# backend/app をインポートパスに追加
backend_path = Path(__file__).parent / "backend"
sys.path.append(str(backend_path))

from app.db.database import SessionLocal
from app.db import models


def reset_store_data():
    """在庫と売上データを初期化"""
    db = SessionLocal()

    try:
        print("=" * 50)
        print("在庫・売上データリセット開始")
        print("=" * 50)

        # 1. 売上データの削除（OrderDetail → Order → CustomerAttribute の順）
        print("\n[1/4] 注文明細データを削除中...")
        deleted_details = db.query(models.OrderDetail).delete()
        print(f"  ✓ {deleted_details} 件の注文明細を削除しました")

        print("\n[2/4] 注文データを削除中...")
        deleted_orders = db.query(models.Order).delete()
        print(f"  ✓ {deleted_orders} 件の注文を削除しました")

        print("\n[3/4] 顧客属性データを削除中...")
        deleted_attributes = db.query(models.CustomerAttribute).delete()
        print(f"  ✓ {deleted_attributes} 件の顧客属性を削除しました")

        # 2. 在庫情報を初期値に戻す
        print("\n[4/4] 在庫情報を初期値にリセット中...")

        # 初期在庫の定義
        initial_stocks = {
            (1, 1): {"current_stock": 50, "is_on_sale": True},  # ハンバーグ定食
            (1, 2): {"current_stock": 30, "is_on_sale": True},  # からあげ定食
            (1, 3): {"current_stock": 100, "is_on_sale": True},  # とんかつ定食
            (1, 4): {"current_stock": 40, "is_on_sale": True},  # フライドポテト
        }

        reset_count = 0
        for (store_id, product_id), values in initial_stocks.items():
            inventory = (
                db.query(models.StoreInventory)
                .filter_by(store_id=store_id, product_id=product_id)
                .first()
            )

            if inventory:
                inventory.current_stock = values["current_stock"]
                inventory.is_on_sale = values["is_on_sale"]
                reset_count += 1

                # 商品名を取得して表示
                product = (
                    db.query(models.Product).filter_by(product_id=product_id).first()
                )
                product_name = (
                    product.product_name if product else f"商品ID:{product_id}"
                )
                print(f"  ✓ {product_name} → 在庫数:{values['current_stock']}")
            else:
                print(
                    f"  ⚠️  警告: 店舗ID:{store_id}, 商品ID:{product_id} の在庫レコードが見つかりません"
                )

        db.commit()

        print("\n" + "=" * 50)
        print("✅ リセット完了！")
        print("=" * 50)
        print(f"  - 在庫リセット: {reset_count} 件")
        print(f"  - 注文削除: {deleted_orders} 件")
        print(f"  - 注文明細削除: {deleted_details} 件")
        print(f"  - 顧客属性削除: {deleted_attributes} 件")
        print("=" * 50)

    except Exception as e:
        print(f"\n❌ エラーが発生しました:  {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import warnings

    print("\n⚠️  警告: このスクリプトは売上データを完全に削除します！")
    response = input("本当に実行しますか？ (yes/no): ")

    if response.lower() in ["yes", "y"]:
        reset_store_data()
    else:
        print("キャンセルしました。")
