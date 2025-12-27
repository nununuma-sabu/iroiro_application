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
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeId]);

    // 商品と画像のマッピング　※いつかやる
    
  // --- 商品画像を取得するロジック（ここを更新！） ---
  const getProductImage = (productName: string) => {
    if (productName.includes('ハンバーグ')) {
      return '/images/hamburg.jpg';
    }
    if (productName.includes('からあげ')) {
      return '/images/karaage.jpg';
    }
      if (productName.includes('ポテト')) {
      return '/images/potato.jpg';
    }
    // それ以外のメニューは仮の画像
    return `https://picsum.photos/seed/${productName}/400/400`;
  };

  // カート操作ロジック
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        return prev.map((item) =>
          item.product.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.product_id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.product.product_id !== productId);
    });
  };

  const deleteItemCompletely = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.product_id !== productId));
  };

  const clearAllCart = () => {
    if (window.confirm('カートをすべて空にしますか？')) setCart([]);
  };

  const getItemQuantity = (productId: number): number => {
    const item = cart.find((i) => i.product.product_id === productId);
    return item ? item.quantity : 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (loading) return <div className="p-10 text-center text-gray-400 font-sans">読み込み中...</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)] bg-gray-50/50 font-sans">
      
      {/* メイン：商品グリッド */}
      <div className="flex-grow p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Menu</h2>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((product) => {
              const qty = getItemQuantity(product.product_id);
              return (
                <div key={product.product_id} className="bg-white rounded-[2.5rem] p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 relative overflow-hidden group">
                  
                  {/* 画像表示部分 */}
                  <div className="aspect-square rounded-[1.5rem] mb-4 overflow-hidden relative bg-gray-100">
                    <img 
                      src={getProductImage(product.product_name)} 
                      alt={product.product_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-600 shadow-sm">
                      {product.category_name}
                    </div>
                  </div>

                  <div className="mb-14 px-1">
                    <h3 className="font-bold text-gray-800">{product.product_name}</h3>
                    <p className="text-xl font-black text-gray-900 mt-1">¥{product.price.toLocaleString()}</p>
                  </div>

                  <div className="absolute bottom-5 right-5 flex items-center bg-gray-50 rounded-xl p-1 border z-10 shadow-inner">
                    <button onClick={() => removeFromCart(product.product_id)} disabled={qty === 0} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm disabled:opacity-20 font-bold text-gray-600">－</button>
                    <span className="mx-3 font-black text-blue-600">{qty}</span>
                    <button onClick={() => addToCart(product)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm font-bold">＋</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* サイドバー：注文内容 */}
      <div className="w-full lg:w-[420px] bg-white border-l border-gray-100 shadow-2xl p-8 flex flex-col sticky top-[72px] h-[calc(100vh-72px)]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-blue-600 tracking-tight flex items-center">🛒 注文内容</h3>
          {cart.length > 0 && (
            <button onClick={clearAllCart} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">Clear All</button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-300 italic text-sm font-medium">カートは空です</div>
          ) : (
            cart.map((item) => (
              <div key={item.product.product_id} className="bg-gray-50/70 rounded-3xl p-5 border border-gray-100 animate-in fade-in slide-in-from-right-3">
                
                {/* 1行目：名前 と 数量コントローラー（ご要望の配置） */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <img src={getProductImage(item.product.product_name)} alt="" className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm leading-tight">{item.product.product_name}</p>
                      
                      {/* 名前横のコントローラー */}
                      <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                        <button onClick={() => removeFromCart(item.product.product_id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 font-bold">－</button>
                        <span className="px-2 text-xs font-black text-gray-700 min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item.product)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 font-bold">＋</button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteItemCompletely(item.product.product_id)} className="text-gray-300 hover:text-red-500 font-bold text-xl px-2">×</button>
                </div>

                <div className="flex justify-between items-end pl-[52px]">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">¥{item.product.price.toLocaleString()} / unit</p>
                  <p className="font-black text-blue-600 text-lg">¥{(item.product.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 合計金額と確定ボタン */}
        <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total</span>
            <span className="text-4xl font-black text-gray-900 tracking-tighter">¥{totalAmount.toLocaleString()}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xl hover:bg-blue-600 active:scale-[0.98] transition-all disabled:bg-gray-100 disabled:text-gray-300 shadow-xl"
          >
            注文を確定する
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuScreen;