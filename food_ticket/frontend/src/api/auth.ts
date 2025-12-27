import axios from 'axios';
import type { LoginResponse } from '../types/auth';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

export const loginStore = async (store_id: number, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/login/store', {
    store_id,
    password,
  });
  return response.data;
};