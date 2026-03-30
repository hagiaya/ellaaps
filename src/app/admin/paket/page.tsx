"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Search, Filter, ArrowRight, Eye, Phone,
  CheckCircle2, Clock, AlertCircle, TrendingUp, Wallet, Banknote
} from "lucide-react";
import { GlassCard, DashboardCard } from "@/components/DashboardCard";
import { useState, useMemo, useEffect } from "react";

export default function PaketManagement() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const [paketData, setPaketData] = useState<any[]>([]);

  useEffect(() => {
    const syncData = () => {
       const saved = localStorage.getItem('ELA_PAKET_HISTORY');
       if (saved) setPaketData(JSON.parse(saved));
    };
    syncData();
    const interval = setInterval(syncData, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
     return paketData.reduce((acc, p) => {
        const paid = p.payments.reduce((a: number, b: number) => a + b, 0);
        acc.total += p.total_price;
        acc.paid += paid;
        acc.due += (p.total_price - paid);
        return acc;
     }, { total: 0, paid: 0, due: 0 });
  }, [paketData]);

  if (!isMounted) return null;

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 40 }}>
       
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Histori Paket Lebaran</h1>
             <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>Manajemen angsuran paket kue kering (11x pembayaran).</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <div style={{ position: 'relative', width: 280 }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Cari pelanggan..." style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: '13px' }} />
             </div>
             <button style={{ padding: '12px 20px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '14px', color: '#64748b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Filter size={18}/> Filter</button>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          <DashboardCard title="Total Kontrak Paket" value={`Rp ${stats.total.toLocaleString('id-ID')}`} icon={Package} color="#0f172a" />
          <DashboardCard title="Total Sudah Bayar" value={`Rp ${stats.paid.toLocaleString('id-ID')}`} icon={TrendingUp} color="#10b981" />
          <DashboardCard title="Total Piutang Paket" value={`Rp ${stats.due.toLocaleString('id-ID')}`} icon={Wallet} color="#ef4444" />
       </div>

       <GlassCard style={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1200 }}>
                <thead>
                   <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '20px 24px', fontSize: '11px', color: '#94a3b8', fontWeight: 950, textTransform: 'uppercase' }}>Pelanggan & TX</th>
                      <th style={{ padding: '20px 24px', fontSize: '11px', color: '#94a3b8', fontWeight: 950, textTransform: 'uppercase' }}>Produk & Qty</th>
                      <th style={{ padding: '20px 24px', fontSize: '11px', color: '#94a3b8', fontWeight: 950, textTransform: 'uppercase', textAlign: 'center' }}>Matrix Angsuran (1 - 11)</th>
                      <th style={{ padding: '20px 24px', fontSize: '11px', color: '#94a3b8', fontWeight: 950, textTransform: 'uppercase', textAlign: 'right' }}>Sudah Bayar</th>
                      <th style={{ padding: '20px 24px', fontSize: '11px', color: '#94a3b8', fontWeight: 950, textTransform: 'uppercase', textAlign: 'right' }}>Belum Bayar</th>
                   </tr>
                </thead>
                <tbody>
                   <AnimatePresence>
                   {paketData.map((p, idx) => {
                      const totalPaid = p.payments.reduce((a: number, b: number) => a + b, 0);
                      const due = p.total_price - totalPaid;
                      return (
                         <motion.tr 
                           key={p.id} 
                           initial={{ opacity: 0, y: 10 }} 
                           animate={{ opacity: 1, y: 0 }} 
                           transition={{ delay: idx * 0.05 }}
                           style={{ borderBottom: '1px solid #f1f5f9' }}
                         >
                            <td style={{ padding: '24px' }}>
                               <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 950, display: 'block', marginBottom: 4 }}>{p.id}</span>
                               <strong style={{ fontSize: '15px', color: '#0f172a' }}>{p.customer_name}</strong>
                               <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>Mulai: {p.date}</p>
                            </td>
                            <td style={{ padding: '24px' }}>
                               <p style={{ fontSize: '13px', fontWeight: 800, color: '#475569', margin: 0 }}>{p.products}</p>
                               <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{p.total_toples} Toples • Rp {p.total_price.toLocaleString('id-ID')}</span>
                            </td>
                            <td style={{ padding: '24px' }}>
                               <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                  {p.payments.map((pay: number, i: number) => (
                                     <div 
                                       key={i} 
                                       title={`Cicilan ke-${i+1}: Rp ${pay.toLocaleString('id-ID')}`}
                                       style={{ 
                                          width: 24, 
                                          height: 24, 
                                          borderRadius: 6, 
                                          background: pay > 0 ? '#10b981' : '#f1f5f9',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '9px',
                                          color: pay > 0 ? 'white' : '#cbd5e1',
                                          fontWeight: 950
                                       }}
                                     >
                                        {i + 1}
                                     </div>
                                  ))}
                               </div>
                            </td>
                            <td style={{ padding: '24px', textAlign: 'right' }}>
                               <b style={{ color: '#16a34a', fontSize: '14px' }}>Rp {totalPaid.toLocaleString('id-ID')}</b>
                            </td>
                            <td style={{ padding: '24px', textAlign: 'right' }}>
                               <b style={{ color: due > 0 ? '#ef4444' : '#94a3b8', fontSize: '14px' }}>
                                  {due > 0 ? `Rp ${due.toLocaleString('id-ID')}` : 'LUNAS'}
                               </b>
                            </td>
                         </motion.tr>
                      );
                   })}
                   </AnimatePresence>
                </tbody>
             </table>
          </div>
       </GlassCard>

    </div>
  );
}
