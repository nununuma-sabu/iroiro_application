// src/types/order.ts
export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderCreate {
  store_id: number;
  attribute_id: number;  // 顔認証で取得したID（今は仮値）
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  take_out_type: string;
}

export interface OrderResponse {
  status: string;
  order_id: number;
}