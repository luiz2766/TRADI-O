-- Run this in the Supabase SQL Editor to set up your tables

-- PRODUCTS TABLE
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ingresso', 'bebida', 'comida', 'outro')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALES TABLE
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'debito', 'credito')),
  type TEXT NOT NULL CHECK (type IN ('portaria', 'loja')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- SALE ITEMS TABLE
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- RLS (Row Level Security) - Simplified for management app
-- Note: Real apps should have stricter policies, these allow auth users to do everything
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON products 
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON sales 
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON sale_items 
  FOR ALL TO authenticated USING (true);
