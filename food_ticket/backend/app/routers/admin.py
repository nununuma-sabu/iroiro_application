# -*- coding: utf-8 -*-
# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional
import shutil
from pathlib import Path

from app.db.session import get_db
from app.db import models
from app.schemas import admin as admin_schemas
from app.core.deps import get_current_store

router = APIRouter(prefix="/admin", tags=["admin"])


# カテゴリ管理API


@router.get("/categories", response_model=List[admin_schemas.CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """全カテゴリを取得（認証必須）"""
    categories = db.query(models.Category).all()
    return categories


@router.post("/categories", response_model=admin_schemas.CategoryResponse)
def create_category(
    category: admin_schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """新しいカテゴリを作成（認証必須）"""
    existing = (
        db.query(models.Category)
        .filter(models.Category.category_name == category.category_name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="同じ名前のカテゴリが既に存在します"
        )

    new_category = models.Category(category_name=category.category_name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.put("/categories/{category_id}", response_model=admin_schemas.CategoryResponse)
def update_category(
    category_id: int,
    category: admin_schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """カテゴリ名を更新（認証必須）"""
    target = (
        db.query(models.Category)
        .filter(models.Category.category_id == category_id)
        .first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="カテゴリが見つかりません")

    existing = (
        db.query(models.Category)
        .filter(
            models.Category.category_name == category.category_name,
            models.Category.category_id != category_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="同じ名前のカテゴリが既に存在します"
        )

    target.category_name = category.category_name
    db.commit()
    db.refresh(target)

    return target


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """カテゴリを削除（認証必須）"""
    target = (
        db.query(models.Category)
        .filter(models.Category.category_id == category_id)
        .first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="カテゴリが見つかりません")

    product_count = (
        db.query(models.Product)
        .filter(models.Product.category_id == category_id)
        .count()
    )

    if product_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"このカテゴリには{product_count}件の商品が紐づいているため削除できません",
        )

    db.delete(target)
    db.commit()

    return {"message": "カテゴリを削除しました"}


# 商品管理API


@router.get("/products", response_model=List[admin_schemas.ProductResponse])
def get_all_products(
    store_id: int = 1,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """全商品を取得（在庫情報含む）（認証必須）"""
    query = (
        db.query(
            models.Product,
            models.Category.category_name,
            models.StoreInventory.current_stock,
            models.StoreInventory.is_on_sale,
        )
        .join(
            models.Category, models.Product.category_id == models.Category.category_id
        )
        .outerjoin(
            models.StoreInventory,
            (models.StoreInventory.product_id == models.Product.product_id)
            & (models.StoreInventory.store_id == store_id),
        )
    )

    products = query.all()

    results = []
    for product, category_name, stock, is_on_sale in products:
        results.append(
            {
                "product_id": product.product_id,
                "product_name": product.product_name,
                "category_id": product.category_id,
                "category_name": category_name,
                "standard_price": product.standard_price,
                "image_url": product.image_url,
                "stock": stock if stock is not None else 0,
                "is_on_sale": is_on_sale if is_on_sale is not None else False,
            }
        )

    return results


@router.post("/products", response_model=admin_schemas.ProductResponse)
def create_product(
    product: admin_schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """新しい商品を作成（認証必須）"""
    category = (
        db.query(models.Category)
        .filter(models.Category.category_id == product.category_id)
        .first()
    )

    if not category:
        raise HTTPException(status_code=400, detail="指定されたカテゴリが存在しません")

    new_product = models.Product(
        product_name=product.product_name,
        category_id=product.category_id,
        standard_price=product.standard_price,
        image_url=product.image_url,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "product_id": new_product.product_id,
        "product_name": new_product.product_name,
        "category_id": new_product.category_id,
        "category_name": category.category_name,
        "standard_price": new_product.standard_price,
        "image_url": new_product.image_url,
        "stock": 0,
        "is_on_sale": False,
    }


@router.put("/products/{product_id}", response_model=admin_schemas.ProductResponse)
def update_product(
    product_id: int,
    product: admin_schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """商品情報を更新（認証必須）"""
    target = (
        db.query(models.Product).filter(models.Product.product_id == product_id).first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="商品が見つかりません")

    if product.category_id:
        category = (
            db.query(models.Category)
            .filter(models.Category.category_id == product.category_id)
            .first()
        )
        if not category:
            raise HTTPException(
                status_code=400, detail="指定されたカテゴリが存在しません"
            )
        target.category_id = product.category_id

    if product.product_name:
        target.product_name = product.product_name
    if product.standard_price is not None:
        target.standard_price = product.standard_price
    if product.image_url:
        target.image_url = product.image_url

    db.commit()
    db.refresh(target)

    category = (
        db.query(models.Category)
        .filter(models.Category.category_id == target.category_id)
        .first()
    )

    inventory = (
        db.query(models.StoreInventory)
        .filter(models.StoreInventory.product_id == product_id)
        .first()
    )

    return {
        "product_id": target.product_id,
        "product_name": target.product_name,
        "category_id": target.category_id,
        "category_name": category.category_name,
        "standard_price": target.standard_price,
        "image_url": target.image_url,
        "stock": inventory.current_stock if inventory else 0,
        "is_on_sale": inventory.is_on_sale if inventory else False,
    }


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """商品を削除（認証必須）"""
    target = (
        db.query(models.Product).filter(models.Product.product_id == product_id).first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="商品が見つかりません")

    inventory_count = (
        db.query(models.StoreInventory)
        .filter(models.StoreInventory.product_id == product_id)
        .count()
    )

    if inventory_count > 0:
        raise HTTPException(
            status_code=400,
            detail="この商品には在庫が紐づいているため削除できません",
        )

    db.delete(target)
    db.commit()

    return {"message": "商品を削除しました"}


# 商品画像アップロードAPI


@router.post("/products/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """商品画像をアップロード（認証必須）"""
    UPLOAD_DIR = Path("public/images")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # ファイル名をそのまま使用（タイムスタンプなし）
    file_path = UPLOAD_DIR / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"image_url": f"/images/{file.filename}"}


# 在庫管理API


@router.get("/inventories", response_model=List[admin_schemas.InventoryResponse])
def get_inventories(
    store_id: int,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """指定店舗の在庫一覧を取得（認証必須）"""
    query = (
        db.query(models.StoreInventory)
        .join(
            models.Product,
            models.StoreInventory.product_id == models.Product.product_id,
        )
        .join(
            models.Category, models.Product.category_id == models.Category.category_id
        )
        .filter(models.StoreInventory.store_id == store_id)
    )

    inventories = query.all()

    results = []
    for inv in inventories:
        results.append(
            {
                "store_id": inv.store_id,
                "product_id": inv.product_id,
                "product_name": inv.product.product_name,
                "category_name": inv.product.category.category_name,
                "standard_price": inv.product.standard_price,
                "image_url": inv.product.image_url,
                "current_stock": inv.current_stock,
                "is_on_sale": inv.is_on_sale,
            }
        )

    return results


@router.post("/inventories", response_model=admin_schemas.InventoryResponse)
def create_inventory(
    inventory: admin_schemas.InventoryCreate,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """新しい在庫を登録（認証必須）"""
    existing = (
        db.query(models.StoreInventory)
        .filter(
            models.StoreInventory.store_id == inventory.store_id,
            models.StoreInventory.product_id == inventory.product_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="この店舗・商品の在庫は既に登録されています"
        )

    product = (
        db.query(models.Product)
        .filter(models.Product.product_id == inventory.product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=400, detail="指定された商品が存在しません")

    new_inventory = models.StoreInventory(
        store_id=inventory.store_id,
        product_id=inventory.product_id,
        current_stock=inventory.current_stock,
        is_on_sale=inventory.is_on_sale,
    )

    db.add(new_inventory)
    db.commit()
    db.refresh(new_inventory)

    return {
        "store_id": new_inventory.store_id,
        "product_id": new_inventory.product_id,
        "product_name": product.product_name,
        "category_name": product.category.category_name,
        "standard_price": product.standard_price,
        "image_url": product.image_url,
        "current_stock": new_inventory.current_stock,
        "is_on_sale": new_inventory.is_on_sale,
    }


@router.put("/inventories/{store_id}/{product_id}/stock")
def update_inventory_stock(
    store_id: int,
    product_id: int,
    update_data: admin_schemas.InventoryUpdateStock,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """在庫数を更新（認証必須）"""
    inventory = (
        db.query(models.StoreInventory)
        .filter(
            models.StoreInventory.store_id == store_id,
            models.StoreInventory.product_id == product_id,
        )
        .first()
    )

    if not inventory:
        raise HTTPException(status_code=404, detail="在庫が見つかりません")

    inventory.current_stock = update_data.current_stock
    db.commit()

    return {"message": "在庫数を更新しました", "current_stock": inventory.current_stock}


@router.put("/inventories/{store_id}/{product_id}/sale-status")
def update_inventory_sale_status(
    store_id: int,
    product_id: int,
    update_data: admin_schemas.InventoryUpdateSaleStatus,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """販売状態を更新（認証必須）"""
    inventory = (
        db.query(models.StoreInventory)
        .filter(
            models.StoreInventory.store_id == store_id,
            models.StoreInventory.product_id == product_id,
        )
        .first()
    )

    if not inventory:
        raise HTTPException(status_code=404, detail="在庫が見つかりません")

    inventory.is_on_sale = update_data.is_on_sale
    db.commit()

    return {"message": "販売状態を更新しました", "is_on_sale": inventory.is_on_sale}


# 売上分析API


@router.get("/sales/summary", response_model=admin_schemas.SalesSummaryResponse)
def get_sales_summary(
    store_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """売上サマリーを取得（認証必須）"""
    target_date = datetime.now() - timedelta(days=days)

    total_sales = (
        db.query(func.sum(models.Order.total_amount))
        .filter(
            models.Order.store_id == store_id,
            models.Order.ordered_at >= target_date,
        )
        .scalar()
        or 0
    )

    total_orders = (
        db.query(func.count(models.Order.order_id))
        .filter(
            models.Order.store_id == store_id,
            models.Order.ordered_at >= target_date,
        )
        .scalar()
        or 0
    )

    avg_order_amount = int(total_sales / total_orders) if total_orders > 0 else 0

    return {
        "total_sales": total_sales,
        "total_orders": total_orders,
        "avg_order_amount": avg_order_amount,
    }


@router.get(
    "/sales/popular-products", response_model=List[admin_schemas.PopularProductResponse]
)
def get_popular_products(
    store_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """人気商品ランキングを取得（認証必須）"""
    popular = (
        db.query(
            models.Product.product_id,
            models.Product.product_name,
            models.Category.category_name,
            models.Product.image_url,
            func.sum(models.OrderDetail.quantity).label("total_quantity"),
            func.sum(models.OrderDetail.quantity * models.OrderDetail.unit_price).label(
                "total_sales"
            ),
            func.count(models.Order.order_id.distinct()).label("order_count"),
        )
        .join(
            models.OrderDetail,
            models.Product.product_id == models.OrderDetail.product_id,
        )
        .join(models.Order, models.OrderDetail.order_id == models.Order.order_id)
        .join(
            models.Category, models.Product.category_id == models.Category.category_id
        )
        .filter(models.Order.store_id == store_id)
        .group_by(
            models.Product.product_id,
            models.Product.product_name,
            models.Category.category_name,
            models.Product.image_url,
        )
        .order_by(desc("total_quantity"))
        .limit(limit)
        .all()
    )

    results = []
    for item in popular:
        results.append(
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "category_name": item.category_name,
                "image_url": item.image_url,
                "total_quantity": item.total_quantity,
                "total_sales": item.total_sales,
                "order_count": item.order_count,
            }
        )

    return results


@router.get("/sales/trends", response_model=List[admin_schemas.SalesTrendResponse])
def get_sales_trends(
    store_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(get_current_store),
):
    """日別売上推移を取得（認証必須）"""
    target_date = datetime.now() - timedelta(days=days)

    trends = (
        db.query(
            func.date(models.Order.ordered_at).label("date"),
            func.sum(models.Order.total_amount).label("total_sales"),
            func.count(models.Order.order_id).label("order_count"),
        )
        .filter(
            models.Order.store_id == store_id,
            models.Order.ordered_at >= target_date,
        )
        .group_by(func.date(models.Order.ordered_at))
        .order_by("date")
        .all()
    )

    results = []
    for trend in trends:
        results.append(
            {
                "date": trend.date.isoformat(),
                "total_sales": trend.total_sales,
                "order_count": trend.order_count,
            }
        )

    return results
