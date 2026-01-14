// frontend/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプターでトークンを自動付与
apiClient.interceptors.request.use(
  (config) => {
    // localStorageからトークンを取得
    const token = localStorage. getItem('access_token');
    
    if (token) {
      // Authorizationヘッダーにトークンを設定
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise. reject(error);
  }
);

// レスポンスインターセプターで401エラー時にログアウト
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 認証エラーの場合、トークンをクリアしてログイン画面へ
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // ログイン画面へリダイレクト (必要に応じて)
      // window.location.href = '/';
    }
    return Promise. reject(error);
  }
);