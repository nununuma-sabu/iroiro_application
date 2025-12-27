// src/api/customer.ts
import axios from 'axios';
import type { CustomerAttributeCreate, CustomerAttributeResponse } from '../types/customer';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

export const createCustomerAttribute = async (
  attributeData: CustomerAttributeCreate
): Promise<CustomerAttributeResponse> => {
  const response = await api.post<CustomerAttributeResponse>(
    '/customer-attributes',
    attributeData
  );
  return response.data;
};