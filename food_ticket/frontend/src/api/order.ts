// src/api/order.ts
import axios from 'axios';
import type { OrderCreate, OrderResponse } from '../types/order';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

export const createOrder = async (orderData: OrderCreate): Promise<OrderResponse> => {
  const response = await api.post<OrderResponse>('/orders', orderData);
  return response.data;
};