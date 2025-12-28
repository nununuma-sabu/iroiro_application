# scripts/manage_products.py
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db import models


def show_menu():
    print("\n" + "=" * 50)
    print("🍱 商品管理ツール")
    print("=" * 50)
    print("1. 商品一覧を表示")
    print("2. 新しい商品を追加")
    print("3. 商品情報を更新")
    print("4. 商品を削除")
    print("5. カテゴリ一覧を表示")
    print("6. 在庫情報を更新")
    print("0. 終了")
    print("=" * 50)


def list_products(db):
    """商品一覧を表示"""
    products = db.query(models.Product).all()

    if not products:
        print("\n⚠️  商品が登録されていません")
        return

    print("\n📋 登録済み商品一覧:")
    print("-" * 80)
    print(f"{'ID':<5} {'商品名':<20} {'カテゴリID':<12} {'価格':<10} {'画像URL':<30}")
    print("-" * 80)

    for p in products:
        print(
            f"{p.product_id:<5} {p.product_name:<20} {p.category_id:<12} ¥{p.standard_price:<9} {p.image_url or '(なし)':<30}"
        )
    print("-" * 80)


def list_categories(db):
    """カテゴリ一覧を表示"""
    categories = db.query(models.Category).all()

    print("\n📁 カテゴリ一覧:")
    print("-" * 40)
    print(f"{'ID':<5} {'カテゴリ名':<20}")
    print("-" * 40)

    for c in categories:
        print(f"{c.category_id:<5} {c.category_name:<20}")
    print("-" * 40)


def add_product(db):
    """新しい商品を追加"""
    print("\n➕ 新しい商品を追加")

    # カテゴリ一覧を表示
    list_categories(db)

    try:
        product_name = input("\n商品名:  ")
        category_id = int(input("カテゴリID: "))
        standard_price = int(input("価格（円）: "))
        image_url = input(
            "画像URL（例: /images/product. jpg）[空白でスキップ]: "
        ).strip()

        # カテゴリの存在確認
        category = db.query(models.Category).filter_by(category_id=category_id).first()
        if not category:
            print(f"❌ カテゴリID {category_id} が見つかりません")
            return

        # 商品を作成
        new_product = models.Product(
            product_name=product_name,
            category_id=category_id,
            standard_price=standard_price,
            image_url=image_url if image_url else None,
        )

        db.add(new_product)
        db.flush()

        print(f"\n✅ 商品を追加しました（ID: {new_product.product_id}）")

        # 在庫情報も追加するか確認
        add_inventory = input("\n在庫情報も登録しますか？ (y/n): ").lower()

        if add_inventory == "y":
            store_id = int(input("店舗ID [デフォルト: 1]:  ") or "1")
            stock = int(input("初期在庫数:  "))
            is_on_sale = input("販売中にする？ (y/n) [デフォルト: y]: ").lower() or "y"

            inventory = models.StoreInventory(
                store_id=store_id,
                product_id=new_product.product_id,
                current_stock=stock,
                is_on_sale=(is_on_sale == "y"),
            )

            db.add(inventory)
            print(f"✅ 在庫情報を追加しました（店舗ID: {store_id}, 在庫数:  {stock}）")

        db.commit()
        print("\n🎉 すべての処理が完了しました！")

    except ValueError as e:
        print(f"❌ 入力エラー: 数値を正しく入力してください")
        db.rollback()
    except Exception as e:
        print(f"❌ エラー: {e}")
        db.rollback()


def update_product(db):
    """商品情報を更新"""
    list_products(db)

    try:
        product_id = int(input("\n更新する商品ID: "))
        product = db.query(models.Product).filter_by(product_id=product_id).first()

        if not product:
            print(f"❌ 商品ID {product_id} が見つかりません")
            return

        print(f"\n現在の情報:")
        print(f"  商品名: {product.product_name}")
        print(f"  価格: ¥{product. standard_price}")
        print(f"  カテゴリID: {product.category_id}")
        print(f"  画像URL: {product.image_url or '(なし)'}")

        print("\n新しい値を入力（変更しない場合は空白のままEnter）:")

        new_name = input(f"商品名 [{product.product_name}]:  ").strip()
        new_price = input(f"価格 [{product.standard_price}]: ").strip()
        new_image = input(f"画像URL [{product.image_url or '(なし)'}]: ").strip()

        if new_name:
            product.product_name = new_name
        if new_price:
            product.standard_price = int(new_price)
        if new_image:
            product.image_url = new_image

        db.commit()
        print("\n✅ 商品情報を更新しました！")

    except ValueError:
        print(f"❌ 入力エラー: 数値を正しく入力してください")
        db.rollback()
    except Exception as e:
        print(f"❌ エラー: {e}")
        db.rollback()


def update_inventory(db):
    """在庫情報を更新"""
    try:
        store_id = int(input("店舗ID [デフォルト: 1]: ") or "1")

        # 指定店舗の在庫一覧を表示
        inventories = (
            db.query(models.StoreInventory)
            .filter_by(store_id=store_id)
            .join(models.Product)
            .all()
        )

        if not inventories:
            print(f"\n⚠️  店舗ID {store_id} の在庫情報が見つかりません")
            return

        print(f"\n📦 店舗ID {store_id} の在庫一覧:")
        print("-" * 60)
        print(f"{'商品ID':<8} {'商品名':<20} {'在庫数':<10} {'販売中':<10}")
        print("-" * 60)

        for inv in inventories:
            status = "✅ はい" if inv.is_on_sale else "❌ いいえ"
            print(
                f"{inv.product_id:<8} {inv. product. product_name:<20} {inv.current_stock:<10} {status: <10}"
            )
        print("-" * 60)

        product_id = int(input("\n更新する商品ID:  "))

        inventory = (
            db.query(models.StoreInventory)
            .filter_by(store_id=store_id, product_id=product_id)
            .first()
        )

        if not inventory:
            print(f"❌ 商品ID {product_id} の在庫情報が見つかりません")
            return

        print(f"\n現在の在庫数: {inventory.current_stock}")
        new_stock = input("新しい在庫数（変更しない場合は空白）: ").strip()

        if new_stock:
            inventory.current_stock = int(new_stock)
            print(f"✅ 在庫数を {new_stock} に更新しました")

        toggle_sale = input("販売状態を切り替えますか？ (y/n): ").lower()
        if toggle_sale == "y":
            inventory.is_on_sale = not inventory.is_on_sale
            status = "販売中" if inventory.is_on_sale else "販売停止"
            print(f"✅ 販売状態を '{status}' に変更しました")

        db.commit()

    except ValueError:
        print(f"❌ 入力エラー: 数値を正しく入力してください")
        db.rollback()
    except Exception as e:
        print(f"❌ エラー: {e}")
        db.rollback()


def delete_product(db):
    """商品を削除"""
    list_products(db)

    try:
        product_id = int(input("\n削除する商品ID: "))
        product = db.query(models.Product).filter_by(product_id=product_id).first()

        if not product:
            print(f"❌ 商品ID {product_id} が見つかりません")
            return

        confirm = input(
            f"\n本当に '{product.product_name}' を削除しますか？ (yes/no): "
        )

        if confirm.lower() == "yes":
            # 在庫情報も削除
            db.query(models.StoreInventory).filter_by(product_id=product_id).delete()
            db.delete(product)
            db.commit()
            print(f"✅ 商品を削除しました")
        else:
            print("キャンセルしました")

    except ValueError:
        print(f"❌ 入力エラー: 数値を正しく入力してください")
    except Exception as e:
        print(f"❌ エラー: {e}")
        db.rollback()


def main():
    db = SessionLocal()

    try:
        while True:
            show_menu()
            choice = input("\n選択してください: ").strip()

            if choice == "1":
                list_products(db)
            elif choice == "2":
                add_product(db)
            elif choice == "3":
                update_product(db)
            elif choice == "4":
                delete_product(db)
            elif choice == "5":
                list_categories(db)
            elif choice == "6":
                update_inventory(db)
            elif choice == "0":
                print("\n👋 終了します")
                break
            else:
                print("\n❌ 無効な選択です")

    finally:
        db.close()


if __name__ == "__main__":
    main()
