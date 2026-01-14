# app/schemas/auth.py
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """トークンレスポンス"""

    access_token: str
    token_type: str


# 🆕 店舗情報を含むトークンレスポンス
class TokenWithStoreInfo(BaseModel):
    """トークンと店舗情報を含むレスポンス"""

    access_token: str
    token_type: str
    store_info: dict


class TokenData(BaseModel):
    """トークンから取得したデータ"""

    store_id: Optional[int] = None


class StoreLogin(BaseModel):
    """店舗ログインリクエスト"""

    store_id: int
    password: str
