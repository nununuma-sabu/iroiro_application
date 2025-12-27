# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

# 整理した各モジュールからインポート
from app.db import models
from app.db.session import SessionLocal
from app.core import security

app = FastAPI(title="食券機シミュレーター API")


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


# DBセッションをリクエストごとに生成・終了するための依存注入用関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 入力データのバリデーション（本来は app/schemas/store.py 等に分けるのがベスト）
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
    # 1. DBから店舗情報を取得
    store = (
        db.query(models.Store)
        .filter(models.Store.store_id == login_data.store_id)
        .first()
    )

    # 2. 店舗の存在確認とパスワード照合
    if not store or not security.verify_password(
        login_data.password, store.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="店舗IDまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. 認証成功（店舗名や地域情報を返して、フロントエンド側で保持させる）
    return {
        "status": "success",
        "store_info": {
            "id": store.store_id,
            "name": store.store_name,
            "municipality": store.municipality.municipality_name,
            "prefecture": store.municipality.prefecture.prefecture_name,
        },
    }


@app.get("/stores/{store_id}/products")
def get_store_products(store_id: int, db: Session = Depends(get_db)):
    """
    指定された店舗で「販売中」かつ「在庫がある」商品一覧を取得する
    """
    # StoreInventory を起点に Product と Category を結合して取得
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

    # フロントエンドが使いやすい形に整形
    results = []
    for item in items:
        results.append(
            {
                "product_id": item.product.product_id,
                "product_name": item.product.product_name,
                "category_name": item.product.category.category_name,
                "price": item.product.standard_price,
                "stock": item.current_stock,
            }
        )

    return results


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
        db.flush()  # ここで order_id を確定させる

        # 2. 注文明細(OrderDetail)の作成と在庫(Inventory)の更新
        for item in order_data.items:
            # 在庫情報の取得
            inventory = (
                db.query(models.StoreInventory)
                .filter(
                    models.StoreInventory.store_id == order_data.store_id,
                    models.StoreInventory.product_id == item.product_id,
                )
                .with_for_update()
                .first()
            )  # 修正中に他の人が買えないようロック

            # 在庫チェック
            if not inventory or inventory.current_stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"商品ID:{item.product_id} の在庫が不足しています",
                )

            # 在庫を減らす
            inventory.current_stock -= item.quantity

            # 明細の追加
            detail = models.OrderDetail(
                order_id=new_order.order_id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            db.add(detail)

        # 全ての問題がなければ確定
        db.commit()
        return {"status": "success", "order_id": new_order.order_id}

    except Exception as e:
        db.rollback()  # エラー時は全ての操作を取り消す
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
