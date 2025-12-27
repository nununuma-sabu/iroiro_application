# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import datetime

# 整理した各モジュールからインポート
from app.db import models
from app.db.session import SessionLocal
from app.core import security

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


# 🆕 顧客属性登録用スキーマ
class CustomerAttributeCreate(BaseModel):
    store_id: int
    age_group: str
    gender: str


# DBセッションをリクエストごとに生成・終了するための依存注入用関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 入力データのバリデーション
class StoreLogin(BaseModel):
    store_id: int
    password: str


@app.get("/")
def read_root():
    return {"message": "Vending Machine API is running"}


@app.post("/login/store")
def login_store(login_data: StoreLogin, db: Session = Depends(get_db)):
    """
    店舗IDとパスワードで認証し、店舗情報を返すAPI
    """
    store = (
        db.query(models.Store)
        .filter(models.Store.store_id == login_data.store_id)
        .first()
    )

    if not store or not security.verify_password(
        login_data.password, store.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="店舗IDまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "status": "success",
        "store_info": {
            "id": store.store_id,
            "name": store.store_name,
            "prefecture": store.municipality.prefecture.prefecture_name,
            "municipality": store.municipality.municipality_name,
        },
    }


@app.get("/stores/{store_id}/products")
def get_store_products(store_id: int, db: Session = Depends(get_db)):
    """
    指定された店舗で「販売中」かつ「在庫がある」商品一覧を取得する
    """
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
                "image_url": item.product.image_url,  # 🆕 追加
            }
        )

    return results


# 🆕 顧客属性登録API
@app.post("/customer-attributes")
def create_customer_attribute(
    attribute_data: CustomerAttributeCreate, db: Session = Depends(get_db)
):
    """
    顧客の年齢層・性別を登録し、attribute_idを返す
    """
    try:
        # 新しい顧客属性レコードを作成
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


@app.post("/orders")
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """
    注文を受け付け、在庫を減らし、注文履歴を保存する
    """
    try:
        # 1. 注文(Order)テーブルの作成
        new_order = models.Order(
            store_id=order_data.store_id,
            attribute_id=order_data.attribute_id,
            total_amount=order_data.total_amount,
            payment_method=order_data.payment_method,
            take_out_type=order_data.take_out_type,
        )
        db.add(new_order)
        db.flush()

        # 2. 注文明細(OrderDetail)の作成と在庫(Inventory)の更新
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
