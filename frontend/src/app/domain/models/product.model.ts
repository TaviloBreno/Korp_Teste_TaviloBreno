export interface Product {
  id: string;
  code: string;
  description: string;
  price: number;
  stockBalance: number;
  createdAt?: string;
  updatedAt?: string | null;
}
