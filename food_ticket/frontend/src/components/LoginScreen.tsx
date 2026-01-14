// frontend/src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { loginStore } from '../api/auth';
import type { StoreInfo } from '../types/auth';

interface LoginScreenProps {
  onLoginSuccess: (info: StoreInfo) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [storeId, setStoreId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React. FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginStore(Number(storeId), password);
      
      // JWTトークンをlocalStorageに保存
      localStorage.setItem('access_token', response.access_token);
      
      // 店舗情報を親コンポーネントに渡す
      onLoginSuccess(response.store_info);
    } catch (err:  any) {
      setError(err.response?.data?.detail || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '350px', margin: '50px auto' }}>
      <h2>店舗ログイン</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="storeId" style={{ display: 'block' }}>店舗ID: </label>
          <input
            id="storeId"
            type="number"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus: ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="IDを入力"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block' }}>パスワード:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus: ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="パスワードを入力"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        
        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled: opacity-50 disabled:cursor-not-allowed"
          style={{ width: '100%' }}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;