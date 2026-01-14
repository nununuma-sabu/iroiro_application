# app/schemas/admin.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


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

    model_config = ConfigDict(from_attributes=True)


# ==================== 商品 ====================


class ProductCreate(BaseModel):
    """商品作成用スキーマ"""

    product_name: str
    category_id: int
    standard_price: int
    image_url: Optional[str] = None
    initial_stock: Optional[int] = None


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
    category_name: str
    standard_price: int
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(BaseModel):
    """商品詳細レスポンススキーマ"""

    product_id: int
    product_name: str
    category_id: int
    category_name: str
    standard_price: int
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_on_sale: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== 在庫 ====================


class InventoryResponse(BaseModel):
    """在庫レスポンススキーマ"""

    inventory_id: int
    store_id: int
    product_id: int
    product_name: str
    category_name: str
    standard_price: int
    image_url: Optional[str] = None
    current_stock: int
    is_on_sale: bool

    model_config = ConfigDict(from_attributes=True)


class InventoryUpdate(BaseModel):
    """在庫更新用スキーマ（汎用）"""

    current_stock: Optional[int] = None
    is_on_sale: Optional[bool] = None


class InventoryUpdateStock(BaseModel):
    """在庫数更新用スキーマ"""

    current_stock: int


class InventoryUpdateSaleStatus(BaseModel):
    """販売状態更新用スキーマ"""

    is_on_sale: bool


# ==================== 売上分析 ====================


class SalesSummaryResponse(BaseModel):
    """売上サマリーレスポンススキーマ"""

    total_sales: int
    total_orders: int
    average_order_value: float
    period_start: Optional[str] = None
    period_end: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PopularProductResponse(BaseModel):
    """人気商品レスポンススキーマ"""

    product_id: int
    product_name: str
    category_name: str
    image_url: Optional[str] = None
    total_quantity: int
    total_sales: int
    order_count: int

    model_config = ConfigDict(from_attributes=True)


class SalesTrendResponse(BaseModel):
    """売上推移レスポンススキーマ"""

    date: str
    total_sales: int
    total_orders: int
    average_order_value: float

    model_config = ConfigDict(from_attributes=True)
