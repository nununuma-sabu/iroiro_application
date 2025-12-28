// src/api/store.ts
import { apiClient } from './client';
import type { Product } from '../types/store';

export const getStoreProducts = async (storeId: number): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>(`/stores/${storeId}/products`);
  return response.data;
};

// 全カテゴリを取得
export interface Category {
  category_id: number;
  category_name: string;
}

export const getAllCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/admin/categories');
  return response. data;
};