export type InventoryItem = {
  id: string;
  name: string;
  stock_gram_ml: number;
  last_buy_price: number;
  unit: 'gram' | 'ml';
};

export type RecipeItem = {
  id: string;
  name: string;
  composition: {
    material_id: string;
    amount: number;
  }[];
  yield_per_kg_pcs: number;
  yield_per_kg_toples: number;
  yield_per_kg_mika: number;
};

export type Employee = {
  id: string;
  full_name: string;
  role: 'admin' | 'employee' | 'cashier';
  base_salary: number;
  bank_info: {
    bank_name: string;
    account_number: string;
  };
};

export type DailyTask = {
  id: string;
  employee_id: string;
  recipe_id: string;
  dough_weight_kg: number;
  actual_output_qty: number;
  output_unit: 'pcs' | 'toples' | 'mika';
  bonus_earned: number;
  created_at: string;
};

export type Attendance = {
  id: string;
  employee_id: string;
  check_in: string;
  check_out?: string;
  gps_coords: { lat: number; lng: number };
  photo_url: string;
  status: 'present' | 'late' | 'sick' | 'leave';
};
