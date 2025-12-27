// src/types/store.ts
export interface Product {
  product_id: number;
  product_name: string;
  category_name: string;
  price: number;
  stock: number;
  image_url?: string;
}