# backend/scripts/add_image_url_column.py
from sqlalchemy import inspect
from app.db.session import SessionLocal
from app.db import models


def add_image_url_column():
    db = SessionLocal()

    try:
        # 既に列が存在するかチェック
        inspector = inspect(db.bind)
        columns = [col["name"] for col in inspector.get_columns("products")]

        if "image_url" not in columns:
            # Raw SQLで列を追加
            db.execute("ALTER TABLE products ADD COLUMN image_url VARCHAR(255)")
            db.commit()
            print("✅ image_url列を追加しました")
        else:
            print("ℹ️  image_url列は既に存在します")

        # 🆕 ORMを使って更新（より安全）
        updates = [
            ("ハンバーグ定食", "/images/hamburg.jpg"),
            ("からあげ定食", "/images/karaage.jpg"),
            ("フライドポテト", "/images/potato. jpg"),
        ]

        for product_name, image_url in updates:
            product = (
                db.query(models.Product)
                .filter(models.Product.product_name == product_name)
                .first()
            )

            if product:
                product.image_url = image_url
                print(f"✅ {product_name} の画像URLを設定: {image_url}")
            else:
                print(f"⚠️  商品が見つかりません: {product_name}")

        db.commit()
        print("\n🎉 データベースの更新が完了しました！")

        # 確認
        print("\n📋 登録済み商品一覧:")
        products = db.query(models.Product).all()
        for p in products:
            print(f"  - {p.product_name}:  {p.image_url or '(画像なし)'}")

    except Exception as e:
        db.rollback()
        print(f"❌ エラー: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    add_image_url_column()
