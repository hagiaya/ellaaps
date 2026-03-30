"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Users, Package, 
  ShoppingCart, DollarSign, AlertCircle, 
  ArrowRight, Clock, ChevronRight, Activity, FlaskConical, Target,
  Wallet, Landmark, Plus, X, Home, QrCode
} from "lucide-react";
import { GlassCard, DashboardCard } from "@/components/DashboardCard";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [realExpenses, setRealExpenses] = useState<any[]>([]);
  const [paketHistory, setPaketHistory] = useState<any[]>([]);
  const [realProductions, setRealProductions] = useState<any[]>([]);
  const [uangGudang, setUangGudang] = useState(0); 
  const [uangKasirCash, setUangKasirCash] = useState(0);

  const fetchAll = async () => {
     // Balances
     const { data: inv } = await supabase.from('inventory').select('*');
     if (inv) {
        setUangKasirCash(inv.find((i: any) => i.product_id === 'CASH_DRAWER')?.stock_quantity || 0);
        setUangGudang(inv.find((i: any) => i.product_id === 'WAREHOUSE_VULT')?.stock_quantity || 0);
     }

     // Transactions
     const { data: tx } = await supabase.from('transactions').select('*');
     if (tx) setRealTransactions(tx.map(t => ({ ...t, total: Number(t.grand_total || 0), method: t.payment_method })));

     // Expenses
     const { data: ex } = await supabase.from('expenses').select('*');
     if (ex) setRealExpenses(ex);

     // Paket
     const { data: pk } = await supabase.from('packages').select('*, installments(*)');
     if (pk) {
        setPaketHistory(pk.map(p => ({
           ...p,
           payments: p.installments?.map((i: any) => i.amount) || []
        })));
     }

     // Production
     const { data: pr } = await supabase.from('production_logs').select('*').limit(5).order('created_at', { ascending: false });
     if (pr) setRealProductions(pr);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const financialStats = useMemo(() => {
    const breakdown = realTransactions.reduce((acc, tx) => {
       const m = tx.method?.toUpperCase() || '';
       if (m === 'TUNAI' || m === 'CASH') acc.cash += tx.total;
       else if (m === 'QRIS') acc.qris += tx.total;
       else if (m === 'TRANSFER') acc.transfer += tx.total;
       return acc;
    }, { cash: 0, qris: 0, transfer: 0 });

    let paketTotal = 0;
    paketHistory.forEach(p => {
       const paid = p.payments.reduce((a: number, b: number) => a + b, 0);
       paketTotal += paid;
    });

    const totalRevenue = breakdown.cash + breakdown.qris + breakdown.transfer + paketTotal;
    return { ...breakdown, totalRevenue, paketTotal };
  }, [realTransactions, paketHistory]);

  const totalRevenueToday = financialStats.totalRevenue;
  const uangKasirQRIS = financialStats.qris;
  const uangKasirTransfer = financialStats.transfer;

  const expenseSummary = useMemo(() => {
    return realExpenses.reduce((acc, curr) => {
      acc.total += curr.amount;
      if (curr.category === 'bahan_baku') acc.bahan += curr.amount;
      else if (curr.category === 'operasional') acc.ops += curr.amount;
      else if (curr.category === 'gaji') acc.gaji += curr.amount;
      
      if (curr.source === 'Tunai Kasir') acc.sourceCash += curr.amount;
      else acc.sourceGudang += curr.amount;
      
      return acc;
    }, { total: 0, bahan: 0, ops: 0, gaji: 0, sourceCash: 0, sourceGudang: 0 });
  }, [realExpenses]);
  
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundOption, setFundOption] = useState<'setor' | 'inisialisasi'>('setor');
  const [fundAmount, setFundAmount] = useState<string>("");

  const handleFundConfirmation = async () => {
     const amount = Number(fundAmount);
     if (isNaN(amount) || amount <= 0) {
        alert("Masukkan nominal yang valid!");
        return;
     }

     if (fundOption === 'setor') {
        if (amount > uangKasirCash) {
           alert("Saldo kasir tidak mencukupi untuk setoran sebesar ini!");
           return;
        }
        const newGudang = uangGudang + amount;
        const newKasir = uangKasirCash - amount;
        
        await supabase.from('inventory').upsert({ product_id: 'WAREHOUSE_VULT', stock_quantity: newGudang });
        await supabase.from('inventory').upsert({ product_id: 'CASH_DRAWER', stock_quantity: newKasir });
        
        alert(`Berhasil setor Rp ${amount.toLocaleString('id-ID')} ke gudang!`);
     } else {
        const newGudang = amount;
        await supabase.from('inventory').upsert({ product_id: 'WAREHOUSE_VULT', stock_quantity: newGudang });
        alert(`Modal uang gudang berhasil diinisialisasi: Rp ${amount.toLocaleString('id-ID')}`);
     }

     setFundAmount("");
     setShowFundModal(false);
     fetchAll();
  };
  if (!isMounted) return null;

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header with Fund Setup Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Dashboard Admin</h1>
            <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>Pantau kesehatan keuangan, stok, dan produksi El-A App.</p>
         </div>
         <button 
           onClick={() => setShowFundModal(true)}
           style={{ padding: '12px 24px', background: '#0f172a', color: 'white', borderRadius: '14px', border: 'none', fontWeight: 950, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)' }}
         >
            <Plus size={18} /> ATUR & SETOR DANA
         </button>
      </div>

      {/* Financial Sources Grid - Header Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        <DashboardCard 
          title="Total Pendapatan" 
          value={`Rp ${totalRevenueToday.toLocaleString('id-ID')}`} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="12.4%"
          color="#10b981"
        />
        <DashboardCard 
          title="Total Pengeluaran" 
          value={`Rp ${expenseSummary.total.toLocaleString('id-ID')}`} 
          icon={TrendingDown} 
          trend="down" 
          trendValue="Aktual"
          color="#ef4444"
        />
        <DashboardCard 
          title="Profit (Net)" 
          value={`Rp ${(totalRevenueToday - expenseSummary.total).toLocaleString('id-ID')}`} 
          icon={Activity} 
          color="#f59e0b"
          trend="up"
          trendValue="Bulan Berjalan"
        />
      </div>

      {/* Internal Funds Split Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: -16 }}>
        <DashboardCard 
          title="Uang Gudang" 
          value={`Rp ${uangGudang.toLocaleString('id-ID')}`} 
          icon={Package} 
          color="#64748b"
        />
        <DashboardCard 
          title="Kasir (Cash)" 
          value={`Rp ${uangKasirCash.toLocaleString('id-ID')}`} 
          icon={Wallet} 
          color="#2563eb"
        />
        <DashboardCard 
          title="Kasir (QRIS)" 
          value={`Rp ${uangKasirQRIS.toLocaleString('id-ID')}`} 
          icon={QrCode} 
          color="#8b5cf6"
        />
        <DashboardCard 
          title="Kasir (Transfer)" 
          value={`Rp ${uangKasirTransfer.toLocaleString('id-ID')}`} 
          icon={Landmark} 
          color="#ec4899"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32, alignItems: 'start' }}>
        
        {/* Left Column: Recent Production Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Activity size={20} /> Aktivitas Produksi
             </h2>
          </div>

          <GlassCard style={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                   <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '20px 32px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Nama Produk</th>
                      <th style={{ padding: '20px 32px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Volume</th>
                      <th style={{ padding: '20px 32px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Status</th>
                   </tr>
                </thead>
                <tbody>
                    {realProductions.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                         <td style={{ padding: '24px 32px', fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{log.recipe || 'Produk Baru'}</td>
                         <td style={{ padding: '24px 32px', fontSize: '14px', fontWeight: 800, color: '#2563eb' }}>+ {log.weight_kg} Kg</td>
                         <td style={{ padding: '24px 32px' }}>
                            <span style={{ background: '#f0fdf4', color: '#10b981', fontSize: '10px', fontWeight: 950, padding: '6px 12px', borderRadius: '10px' }}>SUCCESS</span>
                         </td>
                      </tr>
                    ))}
                </tbody>
             </table>
          </GlassCard>
        </div>

        {/* Right Column: Expense Detail Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                <TrendingDown size={20} /> Pengeluaran Terkini
             </h2>
          </div>

          <GlassCard style={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                   <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '20px 32px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Klasifikasi & Tujuan</th>
                      <th style={{ padding: '20px 32px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Sumber</th>
                      <th style={{ padding: '20px 32px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Jumlah</th>
                   </tr>
                </thead>
                <tbody>
                   {realExpenses.map((exp) => (
                     <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '24px 32px' }}>
                           <p style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{exp.category}</p>
                           <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: 0 }}>{exp.target}</p>
                        </td>
                        <td style={{ padding: '24px 32px' }}>
                           <span style={{ fontSize: '12px', fontWeight: 850, color: exp.source === 'Tunai Kasir' ? '#2563eb' : '#64748b' }}>
                              {exp.source === 'Tunai Kasir' ? 'KASIR (C)' : 'GUDANG'}
                           </span>
                        </td>
                        <td style={{ padding: '24px 32px', fontSize: '15px', fontWeight: 950, color: '#ef4444' }}>
                           Rp {exp.amount.toLocaleString('id-ID')}
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </GlassCard>
        </div>

      </div>

      {/* MODAL: Fund Management */}
      <AnimatePresence>
        {showFundModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: 440, background: 'white', borderRadius: '40px', padding: 48, boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                   <h3 style={{ fontSize: '22px', fontWeight: 950, margin: 0 }}>Input & Setor Dana</h3>
                   <button onClick={() => setShowFundModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Opsi Aliran Dana</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                         <button 
                           onClick={() => setFundOption('setor')}
                           style={{ padding: '16px', borderRadius: '16px', border: fundOption === 'setor' ? '2px solid #2563eb' : '1px solid #e2e8f0', background: fundOption === 'setor' ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}
                         >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={20} /></div>
                            <div>
                               <p style={{ fontSize: '13px', fontWeight: 900, margin: 0 }}>Setor Tutup Kas (Harian)</p>
                               <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', margin: 0 }}>Pindahkan Cash Kasir ke Gudang</p>
                            </div>
                         </button>
                         <button 
                           onClick={() => setFundOption('inisialisasi')}
                           style={{ padding: '16px', borderRadius: '16px', border: fundOption === 'inisialisasi' ? '2px solid #10b981' : '1px solid #e2e8f0', background: fundOption === 'inisialisasi' ? '#f0fdf4' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}
                         >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={20} /></div>
                            <div>
                               <p style={{ fontSize: '13px', fontWeight: 900, margin: 0 }}>Inisialisasi Uang Gudang</p>
                               <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', margin: 0 }}>Input modal awal uang gudang</p>
                            </div>
                         </button>
                      </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Jumlah Nominal (Rp)</label>
                      <input 
                        type="number" 
                        value={fundAmount || ''}
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="Rp 0" 
                        style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '24px', fontWeight: 950 }} 
                      />
                   </div>

                   <button onClick={handleFundConfirmation} style={{ width: '100%', padding: '20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 950, marginTop: 12 }}>KONFIRMASI PERUBAHAN</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
