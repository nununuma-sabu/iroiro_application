# scripts/seed.py
import sys
import os

# プロジェクトのルートディレクトリをパスに追加（scriptsフォルダから実行する場合に必要）
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db import models
from app.core.security import get_password_hash


def seed_data():
    db: Session = SessionLocal()

    try:
        print("初期データを投入中...")

        # 1. 都道府県 (東京都)
        tokyo = db.query(models.Prefecture).filter_by(prefecture_id=13).first()
        if not tokyo:
            tokyo = models.Prefecture(prefecture_id=13, prefecture_name="東京都")
            db.add(tokyo)
            db.flush()

        # 2. 市町村 (新宿区)
        shinjuku = (
            db.query(models.Municipality).filter_by(municipality_id=13104).first()
        )
        if not shinjuku:
            shinjuku = models.Municipality(
                municipality_id=13104,
                prefecture_id=tokyo.prefecture_id,
                municipality_name="新宿区",
            )
            db.add(shinjuku)
            db.flush()

        # 3. 店舗 (新宿本店)
        store = db.query(models.Store).filter_by(store_id=1).first()
        if not store:
            store = models.Store(
                store_id=1,
                municipality_id=shinjuku.municipality_id,
                store_name="新宿本店",
                address_detail="西新宿1-1-1",
                password_hash=get_password_hash("password123"),
            )
            db.add(store)
            db.flush()

        # 4. カテゴリ
        if not db.query(models.Category).filter_by(category_id=1).first():
            cat_set = models.Category(category_id=1, category_name="定食")
            cat_side = models.Category(category_id=2, category_name="サイドメニュー")
            db.add_all([cat_set, cat_side])
            db.flush()

        # 5. 商品（画像URLを含む）
        if not db.query(models.Product).filter_by(product_id=1).first():
            p1 = models.Product(
                product_id=1,
                category_id=1,
                product_name="ハンバーグ定食",
                standard_price=850,
                image_url="/images/hamburg.jpg",  # 🆕 画像URL追加
            )
            p2 = models.Product(
                product_id=2,
                category_id=1,
                product_name="からあげ定食",
                standard_price=750,
                image_url="/images/karaage.jpg",  # 🆕 画像URL追加
            )
            p3 = models.Product(
                product_id=3,
                category_id=2,
                product_name="フライドポテト",
                standard_price=300,
                image_url="/images/potato.jpg",  # 🆕 画像URL追加
            )
            p4 = models.Product(
                product_id=4,
                category_id=1,
                product_name="とんかつ定食",
                standard_price=900,
                image_url="/images/tonkatsu.jpg",  # 🆕 画像URL追加（とんかつの画像が必要）
            )
            db.add_all([p1, p2, p3, p4])
            db.flush()

            # 6. 店舗在庫 (新宿本店に在庫を紐付け)
            inventory_list = [
                models.StoreInventory(
                    store_id=1, product_id=1, current_stock=50, is_on_sale=True
                ),
                models.StoreInventory(
                    store_id=1, product_id=2, current_stock=30, is_on_sale=True
                ),
                models.StoreInventory(
                    store_id=1, product_id=3, current_stock=100, is_on_sale=True
                ),
                models.StoreInventory(
                    store_id=1, product_id=4, current_stock=40, is_on_sale=True
                ),
            ]
            db.add_all(inventory_list)

        db.commit()
        print("初期データの投入が完了しました！")

    except Exception as e:
        print(f"エラーが発生しました:  {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
