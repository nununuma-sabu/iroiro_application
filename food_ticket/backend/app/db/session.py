# app/db/session.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# テスト環境かどうかを環境変数で判定
TESTING = os.getenv("TESTING", "false").lower() == "true"

if TESTING:
    # テスト時はインメモリDB
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
else:
    # 本番時は通常のDB
    BASE_DIR = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    DB_PATH = os.path.join(BASE_DIR, "vending_machine.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# get_db関数を追加
def get_db():
    """データベースセッションを取得"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
