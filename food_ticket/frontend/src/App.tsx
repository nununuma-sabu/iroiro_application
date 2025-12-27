import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import MenuScreen from './components/MenuScreen';
import type { StoreInfo } from './types/auth';

function App() {
  // ログインした店舗の情報を保持するステート
  // 初期値は null (未ログイン)
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  // ログアウト処理：ステートを空にするだけで画面がログイン用に切り替わります
  const handleLogout = () => {
    setStoreInfo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {storeInfo ? (
        /* --- ログイン後のメイン画面 --- */
        <div className="flex flex-col min-h-screen">
          {/* ヘッダー部分：映えるように少し影と光沢をつけています */}
          <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                {/* シンプルなアイコンの代わり */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">{storeInfo.name}</h1>
                <p className="text-xs text-gray-500 font-medium">
                  {storeInfo.prefecture} {storeInfo.municipality}
                </p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors px-4 py-2 rounded-full hover:bg-red-50"
            >
              ログアウト
            </button>
          </header>

          {/* メインコンテンツ：MenuScreenを表示 */}
          <main className="flex-grow">
            <MenuScreen storeId={storeInfo.id} />
          </main>

          {/* フッター：食券機らしい固定エリアの準備 */}
          <footer className="bg-gray-900 text-gray-400 py-4 text-center text-xs">
            © 2026 食券機システム - スマート注文ソリューション
          </footer>
        </div>
      ) : (
        /* --- 未ログイン時の画面 --- */
        <LoginScreen onLoginSuccess={(info) => setStoreInfo(info)} />
      )}
    </div>
  );
}

export default App;