# -*- coding: utf-8 -*-
# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import datetime

# JWT関連のインポート
from app.db.session import get_db
from app.db import models
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_store
from app.schemas.auth import Token, StoreLogin, TokenWithStoreInfo

# 管理画面用ルーターをインポート
from app.routers import admin

app = FastAPI(title="食券機シミュレーター API")

# Reactからのアクセスを許可する設定
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 管理画面用ルーターを登録
app.include_router(admin.router)


# スキーマ定義


class OrderItem(BaseModel):
    product_id: int
    quantity: int
    unit_price: int


class OrderCreate(BaseModel):
    store_id: int
    attribute_id: int
    items: List[OrderItem]
    total_amount: int
    payment_method: str
    take_out_type: str


class CustomerAttributeCreate(BaseModel):
    store_id: int
    age_group: str
    gender: str


# ルートエンドポイント


@app.get("/")
def read_root():
    return {"message": "Vending Machine API is running"}


# 店舗ログインAPI


@app.post("/login/store", response_model=TokenWithStoreInfo)
def login_store(login_data: StoreLogin, db: Session = Depends(get_db)):
    # 店舗情報を取得
    store = (
        db.query(models.Store)
        .join(models.Municipality)
        .join(models.Prefecture)
        .filter(models.Store.store_id == login_data.store_id)
        .first()
    )

    if not store:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="店舗IDまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # パスワード検証
    if not verify_password(login_data.password, store.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="店舗IDまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # JWTトークンを作成
    access_token = create_access_token(data={"sub": str(store.store_id)})

    # トークンと店舗情報を両方返す
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "store_info": {
            "id": store.store_id,
            "name": store.store_name,
            "prefecture": store.municipality.prefecture.prefecture_name,
            "municipality": store.municipality.municipality_name,
        },
    }


# 認証が必要なエンドポイント例


@app.get("/stores/me")
def get_my_store_info(current_store: models.Store = Depends(get_current_store)):
    return {
        "store_id": current_store.store_id,
        "store_name": current_store.store_name,
        "address": current_store.address_detail,
        "municipality": current_store.municipality.municipality_name,
        "prefecture": current_store.municipality.prefecture.prefecture_name,
    }


# 商品取得API


@app.get("/stores/{store_id}/products")
def get_store_products(store_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(models.StoreInventory)
        .join(models.Product)
        .join(models.Category)
        .filter(
            models.StoreInventory.store_id == store_id,
            models.StoreInventory.is_on_sale == True,
            models.StoreInventory.current_stock > 0,
        )
        .all()
    )

    results = []
    for item in items:
        results.append(
            {
                "product_id": item.product.product_id,
                "product_name": item.product.product_name,
                "category_name": item.product.category.category_name,
                "price": item.product.standard_price,
                "stock": item.current_stock,
                "image_url": item.product.image_url,
            }
        )

    return results


# 顧客属性登録API


@app.post("/customer-attributes")
def create_customer_attribute(
    attribute_data: CustomerAttributeCreate, db: Session = Depends(get_db)
):
    try:
        new_attribute = models.CustomerAttribute(
            store_id=attribute_data.store_id,
            age_group=attribute_data.age_group,
            gender=attribute_data.gender,
            scanned_at=datetime.datetime.now(),
        )
        db.add(new_attribute)
        db.commit()
        db.refresh(new_attribute)

        return {
            "attribute_id": new_attribute.attribute_id,
            "store_id": new_attribute.store_id,
            "age_group": new_attribute.age_group,
            "gender": new_attribute.gender,
            "scanned_at": new_attribute.scanned_at.isoformat(),
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# 注文作成API


@app.post("/orders")
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    try:
        new_order = models.Order(
            store_id=order_data.store_id,
            attribute_id=order_data.attribute_id,
            total_amount=order_data.total_amount,
            payment_method=order_data.payment_method,
            take_out_type=order_data.take_out_type,
        )
        db.add(new_order)
        db.flush()

        for item in order_data.items:
            inventory = (
                db.query(models.StoreInventory)
                .filter(
                    models.StoreInventory.store_id == order_data.store_id,
                    models.StoreInventory.product_id == item.product_id,
                )
                .with_for_update()
                .first()
            )

            if not inventory or inventory.current_stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"商品ID:{item.product_id} の在庫が不足しています",
                )

            inventory.current_stock -= item.quantity

            detail = models.OrderDetail(
                order_id=new_order.order_id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            db.add(detail)

        db.commit()
        return {"status": "success", "order_id": new_order.order_id}

    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
