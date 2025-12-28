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
        from_attributes = True


# ==================== 商品 ====================


class ProductCreate(BaseModel):
    """商品作成用スキーマ"""

    product_name: str
    category_id: int
    standard_price: int
    image_url: Optional[str] = None
    initial_stock: Optional[int] = None  # 初期在庫（在庫も同時作成する場合）


class ProductUpdate(BaseModel):
    """商品更新用スキーマ"""

    product_name: Optional[str] = None
    category_id: Optional[int] = None
    standard_price: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    """商品レスポンススキーマ"""

    product_id: int
    product_name: str
    category_id: int
    category_name: str  # JOIN結果
    standard_price: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProductDetailResponse(BaseModel):
    """商品詳細レスポンス（在庫情報含む）"""

    product_id: int
    product_name: str
    category_id: int
    category_name: str
    standard_price: int
    image_url: Optional[str] = None
    stock: Optional[int] = None  # 在庫数
    is_on_sale: Optional[bool] = None  # 販売中かどうか

    class Config:
        from_attributes = True
