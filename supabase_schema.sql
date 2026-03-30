-- SQL Schema for ELA App (Supabase)
-- Target: Real Data Persistence

-- 1. UTILS & ENUMS
CREATE TYPE payment_method AS ENUM ('CASH', 'QRIS', 'TRANSFER');
CREATE TYPE transaction_status AS ENUM ('LUNAS', 'HUTANG', 'BATAL');
CREATE TYPE expense_source AS ENUM ('Tunai Kasir', 'Kas Gudang', 'Bank');

-- 2. PRODUCTS & INVENTORY
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, 
  price DECIMAL(12,2) NOT NULL,
  wholesale_price DECIMAL(12,2),
  other_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CUSTOMERS
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  wa_number TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TRANSACTIONS
CREATE TABLE transactions (
  id TEXT PRIMARY KEY, 
  customer_id UUID REFERENCES customers(id),
  cashier_name TEXT,
  date DATE DEFAULT CURRENT_DATE,
  total_sales DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  addon_price DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL,
  payment_method payment_method DEFAULT 'CASH',
  status transaction_status DEFAULT 'LUNAS',
  pay_amount DECIMAL(12,2) DEFAULT 0,
  change_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  qty INTEGER NOT NULL,
  price_per_unit DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. HOLIDAY PACKAGES (PAKET LEBARAN)
CREATE TABLE holiday_packages (
  id TEXT PRIMARY KEY, 
  customer_id UUID REFERENCES customers(id),
  products_summary TEXT,
  total_toples INTEGER DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  payments DECIMAL(12,2)[] DEFAULT '{0,0,0,0,0,0,0,0,0,0,0}', 
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. EXPENSES & FINANCE
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  target TEXT,
  source expense_source DEFAULT 'Tunai Kasir',
  amount DECIMAL(12,2) NOT NULL,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE balances (
  id TEXT PRIMARY KEY, 
  balance DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RETURNS
CREATE TABLE product_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id TEXT REFERENCES transactions(id),
  variant_id UUID REFERENCES product_variants(id),
  qty INTEGER NOT NULL,
  reason TEXT,
  return_to_stock BOOLEAN DEFAULT true,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. STAFF & OPERATIONS
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  base_salary DECIMAL(12,2) DEFAULT 0,
  joining_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  photo_in TEXT,
  photo_out TEXT,
  date DATE DEFAULT CURRENT_DATE,
  location_in TEXT,
  location_out TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  recipe TEXT NOT NULL,
  weight_kg DECIMAL(8,2) DEFAULT 0,
  mika INTEGER DEFAULT 0,
  sedang INTEGER DEFAULT 0,
  besar INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- Izin, Sakit, Cuti
  reason TEXT,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INITIAL BALANCES
INSERT INTO balances (id, balance) VALUES 
('DRAWER', 2450000),
('GUDANG', 15000000),
('BANK', 0)
ON CONFLICT (id) DO NOTHING;
