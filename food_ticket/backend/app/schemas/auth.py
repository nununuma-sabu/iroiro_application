# app/schemas/auth.py
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """トークンレスポンス"""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """トークンから取得したデータ"""

    store_id: Optional[int] = None


class StoreLogin(BaseModel):
    """店舗ログインリクエスト"""

    store_id: int
    password: str
