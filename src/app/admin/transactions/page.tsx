"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Search as SearchIcon, 
  ChevronLeft, 
  Calendar, 
  Download, 
  Filter, 
  Check, 
  X,
  CreditCard,
  QrCode, 
  Landmark,
  ArrowUpRight,
  Receipt,
  Phone
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { GlassCard } from "@/components/DashboardCard";
import { supabase } from "@/lib/supabase";
import { Transaction, Expense } from "@/lib/types";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'paket'>('sales');
  const [searchTerm, setSearchTerm] = useState("");
  const [expenseSearchTerm, setExpenseSearchTerm] = useState("");
  const [paketSearchTerm, setPaketSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [paketHistory, setPaketHistory] = useState<any[]>([]);
  const [cashDrawer, setCashDrawer] = useState(0);

  const [realExpenses, setRealExpenses] = useState<any[]>([]);

  const fetchAll = async () => {
    // Fetch Transactions
    const { data: tx } = await supabase
       .from('transactions')
       .select('*, customers(name, wa_number)')
       .order('created_at', { ascending: false });
       
    if (tx) {
       setRealTransactions(tx.map(t => ({ 
          ...t, 
          total: Number(t.grand_total || 0), 
          method: t.payment_method,
          customer_name: t.customers?.name || "Pelanggan Umum",
          customer_wa: t.customers?.wa_number || "-"
       })));
    }

    // Fetch Expenses
    const { data: ex } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (ex) setRealExpenses(ex);

    // Fetch Paket
    const { data: pk } = await supabase.from('packages').select('*, installments(*)');
    if (pk) {
      const formatted = pk.map(p => ({
        ...p,
        payments: p.installments?.map((i: any) => i.amount) || []
      }));
      setPaketHistory(formatted);
    }

    // Fetch Cash Drawer (Setting/Balance from warehouse or generic laci)
    const { data: dw } = await supabase.from('inventory').select('stock_quantity').eq('product_id', 'CASH_DRAWER').single();
    if (dw) setCashDrawer(dw.stock_quantity);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const paketTransactions = useMemo(() => {
    const allPayments: any[] = [];
    paketHistory.forEach(p => {
       p.payments.forEach((amt: number, idx: number) => {
          if (amt > 0) {
             allPayments.push({
                id: `${p.id}-P${idx+1}`,
                customer_name: p.customer_name,
                products: p.products,
                amount: amt,
                payment_no: idx + 1,
                date: '2026-03-30',
             });
          }
       });
    });
    return allPayments.filter(p => p.customer_name.toLowerCase().includes(paketSearchTerm.toLowerCase()));
  }, [paketHistory, paketSearchTerm]);

  const filteredTransactions = useMemo(() => {
    return realTransactions.map(tx => ({
      ...tx,
      customer_name: tx.customer_name || "Pelanggan Umum",
      customer_wa: tx.customer_wa || "-",
      addon: tx.addon || 0,
      status: tx.status || "LUNAS",
      created_at: tx.date || "2026-03-30"
    })).filter(tx => {
      const matchSearch = tx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMethod = methodFilter === "all" || tx.method === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [searchTerm, methodFilter, realTransactions]);

  const totalExpenses = useMemo(() => {
    return realExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [realExpenses]);

  const filteredExpenses = useMemo(() => {
    return realExpenses.filter(ex => 
       ex.purpose?.toLowerCase().includes(expenseSearchTerm.toLowerCase()) ||
       ex.category?.toLowerCase().includes(expenseSearchTerm.toLowerCase())
    );
  }, [realExpenses, expenseSearchTerm]);

  const revenueBreakdown = useMemo(() => {
    const breakdown = realTransactions.reduce((acc, curr) => {
      const method = curr.method?.toUpperCase() || '';
      if (method === 'TUNAI' || method === 'CASH') {
        acc.cash += curr.total;
      } else if (method === 'QRIS') {
        acc.qris += curr.total;
      } else if (method === 'TRANSFER') {
        acc.transfer += curr.total;
      }
      return acc;
    }, { cash: 0, qris: 0, transfer: 0 });

    // Include installment payments from Paket
    let paketTotal = 0;
    paketHistory.forEach(p => {
       paketTotal += p.payments.reduce((a: number, b: number) => a + b, 0);
    });
    
    // Assume all paket payments are cash for the Summary card matching the drawer
    breakdown.cash += paketTotal; 
    
    const total = breakdown.cash + breakdown.qris + breakdown.transfer;
    return { ...breakdown, total };
  }, [realTransactions, paketHistory]);

  const totalRevenue = Number(revenueBreakdown.total || 0);
  
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Riwayat Transaksi</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Monitoring arus kas dan detail pembayaran pelanggan.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="primary-button" style={{ borderRadius: 14, height: 52, padding: '0 32px' }}><Download size={20} /> Ekspor Laporan</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
         <GlassCard style={{ display: 'flex', borderRadius: '24px', overflow: 'hidden' }}>
           <div style={{ flex: 1, padding: '24px 32px' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Omzet Total</p>
              <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {totalRevenue.toLocaleString('id-ID')}</h3>
           </div>
           <div style={{ flex: 1, padding: '24px 32px', borderLeft: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Saldo Tunai (Laci)</p>
              <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#16a34a', margin: 0 }}>Rp {cashDrawer.toLocaleString('id-ID')}</h3>
           </div>
           <div style={{ flex: 1, padding: '24px 32px', borderLeft: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }}>Total QRIS</p>
              <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#2563eb', margin: 0 }}>Rp {revenueBreakdown.qris.toLocaleString('id-ID')}</h3>
           </div>
           <div style={{ flex: 1, padding: '24px 32px', borderLeft: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, color: '#ec4899', textTransform: 'uppercase', marginBottom: 8 }}>Total Transfer</p>
              <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#ec4899', margin: 0 }}>Rp {revenueBreakdown.transfer.toLocaleString('id-ID')}</h3>
           </div>
         </GlassCard>
      </div>

      <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 6, borderRadius: 20, width: 'fit-content' }}>
         <button onClick={() => setActiveTab('sales')} style={{ padding: '12px 24px', borderRadius: 16, border: 'none', background: activeTab === 'sales' ? '#ffffff' : 'transparent', fontWeight: 900, cursor: 'pointer' }}>Penjualan</button>
         <button onClick={() => setActiveTab('expenses')} style={{ padding: '12px 24px', borderRadius: 16, border: 'none', background: activeTab === 'expenses' ? '#ffffff' : 'transparent', fontWeight: 900, cursor: 'pointer' }}>Pengeluaran</button>
         <button onClick={() => setActiveTab('paket')} style={{ padding: '12px 24px', borderRadius: 16, border: 'none', background: activeTab === 'paket' ? '#ffffff' : 'transparent', fontWeight: 900, cursor: 'pointer' }}>Paket Lebaran</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sales' ? (
          <motion.div key="sales" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
                   <div style={{ position: 'relative', width: 300 }}>
                      <SearchIcon size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" placeholder="Cari pelanggan..." value={searchTerm || ''} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 42px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600 }} />
                   </div>
                   <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 800 }}>
                      <option value="all">Semua Metode</option>
                      <option value="TUNAI">TUNAI</option>
                      <option value="QRIS">QRIS</option>
                      <option value="TRANSFER">TRANSFER</option>
                   </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#f8fafc' }}>
                         <tr>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Pelanggan</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>WhatsApp</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Tanggal</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Metode</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Addon</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                            <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>ID</th>
                         </tr>
                      </thead>
                      <tbody>
                         {filteredTransactions.map((tx) => (
                           <tr key={tx.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '20px 24px' }}><span style={{ fontWeight: 900, fontSize: '14px' }}>{tx.customer_name}</span></td>
                              <td style={{ padding: '20px 24px' }}><span style={{ fontWeight: 700, fontSize: '13px', color: '#64748b' }}>{tx.customer_wa}</span></td>
                              <td style={{ padding: '20px 24px' }}><span style={{ fontWeight: 700, fontSize: '13px', color: '#64748b' }}>{tx.created_at.split('T')[0]}</span></td>
                              <td style={{ padding: '20px 24px' }}>
                                 <span style={{ fontSize: '11px', fontWeight: 950, color: tx.method === 'QRIS' ? '#10b981' : (tx.method === 'TUNAI' ? '#f59e0b' : '#3b82f6') }}>{tx.method}</span>
                              </td>
                              <td style={{ padding: '20px 24px' }}>
                                 <span style={{ fontSize: '10px', fontWeight: 950, background: tx.status === 'LUNAS' ? '#f0fdf4' : '#fef2f2', color: tx.status === 'LUNAS' ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: 6 }}>{tx.status}</span>
                              </td>
                              <td style={{ padding: '20px 24px', textAlign: 'right' }}><span style={{ fontWeight: 700, fontSize: '13px' }}>Rp {tx.addon?.toLocaleString('id-ID') || 0}</span></td>
                              <td style={{ padding: '20px 24px', textAlign: 'right' }}><span style={{ fontWeight: 950, fontSize: '15px' }}>Rp {(tx.total || 0).toLocaleString('id-ID')}</span></td>
                              <td style={{ padding: '20px 24px', textAlign: 'right' }}><span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{tx.id || '-'}</span></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </GlassCard>
          </motion.div>
        ) : activeTab === 'expenses' ? (
          <motion.div key="expenses" initial={{ opacity: 0 }}>
             <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', background: 'white' }}>
                   <p style={{ fontWeight: 800, color: '#64748b' }}>Detail Pengeluaran Toko</p>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                       <tr>
                          <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px' }}>Item</th>
                          <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px' }}>Tanggal</th>
                          <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px' }}>Nominal</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredExpenses.map(exp => (
                         <tr key={exp.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 800 }}>{exp.item}</td>
                            <td style={{ padding: '16px 24px', fontSize: '13px' }}>{exp.date}</td>
                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 950, color: '#ef4444' }}>Rp {exp.amount.toLocaleString('id-ID')}</td>
                         </tr>
                       ))}
                    </tbody>
                </table>
             </GlassCard>
          </motion.div>
        ) : (
           <motion.div key="paket" initial={{ opacity: 0 }}>
              <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
                 <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
                    <div style={{ position: 'relative', width: 300 }}>
                       <SearchIcon size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                       <input type="text" placeholder="Cari pelanggan paket..." value={paketSearchTerm || ''} onChange={e => setPaketSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 42px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600 }} />
                    </div>
                 </div>

                 <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                       <thead style={{ background: '#f8fafc' }}>
                          <tr>
                             <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Pelanggan</th>
                             <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Paket (Produk)</th>
                             <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Pembayaran Ke</th>
                             <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Tanggal</th>
                             <th style={{ padding: '16px 24px', fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Nominal</th>
                          </tr>
                       </thead>
                       <tbody>
                          {paketTransactions.map((pt) => (
                            <tr key={pt.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                               <td style={{ padding: '20px 24px' }}><span style={{ fontWeight: 900, fontSize: '14px' }}>{pt.customer_name}</span></td>
                               <td style={{ padding: '20px 24px' }}><span style={{ fontWeight: 700, fontSize: '13px', color: '#64748b' }}>{pt.products}</span></td>
                               <td style={{ padding: '20px 24px' }}><span style={{ fontWeight: 800, fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: 6 }}>KE-{pt.payment_no}</span></td>
                               <td style={{ padding: '20px 24px' }}><span style={{ fontWeight: 700, fontSize: '13px', color: '#64748b' }}>{pt.date}</span></td>
                               <td style={{ padding: '20px 24px', textAlign: 'right' }}><span style={{ fontWeight: 950, fontSize: '15px', color: '#16a34a' }}>Rp {pt.amount.toLocaleString('id-ID')}</span></td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </GlassCard>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
