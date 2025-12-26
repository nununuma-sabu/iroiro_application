# app/schemas/order.py (または main.py 内)
from pydantic import BaseModel
from typing import List

class OrderItem(BaseModel):
    product_id: int
    quantity: int
    unit_price: int

class OrderCreate(BaseModel):
    store_id: int
    attribute_id: int  # 顔認証で取得したID
    items: List[OrderItem]
    total_amount: int
    payment_method: str
    take_out_type: str