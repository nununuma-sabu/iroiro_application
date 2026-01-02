# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
from pathlib import Path

from app.db.session import SessionLocal
from app.db import models
from app.schemas import admin as admin_schemas

router = APIRouter(prefix="/admin", tags=["admin"])


# 依存関係:   DBセッション
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== カテゴリ管理API ====================


@router.get("/categories", response_model=List[admin_schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """全カテゴリを取得"""
    categories = db.query(models.Category).all()
    return categories


@router.post("/categories", response_model=admin_schemas.CategoryResponse)
def create_category(
    category_data: admin_schemas.CategoryCreate, db: Session = Depends(get_db)
):
    """新しいカテゴリを追加"""
    # 重複チェック
    existing = (
        db.query(models.Category)
        .filter(models.Category.category_name == category_data.category_name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"カテゴリ '{category_data.category_name}' は既に存在します",
        )

    new_category = models.Category(category_name=category_data.category_name)

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.put("/categories/{category_id}", response_model=admin_schemas.CategoryResponse)
def update_category(
    category_id: int,
    category_data: admin_schemas.CategoryUpdate,
    db: Session = Depends(get_db),
):
    """カテゴリ名を更新"""
    category = db.query(models.Category).filter_by(category_id=category_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="カテゴリが見つかりません")

    # 重複チェック（自分以外）
    existing = (
        db.query(models.Category)
        .filter(
            models.Category.category_name == category_data.category_name,
            models.Category.category_id != category_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"カテゴリ '{category_data.category_name}' は既に存在します",
        )

    category.category_name = category_data.category_name
    db.commit()
    db.refresh(category)

    return category


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """カテゴリを削除"""
    category = db.query(models.Category).filter_by(category_id=category_id).first()

    if not category:
        raise HTTPException(status_code=404, detail="カテゴリが見つかりません")

    # このカテゴリを使用している商品があるかチェック
    products_count = db.query(models.Product).filter_by(category_id=category_id).count()

    if products_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"このカテゴリは {products_count} 個の商品で使用されているため削除できません",
        )

    db.delete(category)
    db.commit()

    return {"status": "success", "message": "カテゴリを削除しました"}


# ==================== 商品管理API ====================


@router.get("/products", response_model=List[admin_schemas.ProductDetailResponse])
def get_all_products(category_id: int = None, db: Session = Depends(get_db)):
    """全商品を取得（カテゴリでフィルター可能）"""
    query = (
        db.query(
            models.Product.product_id,
            models.Product.product_name,
            models.Product.category_id,
            models.Category.category_name,
            models.Product.standard_price,
            models.Product.image_url,
            models.StoreInventory.current_stock.label("stock"),
            models.StoreInventory.is_on_sale,
        )
        .join(models.Category)
        .outerjoin(
            models.StoreInventory,
            (models.StoreInventory.product_id == models.Product.product_id)
            & (models.StoreInventory.store_id == 1),  # デフォルト店舗
        )
    )

    if category_id:
        query = query.filter(models.Product.category_id == category_id)

    products = query.all()

    return [
        {
            "product_id": p.product_id,
            "product_name": p.product_name,
            "category_id": p.category_id,
            "category_name": p.category_name,
            "standard_price": p.standard_price,
            "image_url": p.image_url,
            "stock": p.stock,
            "is_on_sale": p.is_on_sale,
        }
        for p in products
    ]


@router.post("/products", response_model=admin_schemas.ProductResponse)
def create_product(
    product_data: admin_schemas.ProductCreate, db: Session = Depends(get_db)
):
    """新しい商品を追加"""
    # カテゴリの存在確認
    category = (
        db.query(models.Category)
        .filter_by(category_id=product_data.category_id)
        .first()
    )
    if not category:
        raise HTTPException(
            status_code=404, detail="指定されたカテゴリが見つかりません"
        )

    # 商品作成
    new_product = models.Product(
        product_name=product_data.product_name,
        category_id=product_data.category_id,
        standard_price=product_data.standard_price,
        image_url=product_data.image_url,
    )

    db.add(new_product)
    db.flush()

    # 在庫情報も作成（initial_stockが指定されている場合）
    if product_data.initial_stock is not None:
        inventory = models.StoreInventory(
            store_id=1,  # デフォルト店舗
            product_id=new_product.product_id,
            current_stock=product_data.initial_stock,
            is_on_sale=True,
        )
        db.add(inventory)

    db.commit()
    db.refresh(new_product)

    return {
        "product_id": new_product.product_id,
        "product_name": new_product.product_name,
        "category_id": new_product.category_id,
        "category_name": category.category_name,
        "standard_price": new_product.standard_price,
        "image_url": new_product.image_url,
    }


@router.put("/products/{product_id}", response_model=admin_schemas.ProductResponse)
def update_product(
    product_id: int,
    product_data: admin_schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    """商品情報を更新"""
    product = db.query(models.Product).filter_by(product_id=product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="商品が見つかりません")

    # カテゴリ変更時の存在確認
    if product_data.category_id is not None:
        category = (
            db.query(models.Category)
            .filter_by(category_id=product_data.category_id)
            .first()
        )
        if not category:
            raise HTTPException(
                status_code=404, detail="指定されたカテゴリが見つかりません"
            )
        product.category_id = product_data.category_id

    # その他のフィールド更新
    if product_data.product_name is not None:
        product.product_name = product_data.product_name
    if product_data.standard_price is not None:
        product.standard_price = product_data.standard_price
    if product_data.image_url is not None:
        product.image_url = product_data.image_url

    db.commit()
    db.refresh(product)

    # カテゴリ名を取得
    category = (
        db.query(models.Category).filter_by(category_id=product.category_id).first()
    )

    return {
        "product_id": product.product_id,
        "product_name": product.product_name,
        "category_id": product.category_id,
        "category_name": category.category_name,
        "standard_price": product.standard_price,
        "image_url": product.image_url,
    }


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """商品を削除"""
    product = db.query(models.Product).filter_by(product_id=product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="商品が見つかりません")

    # 在庫情報も削除
    db.query(models.StoreInventory).filter_by(product_id=product_id).delete()

    # 注文履歴がある場合は警告（削除は許可）
    order_count = db.query(models.OrderDetail).filter_by(product_id=product_id).count()

    db.delete(product)
    db.commit()

    message = "商品を削除しました"
    if order_count > 0:
        message += f"（注文履歴 {order_count} 件が存在します）"

    return {"status": "success", "message": message}


# ==================== 画像アップロードAPI ====================


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """商品画像をアップロード"""
    # ファイル形式の検証
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="画像ファイル(jpg, jpeg, png, webp)のみアップロード可能です",
        )

    # 保存先ディレクトリ(絶対パスで指定)
    import os

    # バックエンドの親ディレクトリ -> food_ticket -> frontend -> public -> images
    current_dir = Path(__file__).resolve().parent  # app/routers
    backend_dir = current_dir.parent.parent  # backend
    project_root = backend_dir.parent  # food_ticket
    upload_dir = project_root / "frontend" / "public" / "images"

    # ディレクトリが存在しない場合は作成
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 元のファイル名をそのまま使用
    filename = file.filename
    file_path = upload_dir / filename

    # ファイル保存
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"ファイル保存に失敗しました:  {str(e)}"
        )

    return {"status": "success", "image_url": f"/images/{filename}"}


# ==================== 在庫管理API ====================


@router.get("/inventories", response_model=List[admin_schemas.InventoryResponse])
def get_inventories(
    store_id: int = 1,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """在庫一覧を取得（店舗IDとカテゴリでフィルター可能）"""
    query = (
        db.query(
            models.StoreInventory.store_id,
            models.StoreInventory.product_id,
            models.Product.product_name,
            models.Category.category_name,
            models.Product.standard_price,
            models.Product.image_url,
            models.StoreInventory.current_stock,
            models.StoreInventory.is_on_sale,
        )
        .select_from(models.StoreInventory)  # ⬅️ 明示的にFROMを指定
        .join(
            models.Product,
            models.StoreInventory.product_id == models.Product.product_id,
        )  # ⬅️ 明示的なON句
        .join(
            models.Category, models.Product.category_id == models.Category.category_id
        )  # ⬅️ 明示的なON句
        .filter(models.StoreInventory.store_id == store_id)
    )

    if category_id:
        query = query.filter(models.Product.category_id == category_id)

    inventories = query.all()

    return [
        {
            "inventory_id": i.store_id * 10000 + i.product_id,  # 擬似的なID
            "store_id": i.store_id,
            "product_id": i.product_id,
            "product_name": i.product_name,
            "category_name": i.category_name,
            "standard_price": i.standard_price,
            "image_url": i.image_url,
            "current_stock": i.current_stock,
            "is_on_sale": i.is_on_sale,
        }
        for i in inventories
    ]


@router.put("/inventories/{store_id}/{product_id}/stock")
def update_inventory_stock(
    store_id: int,
    product_id: int,
    stock_data: admin_schemas.InventoryUpdateStock,
    db: Session = Depends(get_db),
):
    """在庫数を更新"""
    inventory = (
        db.query(models.StoreInventory)
        .filter_by(store_id=store_id, product_id=product_id)
        .first()
    )

    if not inventory:
        raise HTTPException(status_code=404, detail="在庫情報が見つかりません")

    if stock_data.current_stock < 0:
        raise HTTPException(status_code=400, detail="在庫数は0以上である必要があります")

    inventory.current_stock = stock_data.current_stock
    db.commit()
    db.refresh(inventory)

    return {"status": "success", "message": "在庫数を更新しました"}


@router.patch("/inventories/{store_id}/{product_id}/sale-status")
def update_inventory_sale_status(
    store_id: int,
    product_id: int,
    status_data: admin_schemas.InventoryUpdateSaleStatus,
    db: Session = Depends(get_db),
):
    """販売状態を切り替え"""
    inventory = (
        db.query(models.StoreInventory)
        .filter_by(store_id=store_id, product_id=product_id)
        .first()
    )

    if not inventory:
        raise HTTPException(status_code=404, detail="在庫情報が見つかりません")

    inventory.is_on_sale = status_data.is_on_sale
    db.commit()
    db.refresh(inventory)

    status_text = "販売中" if status_data.is_on_sale else "販売停止"
    return {"status": "success", "message": f"販売状態を {status_text} に変更しました"}
