
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcckzltstieigwyduifp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjY2t6bHRzdGllaWd3eWR1aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODgxNzEsImV4cCI6MjA5MDM2NDE3MX0.Ma9-lztFiOjyQ5jYwn4nSFrytJuz4hau32EKPhdC5tA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdmin() {
  const { data, error } = await supabase
    .from('staff')
    .upsert([
      { 
        id: 'ADMIN-SUPER',
        full_name: 'Super Admin Ela',
        role: 'admin',
        username: 'admin@ela.com',
        password_hash: 'ell4c0m',
        base_salary: 10000000
      }
    ], { onConflict: 'username' })

  if (error) {
    console.error('Gagal membuat Super Admin:', error.message)
  } else {
    console.log('Super Admin Berhasil Dibuat/Update: admin@ela.com / ell4c0m')
  }
}

createAdmin()
