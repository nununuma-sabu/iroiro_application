from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from passlib.context import CryptContext

# パスワードハッシュ化の設定
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def seed_data():
    db: Session = SessionLocal()

    try:
        # 1. 都道府県 (東京都: 13)
        tokyo = models.Prefecture(prefecture_id=13, prefecture_name="東京都")
        db.add(tokyo)
        db.flush()  # IDを確定させる

        # 2. 市町村 (新宿区: 13104)
        shinjuku = models.Municipality(
            municipality_id=13104,
            prefecture_id=tokyo.prefecture_id,
            municipality_name="新宿区",
        )
        db.add(shinjuku)
        db.flush()

        # 3. 店舗 (新宿本店)
        store = models.Store(
            store_id=1,
            municipality_id=shinjuku.municipality_id,
            store_name="新宿本店",
            address_detail="西新宿1-1-1",
            password_hash=get_password_hash("password123"),  # 初期パスワード
        )
        db.add(store)
        db.flush()

        # 4. カテゴリ
        cat_set = models.Category(category_id=1, category_name="定食")
        cat_side = models.Category(category_id=2, category_name="サイドメニュー")
        db.add_all([cat_set, cat_side])
        db.flush()

        # 5. 商品
        p1 = models.Product(
            product_id=1,
            category_id=cat_set.category_id,
            product_name="ハンバーグ定食",
            standard_price=850,
        )
        p2 = models.Product(
            product_id=2,
            category_id=cat_set.category_id,
            product_name="からあげ定食",
            standard_price=750,
        )
        p3 = models.Product(
            product_id=3,
            category_id=cat_side.category_id,
            product_name="フライドポテト",
            standard_price=300,
        )
        db.add_all([p1, p2, p3])
        db.flush()

        # 6. 店舗在庫 (新宿本店に在庫を紐付け)
        inventory_list = [
            models.StoreInventory(
                store_id=store.store_id,
                product_id=p1.product_id,
                current_stock=50,
                is_on_sale=True,
            ),
            models.StoreInventory(
                store_id=store.store_id,
                product_id=p2.product_id,
                current_stock=30,
                is_on_sale=True,
            ),
            models.StoreInventory(
                store_id=store.store_id,
                product_id=p3.product_id,
                current_stock=100,
                is_on_sale=True,
            ),
        ]
        db.add_all(inventory_list)

        # 全て確定
        db.commit()
        print("初期データの投入が完了しました！")

    except Exception as e:
        print(f"エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
