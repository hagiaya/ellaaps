"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, TrendingUp, Calendar, ChevronDown, 
  Download, Wallet, ArrowRight, Briefcase, CheckCircle2, X, Check,
  Filter, Clock, Edit2, ThumbsDown, Info, AlertCircle, TrendingDown as TrendingDownIcon,
  ArrowDownRight, Scale, Zap, History, UserCheck, UserX, Scissors,
  ChevronLeft, ChevronRight, User
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<'payroll' | 'attendance' | 'production' | 'kasbon'>('payroll');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchPayrollData = async () => {
     const { data: st } = await supabase.from('staff').select('*').order('full_name');
     if (st) setEmployees(st);

     const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
     
     const { data: att } = await supabase.from('attendance_logs').select('*, staff(full_name)').gte('date', firstDay);
     if (att) setAttendance(att);

     const { data: prod } = await supabase.from('production_logs').select('*, staff(full_name)').gte('date', firstDay);
     if (prod) setProductionLogs(prod);
  };

  useEffect(() => {
     fetchPayrollData();
  }, []);

  const TARGET_KG_PED_DAY = 2; 
  const BONUS_PER_KG = 25000; 
  const DAILY_RATE = 75000; 

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const calculateEmployeeSalary = (empId: string) => {
     const emp = employees.find(e => e.id === empId);
     const base = Number(emp?.base_salary || 0);
     
     // 1. Production Logs for this employee
     const empProd = productionLogs.filter(p => p.staff_id === empId);
     const totalKg = empProd.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);
     
     // 2. Bonus based on excess
     let totalBonus = 0;
     empProd.forEach(p => {
        const excess = Math.max(0, (Number(p.weight_kg) || 0) - TARGET_KG_PED_DAY);
        totalBonus += (excess * BONUS_PER_KG);
     });

     // 3. Presence Pay (Unique Days in Att logs)
     const empAtt = attendance.filter(a => a.staff_id === empId);
     const uniqueDays = new Set(empAtt.map(a => a.date)).size;
     const presencePay = uniqueDays * DAILY_RATE;
     
     const total = base + presencePay + totalBonus;
     
     return { base, presencePay, totalBonus, total, daysPresent: uniqueDays, totalKg };
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
         <div>
            <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Dashboard Finansial & Produksi</h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Kalkulasi berbasis data produksi dan kehadiran riil.</p>
         </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 6, borderRadius: 20, width: 'fit-content' }}>
        {[
          { id: 'payroll', label: 'Slip Gaji', icon: Wallet },
          { id: 'production', label: 'Laporan Produksi', icon: Scale },
          { id: 'attendance', label: 'Monitoring Absensi', icon: Clock },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{ padding: '10px 20px', borderRadius: 14, border: 'none', background: activeTab === tab.id ? '#ffffff' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#64748b', fontWeight: 950, cursor: 'pointer', boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'payroll' && (
        <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
          <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Rincian Payout Karyawan</h3>
             <button onClick={fetchPayrollData} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>REFRESH DATA</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Karyawan</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Batch Selesai</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Total Berat (Kg)</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Bonus Produksi</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Harian (Fee)</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Gaji Pokok</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Total Bersih</th>
                  </tr>
               </thead>
               <tbody>
                  {employees.map((emp) => {
                     const { total, daysPresent, totalKg, totalBonus, base, presencePay } = calculateEmployeeSalary(emp.id);
                     return (
                        <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '24px 40px', fontWeight: 950 }}>{emp.full_name}</td>
                           <td style={{ padding: '24px 40px' }}>{daysPresent} Sessi</td>
                           <td style={{ padding: '24px 40px' }}>{totalKg.toFixed(1)} Kg</td>
                           <td style={{ padding: '24px 40px', color: '#10b981', fontWeight: 900 }}>+ Rp {totalBonus.toLocaleString('id-ID')}</td>
                           <td style={{ padding: '24px 40px' }}>Rp {presencePay.toLocaleString('id-ID')}</td>
                           <td style={{ padding: '24px 40px' }}>Rp {base.toLocaleString('id-ID')}</td>
                           <td style={{ padding: '24px 40px', fontWeight: 950, fontSize: '16px', color: '#10b981' }}>Rp {total.toLocaleString('id-ID')}</td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {activeTab === 'production' && (
         <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>WAKTU</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>NAMA KARYAWAN</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>PRODUK</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>BERAT (KG)</th>
                    <th style={{ padding: '20px 40px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textAlign: 'center' }}>HASIL (M/S/B)</th>
                  </tr>
               </thead>
               <tbody>
                  {productionLogs.map(log => (
                     <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '20px 40px', fontSize: 13, color: '#64748b' }}>{log.date}</td>
                        <td style={{ padding: '20px 40px', fontWeight: 800 }}>{log.staff?.full_name}</td>
                        <td style={{ padding: '20px 40px' }}>{log.recipe}</td>
                        <td style={{ padding: '20px 40px', fontWeight: 900, color: '#2563eb' }}>{log.weight_kg} Kg</td>
                        <td style={{ padding: '20px 40px', textAlign: 'center' }}>{log.mika} / {log.sedang} / {log.besar}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </GlassCard>
      )}

      {activeTab === 'attendance' && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {attendance.map(log => (
               <GlassCard key={log.id} style={{ padding: 32, borderRadius: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                     <div style={{ width: 44, height: 44, borderRadius: 14, background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950 }}>{log.staff?.full_name?.[0]}</div>
                     <div><h4 style={{ margin: 0, fontSize: 15 }}>{log.staff?.full_name}</h4><span style={{ fontSize: 10, color: '#10b981', fontWeight: 900 }}>CHECKED IN</span></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                     <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16 }}><span style={{ fontSize: 9, color: '#94a3b8' }}>IN</span><p style={{ margin: 0, fontWeight: 900 }}>{log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) : '-'}</p></div>
                     <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16 }}><span style={{ fontSize: 9, color: '#94a3b8' }}>OUT</span><p style={{ margin: 0, fontWeight: 900 }}>{log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) : '-'}</p></div>
                  </div>
               </GlassCard>
            ))}
         </div>
      )}
    </div>
  );
}
