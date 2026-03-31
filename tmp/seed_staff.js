const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kcckzltstieigwyduifp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjY2t6bHRzdGllaWd3eWR1aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODgxNzEsImV4cCI6MjA5MDM2NDE3MX0.Ma9-lztFiOjyQ5jYwn4nSFrytJuz4hau32EKPhdC5tA';
const supabase = createClient(supabaseUrl, supabaseKey);

const realStaff = [
  { id: 'ADMIN-001', full_name: 'Admin Owner', role: 'admin', username: 'admin', password_hash: 'admin123', base_salary: 5000000 },
  { id: 'EMP-001', full_name: 'Sarah Ahmed', role: 'cashier', username: 'sarah', password_hash: 'sarah123', base_salary: 3500000 },
  { id: 'EMP-002', full_name: 'Rahmat Hidayat', role: 'employee', username: 'rahmat', password_hash: 'rahmat123', base_salary: 3000000 },
  { id: 'EMP-003', full_name: 'Budi Santoso', role: 'driver', username: 'budi', password_hash: 'budi123', base_salary: 2800000 },
  { id: 'EMP-004', full_name: 'Ani Wijaya', role: 'employee', username: 'ani', password_hash: 'ani123', base_salary: 3200000 }
];

async function seed() {
  console.log("Seeding real staff data...");
  for (const staff of realStaff) {
    const { error } = await supabase.from('staff').upsert(staff, { onConflict: 'username' });
    if (error) console.error(`Error seeding ${staff.username}:`, error.message);
    else console.log(`Seeded ${staff.full_name}`);
  }
}

seed();
