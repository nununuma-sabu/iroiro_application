import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import type { StoreInfo } from './types/auth';

function App() {
  // ログインした店舗の情報を保持する State
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  // ログアウト処理
  const handleLogout = () => setStoreInfo(null);

  return (
    <div className="App">
      {storeInfo ? (
        // ログイン後のメイン画面（今は仮の表示）
        <div style={{ padding: '20px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee' }}>
            <h1>{storeInfo.name}</h1>
            <div>
              <span>{storeInfo.prefecture} {storeInfo.municipality}</span>
              <button onClick={handleLogout} style={{ marginLeft: '20px' }}>ログアウト</button>
            </div>
          </header>
          <main>
            <p>ここにメニュー一覧を表示していきます。</p>
          </main>
        </div>
      ) : (
        // ログインしていない時はログイン画面を表示
        <LoginScreen onLoginSuccess={(info) => setStoreInfo(info)} />
      )}
    </div>
  );
}

export default App;