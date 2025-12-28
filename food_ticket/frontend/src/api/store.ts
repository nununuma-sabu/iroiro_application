// src/api/store.ts
import { apiClient } from './client';
import type { Product } from '../types/store';

export const getStoreProducts = async (storeId: number): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>(`/stores/${storeId}/products`);
  return response.data;
};