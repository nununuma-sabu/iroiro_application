import { Routes, Route, Link, useLocation } from 'react-router-dom';
import CategoryManager from '../components/admin/CategoryManager';

function AdminPage() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">🍱 Food Ticket 管理画面</h1>
        </div>
      </header>

      <div className="flex">
        {/* サイドバー */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            <Link
              to="/admin/categories"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin/categories'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📁 カテゴリ管理
            </Link>
            
            <Link
              to="/admin/products"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin/products'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🍔 商品管理
            </Link>
            
            <Link
              to="/admin/inventory"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin/inventory'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📦 在庫管理
            </Link>
            
            <Link
              to="/admin/analytics"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin/analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 売上分析
            </Link>

            <hr className="my-4" />

            <Link
              to="/"
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              ← 顧客画面に戻る
            </Link>
          </nav>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="categories" element={<CategoryManager />} />
            <Route path="products" element={<div>商品管理（未実装）</div>} />
            <Route path="inventory" element={<div>在庫管理（未実装）</div>} />
            <Route path="analytics" element={<div>売上分析（未実装）</div>} />
            <Route path="/" element={<div className="text-center text-gray-500 mt-20">左のメニューから選択してください</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;