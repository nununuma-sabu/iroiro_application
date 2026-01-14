# app/core/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.db import models
from app.core.security import verify_token

# HTTPベアラートークン認証スキーム
security = HTTPBearer()


def get_current_store(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.Store:
    """現在ログイン中の店舗を取得

    Args:
        credentials: HTTPベアラートークン
        db: データベースセッション

    Returns:
        Store: 店舗モデル

    Raises:
        HTTPException: 認証失敗時
    """
    # トークンを取得
    token = credentials.credentials

    # トークンを検証
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # トークンからstore_idを取得
    store_id: Optional[int] = payload.get("sub")

    if store_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # データベースから店舗を取得
    store = (
        db.query(models.Store).filter(models.Store.store_id == int(store_id)).first()
    )

    if store is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="店舗が見つかりません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return store
