import React, { useEffect, useState } from 'react';
import { getStoreProducts } from '../api/store';
import type { Product } from '../types/store';

interface MenuScreenProps {
  storeId: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ storeId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getStoreProducts(storeId);
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeId]);

  // カートに追加する処理
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        return prev.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // カートから減らす処理
  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.product_id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.product_id !== productId);
    });
  };

  // 特定の商品が現在カートに何個入っているかを取得するヘルパー関数
  const getItemQuantity = (productId: number): number => {
    const item = cart.find((i) => i.product.product_id === productId);
    return item ? item.quantity : 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (loading) return <div className="text-center py-20 font-medium text-gray-400 font-sans">メニューをロード中...</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)] font-sans selection:bg-blue-100">
      
      {/* --- メインコンテンツ：商品グリッド --- */}
      <div className="flex-grow p-6 lg:p-10 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
              Menu <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
            </h2>
            <p className="text-gray-500 font-medium mt-1">お好きなメニューをタップして注文に追加してください</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((product) => {
              const quantity = getItemQuantity(product.product_id);
              
              return (
                <div 
                  key={product.product_id}
                  className="group relative bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col"
                >
                  {/* 商品画像エリア */}
                  <div className="aspect-square bg-gray-50 rounded-[1.5rem] mb-5 flex items-center justify-center overflow-hidden relative">
                    <span className="text-gray-300 font-bold group-hover:scale-105 transition-transform duration-700">
                      {product.product_name}
                    </span>
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-gray-500 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl font-bold border border-gray-100 shadow-sm">
                        {product.category_name}
                      </span>
                    </div>
                  </div>

                  {/* 商品情報 */}
                  <div className="px-2 mb-14">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                      {product.product_name}
                    </h3>
                    <p className="text-2xl font-black text-gray-900">
                      ¥{product.price.toLocaleString()}
                    </p>
                  </div>

                  {/* 数量コントローラー (商品カード内) */}
                  <div className="absolute bottom-5 right-5 flex items-center bg-gray-100 rounded-2xl p-1.5 shadow-inner">
                    {/* 減らすボタン */}
                    <button 
                      onClick={() => removeFromCart(product.product_id)}
                      disabled={quantity === 0}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        quantity === 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-500 active:scale-90'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* 現在の個数表示 */}
                    <span className={`mx-4 font-black text-lg transition-colors ${quantity > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {quantity}
                    </span>

                    {/* 増やすボタン */}
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 active:scale-90 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- サイドバー：現在の注文状況 --- */}
      <div className="w-full lg:w-[400px] bg-white border-l border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-8 flex flex-col sticky top-[72px] h-[calc(100vh-72px)]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black flex items-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            注文内容
          </h3>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
            {cart.length} items
          </span>
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium italic">カートが空です</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.product_id} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 animate-in fade-in slide-in-from-right-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-grow">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{item.product.product_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-tight">¥{item.product.price.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <p className="font-black text-blue-600 text-lg">¥{(item.product.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total</span>
            <span className="text-4xl font-black text-gray-900 tracking-tighter">¥{totalAmount.toLocaleString()}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xl hover:bg-blue-600 active:scale-[0.98] transition-all disabled:bg-gray-100 disabled:text-gray-300 shadow-xl shadow-gray-200 flex items-center justify-center space-x-3 group"
          >
            <span>注文を確定する</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuScreen;