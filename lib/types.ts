export type Category = 'ingresso' | 'bebida' | 'comida' | 'outro';
export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  created_at?: string;
}

export interface Sale {
  id: string;
  total: number;
  payment_method: PaymentMethod;
  items: SaleItem[];
  created_at: string;
  type: 'portaria' | 'loja';
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}
