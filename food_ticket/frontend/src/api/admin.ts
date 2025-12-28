// src/api/admin.ts
import { apiClient } from './client';

export interface Category {
  category_id: number;
  category_name: string;
}

export interface CategoryCreate {
  category_name: string;
}

// ==================== カテゴリAPI ====================

export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/admin/categories');
  return response.data;
};

export const createCategory = async (data: CategoryCreate): Promise<Category> => {
  try {
    const response = await apiClient. post<Category>('/admin/categories', data);
    return response. data;
  } catch (error: any) {
    throw new Error(error.response?.data?. detail || 'カテゴリの追加に失敗しました');
  }
};

export const updateCategory = async (
  categoryId: number,
  data: CategoryCreate
): Promise<Category> => {
  try {
    const response = await apiClient.put<Category>(`/admin/categories/${categoryId}`, data);
    return response.data;
  } catch (error:  any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの更新に失敗しました');
  }
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  try {
    await apiClient.delete(`/admin/categories/${categoryId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの削除に失敗しました');
  }
};