"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, TrendingUp, Calendar, ChevronDown, 
  Download, Wallet, ArrowRight, Briefcase, CheckCircle2, X, Check,
  Filter, Clock, Edit2, ThumbsDown, Info, AlertCircle, TrendingDown as TrendingDownIcon,
  ArrowDownRight, Scale, Zap, History as HistoryIcon, UserCheck, UserX, Scissors,
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
  
  const [extraBonuses, setExtraBonuses] = useState<Record<string, number>>({});
  const [thrBonuses, setThrBonuses] = useState<Record<string, number>>({});
  const [kasbonMap, setKasbonMap] = useState<Record<string, number>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const fetchPayrollData = async () => {
     const { data: st } = await supabase.from('staff').select('*').order('full_name');
     if (st) setEmployees(st);

     const now = new Date();
     const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
     
     const { data: att } = await supabase.from('attendance_logs').select('*, staff(full_name)').gte('date', firstDay);
     if (att) setAttendance(att);

     const { data: prod } = await supabase.from('production_logs').select('*, staff(full_name)').gte('date', firstDay);
     if (prod) setProductionLogs(prod);

     const { data: kb } = await supabase.from('staff_kasbon').select('*').gte('date', firstDay);
     if (kb) {
        const kMap: Record<string, number> = {};
        kb.forEach(k => {
           kMap[k.staff_id] = (kMap[k.staff_id] || 0) + Number(k.amount);
        });
        setKasbonMap(kMap);
     }
  };

  useEffect(() => {
     fetchPayrollData();
  }, []);

  const TARGET_KG_PED_DAY = 2; 
  const BONUS_PER_KG = 25000; 

  const calculateEmployeeSalary = (empId: string) => {
     const emp = employees.find(e => e.id === empId);
     const base = Number(emp?.base_salary || 2000000);
     const daily_rate = Math.floor(base / 26);
     
     const empProd = productionLogs.filter(p => p.staff_id === empId);
     const totalKg = empProd.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0);
     
     let totalBonus = 0;
     empProd.forEach(p => {
        const excess = Math.max(0, (Number(p.weight_kg) || 0) - TARGET_KG_PED_DAY);
        totalBonus += (excess * BONUS_PER_KG);
     });

     const empAtt = attendance.filter(a => a.staff_id === empId);
     const uniqueDays = new Set(empAtt.map(a => a.date)).size;
     const presencePay = uniqueDays * daily_rate;
     
     const thr = thrBonuses[empId] || 0;
     const extra = extraBonuses[empId] || 0;
     const kasbon = kasbonMap[empId] || 0;

     const total = presencePay + totalBonus + thr + extra - kasbon;
     
     return { base, daily_rate, presencePay, totalBonus, total, daysPresent: uniqueDays, totalKg, thr, extra, kasbon };
  };

  const handleSendPayslip = async (empId: string) => {
    if (!paymentProof) return alert("Upload bukti transfer/pembayaran dulu!");
    setSendingId(empId);
    
    const formData = new FormData();
    formData.append("file", paymentProof);
    formData.append("upload_preset", "ellacakes");
    
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dmjpjmece/image/upload`, {
        method: "POST",
        body: formData,
      });
      const cData = await res.json();
      const proofUrl = cData.secure_url;

      const { base, presencePay, totalBonus, total, thr, extra, kasbon } = calculateEmployeeSalary(empId);
      
      const { error } = await supabase.from('payslips').insert({
        staff_id: empId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        base_salary: base,
        attendance_bonus: presencePay,
        production_bonus: totalBonus,
        allowance: thr,
        extra_bonus: extra,
        kasbon_deduction: kasbon,
        total_net_salary: total,
        payment_proof_url: proofUrl,
        status: 'PAID'
      });

      if (error) {
         if (error.code === '23505') alert("Gaji bulan ini sudah dikirim untuk karyawan ini!");
         else alert("Gagal kirim slip: " + error.message);
      } else {
         alert("Slip gaji berhasil dikirim ke portal pegawai!");
         setPaymentProof(null);
      }
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
         <div>
            <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Dashboard Finansial & Produksi</h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Kalkulasi berbasis harian, bonus, dan input tunjangan (Slip Gaji).</p>
         </div>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 6, borderRadius: 20, width: 'fit-content' }}>
        {[
          { id: 'payroll', label: 'Slip Gaji & Payout', icon: Wallet },
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
             <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Rincian Payout & Kirim Gaji</h3>
             <button onClick={fetchPayrollData} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>REFRESH DATA</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Karyawan</th>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Harian (Fee)</th>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Bonus Prod</th>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Kasbon</th>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Tunj. THR</th>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Bonus Bulanan</th>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Total Bersih</th>
                    <th style={{ padding: '20px 20px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>Kirim Gaji</th>
                  </tr>
               </thead>
               <tbody>
                  {employees.map((emp) => {
                     const { total, daysPresent, totalBonus, presencePay, kasbon } = calculateEmployeeSalary(emp.id);
                     return (
                        <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '20px' }}>
                              <p style={{ margin: 0, fontWeight: 950, fontSize: '14px' }}>{emp.full_name}</p>
                              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{daysPresent} Hari Hadir</p>
                           </td>
                           <td style={{ padding: '20px' }}>
                              <p style={{ margin: 0, fontWeight: 800 }}>Rp {presencePay.toLocaleString('id-ID')}</p>
                              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{Math.floor(emp.base_salary/26).toLocaleString('id-ID')}/hari</p>
                           </td>
                           <td style={{ padding: '20px', color: '#10b981', fontWeight: 900 }}>Rp {totalBonus.toLocaleString('id-ID')}</td>
                           <td style={{ padding: '20px', color: '#ef4444', fontWeight: 900 }}>-Rp {kasbon.toLocaleString('id-ID')}</td>
                           <td style={{ padding: '20px' }}>
                              <input 
                                type="number" 
                                placeholder="Rp..." 
                                value={thrBonuses[emp.id] || ""}
                                onChange={e => setThrBonuses({ ...thrBonuses, [emp.id]: Number(e.target.value) })}
                                style={{ width: 100, padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 800 }}
                              />
                           </td>
                           <td style={{ padding: '20px' }}>
                              <input 
                                type="number" 
                                placeholder="Rp..." 
                                value={extraBonuses[emp.id] || ""}
                                onChange={e => setExtraBonuses({ ...extraBonuses, [emp.id]: Number(e.target.value) })}
                                style={{ width: 100, padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 800 }}
                              />
                           </td>
                           <td style={{ padding: '20px', fontWeight: 950, fontSize: '15px', color: '#0f172a' }}>Rp {total.toLocaleString('id-ID')}</td>
                           <td style={{ padding: '20px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                 <input type="file" accept="image/*" onChange={e => setPaymentProof(e.target.files?.[0] || null)} style={{ fontSize: '10px', width: 150 }} />
                                 <button 
                                   disabled={sendingId === emp.id}
                                   onClick={() => handleSendPayslip(emp.id)}
                                   style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                 >
                                    <FileText size={12}/> {sendingId === emp.id ? 'KIRIM...' : 'KIRIM SLIP'}
                                 </button>
                              </div>
                           </td>
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
