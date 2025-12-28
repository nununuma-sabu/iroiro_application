// src/components/admin/ProductManager. tsx
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import './ProductManager.css';

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<adminApi.Product[]>([]);
  const [categories, setCategories] = useState<adminApi.Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // フィルター
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  
  // 新規追加フォーム
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<adminApi.ProductCreate>({
    product_name: '',
    category_id: 1,
    standard_price: 0,
    image_url: '',
    initial_stock: 0,
  });
  
  // 編集フォーム
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<adminApi.ProductUpdate>({});
  
  // 画像アップロード
  const [uploading, setUploading] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<'new' | 'edit' | null>(null);

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        adminApi.getProducts(selectedCategoryFilter || undefined),
        adminApi.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategoryFilter]);

  // 画像アップロード処理
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target:  'new' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (! file) return;

    setUploading(true);
    setUploadingFor(target);

    try {
      const imageUrl = await adminApi.uploadImage(file);
      
      if (target === 'new') {
        setNewProduct((prev) => ({ ...prev, image_url: imageUrl }));
      } else {
        setEditingProduct((prev) => ({ ...prev, image_url: imageUrl }));
      }
      
      alert('✅ 画像をアップロードしました');
    } catch (err:  any) {
      alert(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      setUploadingFor(null);
    }
  };

  // 商品追加
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.product_name.trim()) {
      alert('商品名を入力してください');
      return;
    }

    try {
      await adminApi.createProduct(newProduct);
      setShowAddForm(false);
      setNewProduct({
        product_name: '',
        category_id:  categories[0]?.category_id || 1,
        standard_price: 0,
        image_url:  '',
        initial_stock: 0,
      });
      fetchData();
      alert('✅ 商品を追加しました');
    } catch (err:  any) {
      alert(`❌ ${err.message}`);
    }
  };

  // 編集開始
  const startEdit = (product: adminApi.Product) => {
    setEditingId(product.product_id);
    setEditingProduct({
      product_name: product.product_name,
      category_id: product.category_id,
      standard_price: product.standard_price,
      image_url: product.image_url,
    });
  };

  // 商品更新
  const handleUpdate = async (productId: number) => {
    try {
      await adminApi. updateProduct(productId, editingProduct);
      setEditingId(null);
      setEditingProduct({});
      fetchData();
      alert('✅ 商品を更新しました');
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  // 商品削除
  const handleDelete = async (productId: number, productName: string) => {
    if (! window.confirm(`本当に「${productName}」を削除しますか？\n※在庫情報も削除されます`)) {
      return;
    }

    try {
      await adminApi.deleteProduct(productId);
      fetchData();
      alert('✅ 商品を削除しました');
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="product-manager">
      <div className="header-row">
        <h1>🍔 商品管理</h1>
        <button
          onClick={() => setShowAddForm(! showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'キャンセル' : '+ 新規追加'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* 新規追加フォーム */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="add-product-form">
          <h2>新しい商品を追加</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>商品名 *</label>
              <input
                type="text"
                value={newProduct.product_name}
                onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                placeholder="例:  ハンバーグ定食"
                required
              />
            </div>

            <div className="form-group">
              <label>カテゴリ *</label>
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}
              >
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>価格（円） *</label>
              <input
                type="number"
                value={newProduct.standard_price}
                onChange={(e) => setNewProduct({ ...newProduct, standard_price: Number(e. target.value) })}
                min={0}
                required
              />
            </div>

            <div className="form-group">
              <label>初期在庫数</label>
              <input
                type="number"
                value={newProduct.initial_stock || 0}
                onChange={(e) => setNewProduct({ ...newProduct, initial_stock: Number(e.target.value) })}
                min={0}
              />
            </div>
          </div>

          <div className="form-group">
            <label>商品画像</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'new')}
              disabled={uploading && uploadingFor === 'new'}
            />
            {uploading && uploadingFor === 'new' && <p className="uploading-text">アップロード中...</p>}
            {newProduct.image_url && (
              <div className="image-preview">
                <img src={newProduct.image_url} alt="プレビュー" />
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary btn-large">
            追加する
          </button>
        </form>
      )}

      {/* フィルター */}
      <div className="filter-section">
        <label>カテゴリでフィルター:  </label>
        <div className="filter-buttons">
          <button
            onClick={() => setSelectedCategoryFilter(null)}
            className={selectedCategoryFilter === null ? 'active' : ''}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryFilter(cat.category_id)}
              className={selectedCategoryFilter === cat.category_id ? 'active' : ''}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {/* 商品一覧 */}
      <div className="product-list">
        <h2>商品一覧 ({products.length}件)</h2>
        
        {products.length === 0 ? (
          <p className="empty-message">商品が登録されていません</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.product_id} className="product-card">
                {editingId === product.product_id ? (
                  // 編集モード
                  <div className="edit-mode">
                    <div className="form-group">
                      <label>商品名</label>
                      <input
                        type="text"
                        value={editingProduct.product_name || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>カテゴリ</label>
                      <select
                        value={editingProduct.category_id || product.category_id}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category_id: Number(e.target.value) })}
                      >
                        {categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat. category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>価格（円）</label>
                      <input
                        type="number"
                        value={editingProduct.standard_price || 0}
                        onChange={(e) => setEditingProduct({ ... editingProduct, standard_price:  Number(e.target.value) })}
                        min={0}
                      />
                    </div>

                    <div className="form-group">
                      <label>画像</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'edit')}
                        disabled={uploading && uploadingFor === 'edit'}
                      />
                      {uploading && uploadingFor === 'edit' && <p className="uploading-text">アップロード中...</p>}
                      {editingProduct.image_url && (
                        <div className="image-preview-small">
                          <img src={editingProduct.image_url} alt="プレビュー" />
                        </div>
                      )}
                    </div>

                    <div className="edit-actions">
                      <button onClick={() => handleUpdate(product.product_id)} className="btn-save">
                        保存
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-cancel">
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <div className="product-image">
                      {product.image_url ?  (
                        <img src={product.image_url} alt={product.product_name} />
                      ) : (
                        <div className="no-image">画像なし</div>
                      )}
                      <span className="category-badge">{product.category_name}</span>
                    </div>

                    <div className="product-info">
                      <h3>{product.product_name}</h3>
                      <p className="price">¥{product.standard_price. toLocaleString()}</p>
                      <div className="stock-info">
                        <span>在庫: {product.stock !== null ? `${product.stock}個` : '未設定'}</span>
                        {product.is_on_sale !== null && (
                          <span className={`status ${product.is_on_sale ?  'on-sale' : 'off-sale'}`}>
                            {product.is_on_sale ? '販売中' : '販売停止'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="product-actions">
                      <button onClick={() => startEdit(product)} className="btn-edit">
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(product.product_id, product.product_name)}
                        className="btn-delete"
                      >
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;