# scripts/seed.py
import sys
import os

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

        # 4. カテゴリ（🔥 修正:  サイドメニューも追加）
        categories_data = [
            (1, "定食"),
            (2, "単品"),
            (3, "サイドメニュー"),  # 🆕 ID変更
        ]

        for cat_id, cat_name in categories_data:
            existing = db.query(models.Category).filter_by(category_id=cat_id).first()
            if not existing:
                category = models.Category(category_id=cat_id, category_name=cat_name)
                db.add(category)

        db.flush()

        # 5. 商品（画像URLを含む）
        if not db.query(models.Product).filter_by(product_id=1).first():
            products = [
                models.Product(
                    product_id=1,
                    category_id=1,  # 定食
                    product_name="ハンバーグ定食",
                    standard_price=850,
                    image_url="/images/hamburg.jpg",
                ),
                models.Product(
                    product_id=2,
                    category_id=1,  # 定食
                    product_name="からあげ定食",
                    standard_price=750,
                    image_url="/images/karaage.jpg",
                ),
                models.Product(
                    product_id=3,
                    category_id=3,  # サイドメニュー
                    product_name="フライドポテト",
                    standard_price=300,
                    image_url="/images/potato.jpg",
                ),
                models.Product(
                    product_id=4,
                    category_id=1,  # 定食
                    product_name="とんかつ定食",
                    standard_price=900,
                    image_url="/images/tonkatsu.jpg",
                ),
            ]
            db.add_all(products)
            db.flush()

            # 6. 店舗在庫
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
