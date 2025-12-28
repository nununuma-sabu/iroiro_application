# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import SessionLocal
from app.db import models
from app.schemas import admin as admin_schemas

router = APIRouter(prefix="/admin", tags=["admin"])


# 依存関係:  DBセッション
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
