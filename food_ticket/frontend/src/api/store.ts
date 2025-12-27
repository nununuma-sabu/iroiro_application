// src/api/store.ts
import axios from 'axios';
import type { Product } from '../types/store';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

export const getStoreProducts = async (storeId: number): Promise<Product[]> => {
  const response = await api.get<Product[]>(`/stores/${storeId}/products`);
  return response.data;
};