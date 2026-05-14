import { supabase } from './supabase';
import { PaymentMethod, SaleItem } from './types';

export async function registerSale(params: {
  total: number;
  payment_method: PaymentMethod;
  type: 'portaria' | 'loja';
  items: { product_id: string; quantity: number; unit_price: number }[];
}) {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      total: params.total,
      payment_method: params.payment_method,
      type: params.type,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (saleError) throw saleError;

  const itemsPayload = params.items.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(itemsPayload);

  if (itemsError) throw itemsError;

  return sale;
}

export async function deleteSale(id: string) {
  // Items will be deleted via CASCADE if set up in DB, or manual delete
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
