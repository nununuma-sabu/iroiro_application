// src/types/customer.ts
export interface CustomerAttribute {
  attribute_id: number;
  store_id: number;
  age_group: string;
  gender: string;
  scanned_at: string;
}

export interface CustomerAttributeCreate {
  store_id: number;
  age_group: string;
  gender: string;
}

export interface CustomerAttributeResponse {
  attribute_id: number;
  store_id: number;
  age_group: string;
  gender: string;
  scanned_at: string;
}