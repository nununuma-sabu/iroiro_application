export interface StoreInfo {
  id: number;
  name: string;
  municipality: string;
  prefecture: string;
}

// JWTトークンと店舗情報を含む
export interface LoginResponse {
  access_token:  string;
  token_type:  string;
  store_info:  StoreInfo;
}