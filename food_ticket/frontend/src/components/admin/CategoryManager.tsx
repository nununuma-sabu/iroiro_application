// src/components/admin/CategoryManager. tsx
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import './CategoryManager.css';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<adminApi.Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // カテゴリ一覧を取得
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('カテゴリの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // カテゴリ追加
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName. trim()) {
      alert('カテゴリ名を入力してください');
      return;
    }

    try {
      await adminApi.createCategory({ category_name: newCategoryName });
      setNewCategoryName('');
      fetchCategories();
      alert('✅ カテゴリを追加しました');
    } catch (err:  any) {
      alert(`❌ ${err.message}`);
    }
  };

  // カテゴリ編集開始
  const startEdit = (category: adminApi. Category) => {
    setEditingId(category.category_id);
    setEditingName(category.category_name);
  };

  // カテゴリ更新
  const handleUpdate = async (categoryId: number) => {
    if (!editingName.trim()) {
      alert('カテゴリ名を入力してください');
      return;
    }

    try {
      await adminApi.updateCategory(categoryId, { category_name: editingName });
      setEditingId(null);
      setEditingName('');
      fetchCategories();
      alert('✅ カテゴリを更新しました');
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  // カテゴリ削除
  const handleDelete = async (categoryId:  number, categoryName: string) => {
    if (! window.confirm(`本当に「${categoryName}」を削除しますか？`)) {
      return;
    }

    try {
      await adminApi. deleteCategory(categoryId);
      fetchCategories();
      alert('✅ カテゴリを削除しました');
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="category-manager">
      <h1>📁 カテゴリ管理</h1>

      {error && <div className="error-message">{error}</div>}

      {/* 新規追加フォーム */}
      <form onSubmit={handleCreate} className="add-category-form">
        <h2>新しいカテゴリを追加</h2>
        <div className="form-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="カテゴリ名を入力"
            className="category-input"
          />
          <button type="submit" className="btn-primary">
            追加
          </button>
        </div>
      </form>

      {/* カテゴリ一覧 */}
      <div className="category-list">
        <h2>カテゴリ一覧</h2>
        
        {categories.length === 0 ? (
          <p className="empty-message">カテゴリが登録されていません</p>
        ) : (
          <table className="category-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>カテゴリ名</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {categories. map((category) => (
                <tr key={category.category_id}>
                  <td>{category. category_id}</td>
                  <td>
                    {editingId === category.category_id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="category-input-small"
                      />
                    ) : (
                      category. category_name
                    )}
                  </td>
                  <td className="actions">
                    {editingId === category.category_id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(category.category_id)}
                          className="btn-save"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-cancel"
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(category)}
                          className="btn-edit"
                        >
                          編集
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(category. category_id, category.category_name)
                          }
                          className="btn-delete"
                        >
                          削除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;