-- SCRIPT UNTUK MEMBUKA AKSES DATABASE ELAAPP (SUPABASE SQL EDITOR)
-- Silahkan Copy-Paste skrip ini ke SQL Editor di Dashboard Supabase Anda and jalankan (Run).

-- 1. DISABLE RLS UNTUK SEMUA TABEL (AGAR BISA INPUT DATA DARI APLIKASI)
ALTER TABLE IF EXISTS staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS holiday_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS production_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory DISABLE ROW LEVEL SECURITY;

-- 2. ATAU JIKA INGIN TETAP AKTIF, GUNAKAN POLICIES UNTUK ANON/PUBLIC (PILIH SALAH SATU)
-- Jalankan bagian di bawah ini jika Anda ingin akses publik tetap bisa baca/tulis tanpa login Supabase Auth.
/*
CREATE POLICY "Enable all for public" ON staff FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON products FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON product_variants FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON transactions FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON transaction_items FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON holiday_packages FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON expenses FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON balances FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON attendance_logs FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON production_logs FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON leave_requests FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON inventory FOR ALL USING (true);
*/

-- DATA AKAN SEGERA BISA TERSIMPAN BEGITU SKRIP INI DIJALANKAN (RUN).
