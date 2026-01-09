// src/api/admin.ts
import { apiClient } from './client';

export interface Category {
  category_id: number;
  category_name: string;
}

export interface CategoryCreate {
  category_name:   string;
}

// ==================== カテゴリAPI ====================

export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/admin/categories');
  return response.data;
};

export const createCategory = async (data: CategoryCreate): Promise<Category> => {
  try {
    const response = await apiClient.post<Category>('/admin/categories', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの追加に失敗しました');
  }
};

export const updateCategory = async (
  categoryId: number,
  data:   CategoryCreate
): Promise<Category> => {
  try {
    const response = await apiClient. put<Category>(`/admin/categories/${categoryId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの更新に失敗しました');
  }
};

export const deleteCategory = async (categoryId:  number): Promise<void> => {
  try {
    await apiClient.  delete(`/admin/categories/${categoryId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'カテゴリの削除に失敗しました');
  }
};

// ==================== 商品API ====================

export interface Product {
  product_id:  number;
  product_name:  string;
  category_id: number;
  category_name: string;
  standard_price: number;
  image_url?: string;
  stock?:  number;
  is_on_sale?: boolean;
}

export interface ProductCreate {
  product_name:  string;
  category_id:  number;
  standard_price:  number;
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
  const params = categoryId ? { category_id:  categoryId } :   {};
  const response = await apiClient.get<Product[]>('/admin/products', { params });
  return response.data;
};

export const createProduct = async (data: ProductCreate): Promise<Product> => {
  try {
    const response = await apiClient.  post<Product>('/admin/products', data);
    return response.  data;
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
    throw new Error(error.response?.data?. detail || '商品の更新に失敗しました');
  }
};

export const deleteProduct = async (productId: number): Promise<void> => {
  try {
    await apiClient. delete(`/admin/products/${productId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || '商品の削除に失敗しました');
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

// ==================== 在庫管理API ====================

export interface Inventory {
  inventory_id: number;
  store_id: number;
  product_id: number;
  product_name: string;
  category_name: string;
  standard_price: number;
  image_url?: string;
  current_stock:   number;
  is_on_sale:   boolean;
}

export interface InventoryUpdateStock {
  current_stock:  number;
}

export interface InventoryUpdateSaleStatus {
  is_on_sale: boolean;
}

/**
 * 在庫一覧を取得
 * @param storeId - 店舗ID（デフォルト: 1）
 * @param categoryId - カテゴリID（オプション）
 */
export const getInventories = async (
  storeId:  number = 1,
  categoryId?: number
): Promise<Inventory[]> => {
  const params:  any = { store_id: storeId };
  if (categoryId) {
    params.category_id = categoryId;
  }
  const response = await apiClient. get<Inventory[]>('/admin/inventories', { params });
  return response.data;
};

/**
 * 在庫数を更新
 * @param storeId - 店舗ID
 * @param productId - 商品ID
 * @param currentStock - 新しい在庫数
 */
export const updateInventoryStock = async (
  storeId:  number,
  productId: number,
  currentStock: number
): Promise<void> => {
  try {
    await apiClient.put(
      `/admin/inventories/${storeId}/${productId}/stock`,
      { current_stock: currentStock }
    );
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || '在庫数の更新に失敗しました');
  }
};

/**
 * 販売状態を切り替え
 * @param storeId - 店舗ID
 * @param productId - 商品ID
 * @param isOnSale - 販売中かどうか
 */
export const updateInventorySaleStatus = async (
  storeId: number,
  productId:  number,
  isOnSale: boolean
): Promise<void> => {
  try {
    await apiClient.patch(
      `/admin/inventories/${storeId}/${productId}/sale-status`,
      { is_on_sale: isOnSale }
    );
  } catch (error: any) {
    throw new Error(error. response?.data?.detail || '販売状態の更新に失敗しました');
  }
};

// ==================== 売上分析API ====================

/**
 * 売上サマリー
 */
export interface SalesSummary {
  total_sales: number;          // 総売上金額
  total_orders: number;         // 総注文件数
  average_order_value: number;  // 平均客単価
  period_start?:  string;        // 集計期間開始
  period_end?: string;          // 集計期間終了
}

/**
 * 人気商品
 */
export interface PopularProduct {
  product_id: number;
  product_name: string;
  category_name: string;
  image_url?: string;
  total_quantity: number;  // 販売数
  total_sales: number;     // 売上金額
  order_count: number;     // 注文回数
}

/**
 * 売上推移
 */
export interface SalesTrend {
  date: string;                 // 日付（YYYY-MM-DD）
  total_sales: number;          // その日の総売上
  total_orders: number;         // その日の総注文件数
  average_order_value: number;  // その日の平均客単価
}

/**
 * 売上サマリーを取得
 * @param storeId - 店舗ID（デフォルト: 1）
 * @param startDate - 集計開始日（YYYY-MM-DD形式、オプション）
 * @param endDate - 集計終了日（YYYY-MM-DD形式、オプション）
 */
export const getSalesSummary = async (
  storeId: number = 1,
  startDate?: string,
  endDate?: string
): Promise<SalesSummary> => {
  try {
    const params: any = { store_id: storeId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await apiClient. get<SalesSummary>('/admin/sales/summary', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?. data?.detail || '売上サマリーの取得に失敗しました');
  }
};

/**
 * 人気商品ランキングを取得
 * @param storeId - 店舗ID（デフォルト:  1）
 * @param limit - 取得件数（デフォルト: 10）
 * @param startDate - 集計開始日（YYYY-MM-DD形式、オプション）
 * @param endDate - 集計終了日（YYYY-MM-DD形式、オプション）
 */
export const getPopularProducts = async (
  storeId: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<PopularProduct[]> => {
  try {
    const params:  any = { store_id: storeId, limit };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await apiClient.get<PopularProduct[]>('/admin/sales/popular-products', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?. data?.detail || '人気商品の取得に失敗しました');
  }
};

/**
 * 売上推移データを取得
 * @param storeId - 店舗ID（デフォルト: 1）
 * @param days - 過去何日分取得するか（デフォルト:  30）
 */
export const getSalesTrends = async (
  storeId: number = 1,
  days: number = 30
): Promise<SalesTrend[]> => {
  try {
    const params = { store_id: storeId, days };
    const response = await apiClient.get<SalesTrend[]>('/admin/sales/trends', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error. response?.data?.detail || '売上推移の取得に失敗しました');
  }
};