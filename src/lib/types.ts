export type ProductVariant = {
  id: string;
  name: string;
  price: number; // Main Price (Harga Utama)
  wholesale_price?: number;
  other_price?: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  stock: number; // in unit (gram, ml, pcs, toples)
  unit: 'gram' | 'ml' | 'pcs' | 'toples' | 'mika' | 'kg';
  category: 'raw' | 'finished';
  last_buy_price: number; // Total price of last purchase
  buy_amount: number; // Amount of last purchase (e.g. 1000g)
  price_per_unit: number; // Calculated price per gram/ml
  reorder_level: number;
  image_url?: string;
  variants?: ProductVariant[];
};

export type BOMItem = {
  material_id: string;
  amount: number; // weight in grams or ml for this recipe batch
};

export type RecipeItem = {
  id: string;
  name: string;
  ingredients: BOMItem[];
  output_qty: number; // How many (pcs/toples) this recipe produces
  output_unit: 'pcs' | 'toples' | 'mika';
  base_cost_production: number; // Calculated from ingredients
  selling_price: number; // Price set for POS
};

export type ProductionLog = {
  id: string;
  recipe_id: string;
  employee_id: string;
  batches: number; // How many batches produced
  total_output: number; 
  total_cost: number;
  created_at: string;
};

export type Employee = {
  id: string;
  full_name: string;
  username: string;
  password?: string;
  nik?: string;
  dob?: string;
  phone?: string;
  address?: string;
  photo_url?: string;
  role: 'admin' | 'employee' | 'cashier' | 'driver';
  joining_date: string;
  base_salary: number;
  bank_info: {
    bank_name: string;
    account_number: string;
  };
};

export type Attendance = {
  id: string;
  employee_id: string;
  check_in: string;
  check_out?: string;
  gps_coords: { lat: number; lng: number };
  photo_url: string;
  status: 'present' | 'late' | 'sick' | 'leave' | 'alpha';
};

export type Transaction = {
  id: string;
  items: {
    product_id: string;
    variant_id?: string;
    name: string;
    qty: number;
    price: number;
  }[];
  total: number;
  customer_name: string;
  customer_wa: string;
  payment_status: 'paid' | 'pending';
  method: 'TUNAI' | 'QRIS' | 'TRANSFER';
  created_at: string;
};

export type Expense = {
  id: string;
  item: string;
  amount: number;
  date: string;
  receipt_photo?: string;
  category: 'bahan_baku' | 'operasional' | 'gaji' | 'lainnya';
  source: 'kasir_cash' | 'uang_gudang';
  target: string; // Tujuan Pengeluaran
};

export type Customer = {
  id: string;
  name: string;
  wa: string;
  total_orders: number;
  total_spend: number;
  last_order_date: string;
  status: 'active' | 'passive';
};
