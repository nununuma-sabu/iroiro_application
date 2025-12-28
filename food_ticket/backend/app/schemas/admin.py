# app/schemas/admin.py
from pydantic import BaseModel
from typing import Optional


# ==================== カテゴリ ====================


class CategoryCreate(BaseModel):
    """カテゴリ作成用スキーマ"""

    category_name: str


class CategoryUpdate(BaseModel):
    """カテゴリ更新用スキーマ"""

    category_name: str


class CategoryResponse(BaseModel):
    """カテゴリレスポンススキーマ"""

    category_id: int
    category_name: str

    class Config:
        from_attributes = True  # SQLAlchemy 2.0 対応
