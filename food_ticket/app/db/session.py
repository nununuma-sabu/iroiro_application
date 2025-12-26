# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 開発用SQLiteファイルへのパス
# プロジェクトルートに vending_machine.db が作成されます
SQLALCHEMY_DATABASE_URL = "sqlite:///./vending_machine.db"

# SQLite固有の設定（check_same_thread=False）を追加してマルチスレッド対応にする
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 各リクエストで使用されるセッション作成器
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
