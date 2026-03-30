import { InventoryItem, RecipeItem, Employee, ProductionLog, Transaction, Expense, Customer } from './types';

export const mockExpenses: Expense[] = [
  { id: 'exp1', item: 'Pembelian Telur', amount: 120000, date: '2026-03-29', category: 'bahan_baku', source: 'kasir_cash', target: 'Beli 5kg Telur' },
  { id: 'exp2', item: 'Bayar Listrik Toko', amount: 450000, date: '2026-03-28', category: 'operasional', source: 'uang_gudang', target: 'PLN Maret' },
  { id: 'exp3', item: 'Gaji Sarah', amount: 800000, date: '2026-03-27', category: 'gaji', source: 'uang_gudang', target: 'DP Gaji' },
];

// Raw materials used for BAKING
export const mockRawMaterials: InventoryItem[] = [
  { id: 'raw1', name: 'Tepung Terigu Segitiga Biru', stock: 15400, unit: 'gram', category: 'raw', last_buy_price: 15000, buy_amount: 1000, price_per_unit: 15, reorder_level: 2000 },
  { id: 'raw2', name: 'Mentega Royal Palmia', stock: 5200, unit: 'gram', category: 'raw', last_buy_price: 12000, buy_amount: 500, price_per_unit: 24, reorder_level: 1000 },
  { id: 'raw3', name: 'Telur Ayam (Kiloan)', stock: 8000, unit: 'gram', category: 'raw', last_buy_price: 28000, buy_amount: 1000, price_per_unit: 28, reorder_level: 1500 },
  { id: 'raw4', name: 'Gula Halus Rosi', stock: 6800, unit: 'gram', category: 'raw', last_buy_price: 18000, buy_amount: 1000, price_per_unit: 18, reorder_level: 2000 },
  { id: 'raw5', name: 'Keju Cheddar Kraft', stock: 1200, unit: 'gram', category: 'raw', last_buy_price: 24000, buy_amount: 250, price_per_unit: 96, reorder_level: 500 },
  { id: 'raw6', name: 'Selai Nanas Premium', stock: 4500, unit: 'gram', category: 'raw', last_buy_price: 45000, buy_amount: 1000, price_per_unit: 45, reorder_level: 1000 },
  { id: 'raw7', name: 'Coklat Bubuk Windmolen', stock: 950, unit: 'gram', category: 'raw', last_buy_price: 55000, buy_amount: 500, price_per_unit: 110, reorder_level: 250 },
];

// Finished goods (Selling Products)
export const mockFinishedProducts: InventoryItem[] = [
  { 
    id: 'prod1', 
    name: 'Nastar Premium', 
    stock: 45, unit: 'pcs', category: 'finished', last_buy_price: 0, buy_amount: 0, 
    price_per_unit: 45000, 
    reorder_level: 15,
    variants: [
      { id: 'v1', name: 'Mika', price: 15000, wholesale_price: 13500, other_price: 14000 },
      { id: 'v2', name: 'Toples Sedang', price: 45000, wholesale_price: 40500, other_price: 42000 },
      { id: 'v3', name: 'Toples Besar', price: 85000, wholesale_price: 76500, other_price: 80000 },
    ]
  },
  { 
    id: 'prod2', 
    name: 'Kastengel Keju', 
    stock: 32, unit: 'toples', category: 'finished', last_buy_price: 0, buy_amount: 0, 
    price_per_unit: 55000, 
    reorder_level: 10,
    variants: [
      { id: 'v4', name: 'Mika', price: 20000, wholesale_price: 18000, other_price: 19000 },
      { id: 'v5', name: 'Toples Sedang', price: 55000, wholesale_price: 49500, other_price: 52000 },
      { id: 'v6', name: 'Toples Besar', price: 95000, wholesale_price: 85500, other_price: 90000 },
    ]
  },
  { 
    id: 'prod3', 
    name: 'Putri Salju', 
    stock: 20, unit: 'toples', category: 'finished', last_buy_price: 0, buy_amount: 0, 
    price_per_unit: 40000, 
    reorder_level: 10,
    variants: [
      { id: 'v7', name: 'Mika', price: 15000, wholesale_price: 13500, other_price: 14000 },
      { id: 'v8', name: 'Toples Sedang', price: 40000, wholesale_price: 36000, other_price: 38000 },
      { id: 'v9', name: 'Toples Besar', price: 75000, wholesale_price: 67500, other_price: 70000 },
    ]
  },
];

// Combine all for general inventory views
export const mockInventory: InventoryItem[] = [...mockRawMaterials, ...mockFinishedProducts];

// Master Recipes with Bill of Materials (BOM)
export const mockRecipes: RecipeItem[] = [
  {
    id: 'rec1',
    name: 'Nastar Premium',
    ingredients: [
      { material_id: 'raw1', amount: 500 }, // Terigu
      { material_id: 'raw2', amount: 300 }, // Mentega
      { material_id: 'raw3', amount: 150 }, // Telur
      { material_id: 'raw4', amount: 100 }, // Gula
      { material_id: 'raw6', amount: 400 }, // Selai
    ],
    output_qty: 4, // 1 batch = 4 toples
    output_unit: 'toples',
    base_cost_production: 0, // Calculated later
    selling_price: 75000,
  },
  {
    id: 'rec2',
    name: 'Kastengel Keju',
    ingredients: [
      { material_id: 'raw1', amount: 500 }, // Terigu
      { material_id: 'raw2', amount: 300 }, // Mentega
      { material_id: 'raw3', amount: 100 }, // Telur
      { material_id: 'raw5', amount: 200 }, // Keju
    ],
    output_qty: 3, // 1 batch = 3 toples
    output_unit: 'toples',
    base_cost_production: 0, // Calculated later
    selling_price: 85000,
  },
];

export const mockEmployees: Employee[] = [
  {
    id: 'emp1',
    full_name: 'Sarah Ahmed',
    username: 'sarah',
    role: 'employee',
    joining_date: '2025-01-10',
    base_salary: 3000000,
    bank_info: { bank_name: 'BCA', account_number: '1234567890' },
  },
  {
    id: 'emp2',
    full_name: 'Rahmat Hidayat',
    username: 'rahmat',
    role: 'employee',
    joining_date: '2025-02-15',
    base_salary: 3200000,
    bank_info: { bank_name: 'Mandiri', account_number: '0987654321' },
  },
  {
    id: 'emp3',
    full_name: 'Admin Owner',
    username: 'admin',
    role: 'admin',
    joining_date: '2024-01-01',
    base_salary: 10000000,
    bank_info: { bank_name: 'BCA', account_number: '0000000000' },
  },
];

export const mockProductionLogs: ProductionLog[] = [
  {
    id: 'log1',
    recipe_id: 'rec1',
    employee_id: 'emp1',
    batches: 2,
    total_output: 8,
    total_cost: 320000,
    created_at: '2026-03-29T08:00:00Z',
  },
  {
    id: 'log2',
    recipe_id: 'rec2',
    employee_id: 'emp2',
    batches: 1,
    total_output: 3,
    total_cost: 165000,
    created_at: '2026-03-29T10:00:00Z',
  },
];

export const mockTransactions: Transaction[] = [
  { 
    id: 'TX-001', 
    customer_name: 'Budi Santoso', customer_wa: '08123456789', 
    items: [
      { product_id: 'prod1', name: 'Nastar Premium', qty: 2, price: 45000 },
      { product_id: 'prod2', name: 'Kastengel Keju', qty: 1, price: 55000 }
    ], 
    total: 145000, 
    payment_status: 'paid', method: 'TUNAI', created_at: '2026-03-29T14:20:00Z' 
  },
  { 
    id: 'TX-002', 
    customer_name: 'Ani Wijaya', customer_wa: '08567890123', 
    items: [
      { product_id: 'prod2', name: 'Kastengel Keju', qty: 2, price: 55000 }
    ],
    total: 110000, 
    payment_status: 'paid', method: 'QRIS', created_at: '2026-03-29T15:10:00Z' 
  },
  { 
    id: 'TX-003', 
    customer_name: 'Siti Aminah', customer_wa: '08987654321', 
    items: [
      { product_id: 'prod3', name: 'Brownies Fudgy', qty: 3, price: 32000 }
    ],
    total: 96000, 
    payment_status: 'paid', method: 'TRANSFER', created_at: '2026-03-29T16:45:00Z' 
  },
];
export const mockCustomers: Customer[] = [
  { id: 'C-001', name: 'Budi Anto', wa: '081234567890', total_orders: 12, total_spend: 1450000, last_order_date: '2026-03-29', status: 'active' },
  { id: 'C-002', name: 'Siti Rahma', wa: '081299887766', total_orders: 5, total_spend: 520000, last_order_date: '2026-03-25', status: 'active' },
  { id: 'C-003', name: 'Pak Haji', wa: '085211223344', total_orders: 1, total_spend: 85000, last_order_date: '2026-03-10', status: 'passive' },
  { id: 'C-004', name: 'Ibu Maya', wa: '081122334455', total_orders: 8, total_spend: 920000, last_order_date: '2026-03-28', status: 'active' },
];
