# -*- coding: utf-8 -*-
# app/schemas/admin.py
from pydantic import BaseModel
from typing import Optional


# カテゴリ関連スキーマ


class CategoryCreate(BaseModel):
    """カテゴリ作成用スキーマ"""

    category_name: str


class CategoryResponse(BaseModel):
    """カテゴリレスポンス用スキーマ"""

    category_id: int
    category_name: str

    class Config:
        from_attributes = True


# 商品関連スキーマ


class ProductCreate(BaseModel):
    """商品作成用スキーマ"""

    product_name: str
    category_id: int
    standard_price: int
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    """商品更新用スキーマ"""

    product_name: Optional[str] = None
    category_id: Optional[int] = None
    standard_price: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    """商品レスポンス用スキーマ"""

    product_id: int
    product_name: str
    category_id: int
    category_name: str
    standard_price: int
    image_url: Optional[str] = None
    stock: int = 0
    is_on_sale: bool = False

    class Config:
        from_attributes = True


# 在庫関連スキーマ


class InventoryCreate(BaseModel):
    """在庫作成用スキーマ"""

    store_id: int
    product_id: int
    current_stock: int = 0
    is_on_sale: bool = False


class InventoryUpdateStock(BaseModel):
    """在庫数更新用スキーマ"""

    current_stock: int


class InventoryUpdateSaleStatus(BaseModel):
    """販売状態更新用スキーマ"""

    is_on_sale: bool


class InventoryResponse(BaseModel):
    """在庫レスポンス用スキーマ"""

    store_id: int
    product_id: int
    product_name: str
    category_name: str
    standard_price: int
    image_url: Optional[str] = None
    current_stock: int
    is_on_sale: bool

    class Config:
        from_attributes = True


# 売上分析関連スキーマ


class SalesSummaryResponse(BaseModel):
    """売上サマリーレスポンス用スキーマ"""

    total_sales: int
    total_orders: int
    avg_order_amount: int


class PopularProductResponse(BaseModel):
    """人気商品レスポンス用スキーマ"""

    product_id: int
    product_name: str
    category_name: str
    image_url: Optional[str] = None
    total_quantity: int
    total_sales: int
    order_count: int


class SalesTrendResponse(BaseModel):
    """売上推移レスポンス用スキーマ"""

    date: str
    total_sales: int
    order_count: int
