export interface StoreInfo {
  id: number;
  name: string;
  municipality: string;
  prefecture: string;
}

export interface LoginResponse {
  status: string;
  store_info: StoreInfo;
}