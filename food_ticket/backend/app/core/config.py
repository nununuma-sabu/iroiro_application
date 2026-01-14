# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """アプリケーション設定"""

    # JWT設定
    SECRET_KEY: str = "your-secret-key-change-this-in-production-09a8f7e6d5c4b3a2"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # データベース設定
    DATABASE_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# シングルトンインスタンス
settings = Settings()
