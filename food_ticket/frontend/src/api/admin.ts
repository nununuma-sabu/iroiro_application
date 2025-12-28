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
  return response. data;
};

export const createCategory = async (data: CategoryCreate): Promise<Category> => {
  try {
    const response = await apiClient.post<Category>('/admin/categories', data);
    return response.data;
  } catch (error:  any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの追加に失敗しました');
  }
};

export const updateCategory = async (
  categoryId: number,
  data: CategoryCreate
): Promise<Category> => {
  try {
    const response = await apiClient.put<Category>(`/admin/categories/${categoryId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの更新に失敗しました');
  }
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  try {
    await apiClient. delete(`/admin/categories/${categoryId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの削除に失敗しました');
  }
};

// ==================== 商品API ====================

export interface Product {
  product_id:  number;
  product_name:  string;
  category_id:  number;
  category_name: string;
  standard_price: number;
  image_url?:  string;
  stock?:  number;
  is_on_sale?: boolean;
}

export interface ProductCreate {
  product_name: string;
  category_id: number;
  standard_price: number;
  image_url?: string;
  initial_stock?: number;
}

export interface ProductUpdate {
  product_name?: string;
  category_id?: number;
  standard_price?: number;
  image_url?: string;
}

export const getProducts = async (categoryId?: number): Promise<Product[]> => {
  const params = categoryId ? { category_id:  categoryId } : {};
  const response = await apiClient.get<Product[]>('/admin/products', { params });
  return response.data;
};

export const createProduct = async (data: ProductCreate): Promise<Product> => {
  try {
    const response = await apiClient.post<Product>('/admin/products', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || '商品の追加に失敗しました');
  }
};

export const updateProduct = async (
  productId: number,
  data: ProductUpdate
): Promise<Product> => {
  try {
    const response = await apiClient.put<Product>(`/admin/products/${productId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || '商品の更新に失敗しました');
  }
};

export const deleteProduct = async (productId: number): Promise<void> => {
  try {
    await apiClient.delete(`/admin/products/${productId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?. detail || '商品の削除に失敗しました');
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient. post<{ status: string; image_url:  string }>(
      '/admin/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.image_url;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || '画像のアップロードに失敗しました');
  }
};