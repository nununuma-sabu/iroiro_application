// src/components/admin/InventoryManager.tsx
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import './InventoryManager.css';

const InventoryManager: React.FC = () => {
  const [inventories, setInventories] = useState<adminApi.Inventory[]>([]);
  const [categories, setCategories] = useState<adminApi.Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // フィルター
  const [selectedStoreId] = useState<number>(1); // 将来的に複数店舗対応
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  
  // 編集中の在庫ID
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingStock, setEditingStock] = useState<number>(0);

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoriesData, categoriesData] = await Promise.all([
        adminApi.getInventories(selectedStoreId, selectedCategoryFilter || undefined),
        adminApi.getCategories(),
      ]);
      setInventories(inventoriesData);
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

  // 在庫編集開始
  const startEditStock = (inventory: adminApi.Inventory) => {
    setEditingId(inventory.inventory_id);
    setEditingStock(inventory.current_stock);
  };

  // 在庫数更新
  const handleUpdateStock = async (inventory: adminApi.Inventory) => {
    if (editingStock < 0) {
      alert('在庫数は0以上である必要があります');
      return;
    }

    try {
      await adminApi.updateInventoryStock(
        inventory.store_id,
        inventory.product_id,
        editingStock
      );
      setEditingId(null);
      fetchData();
      alert('✅ 在庫数を更新しました');
    } catch (err:  any) {
      alert(`❌ ${err.message}`);
    }
  };

  // 販売状態切り替え
  const handleToggleSaleStatus = async (inventory: adminApi.Inventory) => {
    const newStatus = ! inventory.is_on_sale;
    const statusText = newStatus ? '販売中' : '販売停止';
    
    if (! window.confirm(`「${inventory.product_name}」を${statusText}に変更しますか？`)) {
      return;
    }

    try {
      await adminApi.updateInventorySaleStatus(
        inventory. store_id,
        inventory. product_id,
        newStatus
      );
      fetchData();
      alert(`✅ ${statusText}に変更しました`);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  // 在庫数の増減（クイック操作）
  const handleQuickAdjust = async (inventory: adminApi. Inventory, amount: number) => {
    const newStock = inventory.current_stock + amount;
    
    if (newStock < 0) {
      alert('在庫数は0以上である必要があります');
      return;
    }

    try {
      await adminApi.updateInventoryStock(
        inventory.store_id,
        inventory.product_id,
        newStock
      );
      fetchData();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="inventory-manager">
      <div className="header-row">
        <h1>📦 在庫管理</h1>
        <div className="store-info">
          <span>店舗ID: {selectedStoreId}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

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
              onClick={() => setSelectedCategoryFilter(cat. category_id)}
              className={selectedCategoryFilter === cat.category_id ? 'active' : ''}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {/* 在庫一覧 */}
      <div className="inventory-list">
        <h2>在庫一覧 ({inventories.length}件)</h2>
        
        {inventories.length === 0 ? (
          <p className="empty-message">在庫情報が登録されていません</p>
        ) : (
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>商品画像</th>
                  <th>商品名</th>
                  <th>カテゴリ</th>
                  <th>価格</th>
                  <th>在庫数</th>
                  <th>クイック調整</th>
                  <th>販売状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {inventories.map((inventory) => (
                  <tr key={inventory.inventory_id} className={! inventory.is_on_sale ?  'off-sale-row' : ''}>
                    {/* 商品画像 */}
                    <td className="image-cell">
                      {inventory.image_url ? (
                        <img src={inventory. image_url} alt={inventory. product_name} className="product-thumbnail" />
                      ) : (
                        <div className="no-image-small">画像なし</div>
                      )}
                    </td>

                    {/* 商品名 */}
                    <td className="product-name-cell">
                      <strong>{inventory.product_name}</strong>
                    </td>

                    {/* カテゴリ */}
                    <td>
                      <span className="category-tag">{inventory.category_name}</span>
                    </td>

                    {/* 価格 */}
                    <td className="price-cell">
                      ¥{inventory.standard_price.toLocaleString()}
                    </td>

                    {/* 在庫数 */}
                    <td className="stock-cell">
                      {editingId === inventory.inventory_id ? (
                        <div className="stock-edit-input">
                          <input
                            type="number"
                            value={editingStock}
                            onChange={(e) => setEditingStock(Number(e. target.value))}
                            min={0}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className={`stock-display ${inventory.current_stock === 0 ? 'out-of-stock' : ''}`}>
                          {inventory.current_stock}個
                        </span>
                      )}
                    </td>

                    {/* クイック調整 */}
                    <td className="quick-adjust-cell">
                      {editingId === inventory.inventory_id ? (
                        <div className="edit-actions-inline">
                          <button
                            onClick={() => handleUpdateStock(inventory)}
                            className="btn-save-small"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="btn-cancel-small"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div className="quick-buttons">
                          <button
                            onClick={() => handleQuickAdjust(inventory, -10)}
                            className="btn-quick"
                            title="10個減らす"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(inventory, -1)}
                            className="btn-quick"
                            title="1個減らす"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(inventory, 1)}
                            className="btn-quick"
                            title="1個増やす"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(inventory, 10)}
                            className="btn-quick"
                            title="10個増やす"
                          >
                            +10
                          </button>
                        </div>
                      )}
                    </td>

                    {/* 販売状態 */}
                    <td className="status-cell">
                      <button
                        onClick={() => handleToggleSaleStatus(inventory)}
                        className={`status-toggle ${inventory.is_on_sale ? 'on-sale' :  'off-sale'}`}
                      >
                        {inventory.is_on_sale ?  '✅ 販売中' :  '⛔ 販売停止'}
                      </button>
                    </td>

                    {/* 操作 */}
                    <td className="action-cell">
                      {editingId === inventory.inventory_id ? (
                        <span className="editing-label">編集中</span>
                      ) : (
                        <button
                          onClick={() => startEditStock(inventory)}
                          className="btn-edit-small"
                        >
                          在庫変更
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 在庫サマリー */}
      <div className="inventory-summary">
        <h3>📊 在庫サマリー</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">総商品数</div>
            <div className="summary-value">{inventories.length}件</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">販売中</div>
            <div className="summary-value">
              {inventories.filter((i) => i.is_on_sale).length}件
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">販売停止</div>
            <div className="summary-value">
              {inventories.filter((i) => !i.is_on_sale).length}件
            </div>
          </div>
          <div className="summary-card alert">
            <div className="summary-label">在庫切れ</div>
            <div className="summary-value">
              {inventories.filter((i) => i.current_stock === 0).length}件
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;