# app/core/security.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from .config import settings

# パスワードハッシュ化の設定
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """パスワードをハッシュ化する"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """平文のパスワードとハッシュ値を照合する"""
    return pwd_context.verify(plain_password, hashed_password)


# ==================== JWT関連関数 ====================


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWTアクセストークンを作成

    Args:
        data: トークンに含めるデータ（例:  {"sub": "1"}）
        expires_delta: 有効期限（省略時は設定ファイルから取得）

    Returns:
        str: JWTトークン
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """JWTトークンを検証

    Args:
        token: 検証するJWTトークン

    Returns:
        dict: トークンのペイロード（検証失敗時はNone）
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
