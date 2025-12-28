// src/api/client.ts（共通のaxiosインスタンス）
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエスト/レスポンスのインターセプター（必要に応じて）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // エラーハンドリング
    console.error('API Error:', error. response?.data || error.message);
    return Promise.reject(error);
  }
);