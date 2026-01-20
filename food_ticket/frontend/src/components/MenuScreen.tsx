import React, { useEffect, useState } from 'react';
import { getStoreProducts, getAllCategories, type Category } from '../api/store';
import { createOrder } from '../api/order';
import type { Product } from '../types/store';
import type { OrderCreate } from '../types/order';
import toast from 'react-hot-toast'; // alert→トースト対応で追加

interface MenuScreenProps {
  storeId: number;
  attributeId: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// カテゴリごとのデフォルト画像
const DEFAULT_IMAGES:  Record<string, string> = {
  '定食': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  'サイドメニュー': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
  '単品': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
  'ドリンク': 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400',
  'デザート': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
  'スープ': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
  'サラダ': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
};

const MenuScreen: React.FC<MenuScreenProps> = ({ storeId, attributeId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 商品とカテゴリを並行取得
        const [productsData, categoriesData] = await Promise.all([
          getStoreProducts(storeId),
          getAllCategories(),
        ]);
        
        setProducts(productsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  const getProductImage = (product: Product): string => {
    if (product.image_url) {
      return product. image_url;
    }
    
    if (DEFAULT_IMAGES[product.category_name]) {
      return DEFAULT_IMAGES[product.category_name];
    }
    
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80`;
  };

  const addToCart = (product:  Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        return prev.map((item) =>
          item.product.product_id === product.product_id ?  { ...item, quantity: item. quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    // ★カートに入れた時のフィードバック
    toast.success(`${product.product_name} を追加しました`, {
      icon: '🛒',
      duration: 1000, // 短めに表示
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product. product_id === productId ?  { ...item, quantity: item. quantity - 1 } : item
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
    toast('カートを空にしました', { icon: '🗑️' }); // ★追加
  };

  const getItemQuantity = (productId: number): number => {
    const item = cart.find((i) => i.product.product_id === productId);
    return item ? item.quantity : 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;

    if (! window.confirm(`合計 ¥${totalAmount.toLocaleString()} の注文を確定しますか？`)) {
      return;
    }

    setOrdering(true);
    // ★注文中のローディングトースト
    const loadingToast = toast.loading('注文を送信しています...');

    try {
      const orderData: OrderCreate = {
        store_id: storeId,
        attribute_id: attributeId,
        items: cart.map((item) => ({
          product_id: item.product.product_id,
          quantity: item.quantity,
          unit_price: item.product.price,
        })),
        total_amount: totalAmount,
        payment_method: '現金',
        take_out_type: '店内',
      };

      const response = await createOrder(orderData);

      // ★alertからtoast.successへ
      toast.dismiss(loadingToast); // ローディングを消す
      toast.success(`注文が完了しました！\n注文番号: ${response.order_id}`, {
        duration: 5000, // 大事な通知なので長めに
        icon: '🍱',
      });

      setCart([]);

      const updatedProducts = await getStoreProducts(storeId);
      setProducts(updatedProducts || []);
    } catch (error:  any) {
      console.error('Order failed:', error);
      const errorMessage = error.response?.data?.detail || '注文に失敗しました。もう一度お試しください。';
      
      // ★alertからtoast.errorへ
      toast.dismiss(loadingToast);
      toast.error(`エラー: ${errorMessage}`);
    } finally {
      setOrdering(false);
    }
  };

  // カテゴリタブ:  すべて + 全カテゴリ
  const categoryTabs = ['すべて', ... categories.map((c) => c.category_name)];

  const filteredProducts = selectedCategory === 'すべて'
    ? products
    : products.filter((p) => p.category_name === selectedCategory);

  if (loading) return <div className="p-10 text-center text-gray-400 font-sans">読み込み中...</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)] bg-gray-50/50 font-sans">
      {/* メイン：商品グリッド */}
      <div className="flex-grow p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-6">Menu</h2>
            
            {/* カテゴリタブ */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categoryTabs.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts. map((product) => {
              const qty = getItemQuantity(product. product_id);
              return (
                <div
                  key={product.product_id}
                  className="bg-white rounded-[2. 5rem] p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 relative overflow-hidden group"
                >
                  <div className="aspect-square rounded-[1.5rem] mb-4 overflow-hidden relative bg-gray-100">
                    <img
                      src={getProductImage(product)}
                      alt={product.product_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMAGES[product. category_name] || 
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                      }}
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
                    <button
                      onClick={() => removeFromCart(product.product_id)}
                      disabled={qty === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-red-500 font-bold"
                    >
                      －
                    </button>
                    <span className="mx-3 font-black text-blue-600">{qty}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm font-bold"
                    >
                      ＋
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg font-medium">
                このカテゴリには商品がありません
              </p>
            </div>
          )}
        </div>
      </div>

      {/* サイドバー：注文内容 */}
      <div className="w-full lg:w-[420px] bg-white border-l border-gray-100 shadow-2xl p-8 flex flex-col sticky top-[72px] h-[calc(100vh-72px)]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-blue-600 tracking-tight flex items-center">🛒 注文内容</h3>
          {cart.length > 0 && (
            <button
              onClick={clearAllCart}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-300 italic text-sm font-medium">
              カートは空です
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.product_id}
                className="bg-gray-50/70 rounded-3xl p-5 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage(item.product)}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMAGES[item. product.category_name] || 
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm leading-tight">{item.product.product_name}</p>

                      <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                        <button
                          onClick={() => removeFromCart(item.product.product_id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 font-bold"
                        >
                          －
                        </button>
                        <span className="px-2 text-xs font-black text-gray-700 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item.product)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 font-bold"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItemCompletely(item.product. product_id)}
                    className="text-gray-300 hover:text-red-500 font-bold text-xl px-2"
                  >
                    ×
                  </button>
                </div>

                <div className="flex justify-between items-end pl-[52px]">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                    ¥{item.product.price.toLocaleString()} / unit
                  </p>
                  <p className="font-black text-blue-600 text-lg">
                    ¥{(item.product.price * item.quantity).toLocaleString()}
                  </p>
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
            onClick={handleConfirmOrder}
            disabled={cart.length === 0 || ordering}
            className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xl hover:bg-blue-600 active:scale-[0.98] transition-all disabled:bg-gray-100 disabled:text-gray-300 shadow-lg"
          >
            {ordering ? '処理中...' : '注文を確定する'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuScreen;