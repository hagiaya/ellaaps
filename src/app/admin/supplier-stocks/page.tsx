"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Filter, Package, 
  CreditCard, CheckCircle2, AlertCircle, Calendar,
  MoreVertical, Edit3, Trash2, X, Save, ArrowRight
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

export default function SupplierStocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStock, setCurrentStock] = useState<any>(null);

  const fetchStocks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('supplier_stocks')
      .select('*, product_variants(name, products(name))')
      .order('created_at', { ascending: false });

    if (data) {
      setStocks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      const matchesSearch = s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.product_variants?.products?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "ALL" || s.payment_status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [stocks, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const unpaid = stocks.filter(s => s.payment_status !== 'LUNAS');
    const totalUnpaid = unpaid.reduce((acc, s) => acc + Number(s.total_amount), 0);
    return {
      totalRecords: stocks.length,
      unpaidCount: unpaid.length,
      unpaidAmount: totalUnpaid
    };
  }, [stocks]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('supplier_stocks')
      .update({ payment_status: newStatus })
      .eq('id', id);
    
    if (!error) {
      alert("Status pembayaran diperbarui!");
      fetchStocks();
    } else {
      alert("Gagal update: " + error.message);
    }
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 40 }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Manajemen Stok Supliyer</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Pantau tagihan dan input stok dari pihak ketiga / supliyer.</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
         <GlassCard delay={0.1} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Total Record Stok</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{stats.totalRecords} Transaksi</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.2} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Tagihan Belum Lunas</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{stats.unpaidCount} Tagihan</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.3} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Total Nominal Hutang</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {stats.unpaidAmount.toLocaleString('id-ID')}</h3>
               </div>
            </div>
         </GlassCard>
      </div>

      {/* Filter Section */}
      <GlassCard style={{ padding: '24px 32px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: 6, borderRadius: 16 }}>
            {['ALL', 'BELUM LUNAS', 'LUNAS'].map(s => (
               <button 
                 key={s} 
                 onClick={() => setFilterStatus(s)}
                 style={{ 
                   padding: '10px 24px', 
                   borderRadius: 12, 
                   border: 'none', 
                   background: filterStatus === s ? '#0f172a' : 'transparent', 
                   color: filterStatus === s ? 'white' : '#64748b', 
                   fontWeight: 900, 
                   fontSize: '12px',
                   cursor: 'pointer'
                 }}
               >
                 {s}
               </button>
            ))}
         </div>
         <div style={{ position: 'relative', width: 300 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari supliyer or produk..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 48, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', paddingLeft: 48, fontWeight: 700 }}
            />
         </div>
      </GlassCard>

      {/* Table Section */}
      <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>
                     <th style={{ padding: '24px 40px' }}>Supliyer / Tanggal</th>
                     <th style={{ padding: '24px 20px' }}>Produk & Varian</th>
                     <th style={{ padding: '24px 20px' }}>Qty</th>
                     <th style={{ padding: '24px 20px' }}>Total Harga</th>
                     <th style={{ padding: '24px 20px' }}>Status Bayar</th>
                     <th style={{ padding: '24px 40px', textAlign: 'right' }}>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>Sedang memuat data...</td></tr>
                  ) : filteredStocks.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>Tidak ada data ditemukan.</td></tr>
                  ) : filteredStocks.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: idx === filteredStocks.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                       <td style={{ padding: '24px 40px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                             <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={18} />
                             </div>
                             <div>
                                <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a', display: 'block' }}>{s.supplier_name}</span>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>{new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                             </div>
                          </div>
                       </td>
                       <td style={{ padding: '24px 20px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', display: 'block' }}>{s.product_variants?.products?.name || "Produk"}</span>
                          <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 850 }}>Varian: {s.product_variants?.name}</span>
                       </td>
                       <td style={{ padding: '24px 20px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 950, color: '#0f172a' }}>{s.qty}</span>
                       </td>
                       <td style={{ padding: '24px 20px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>Rp {Number(s.total_amount).toLocaleString('id-ID')}</span>
                          <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>via {s.payment_method}</span>
                       </td>
                       <td style={{ padding: '24px 20px' }}>
                          <span style={{ 
                            padding: '6px 12px', 
                            borderRadius: 10, 
                            fontSize: '10px', 
                            fontWeight: 950,
                            background: s.payment_status === 'LUNAS' ? '#f0fdf4' : '#fff1f2',
                            color: s.payment_status === 'LUNAS' ? '#10b981' : '#ef4444'
                          }}>
                            {s.payment_status}
                          </span>
                       </td>
                       <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                          {s.payment_status !== 'LUNAS' ? (
                             <button 
                               onClick={() => { if(confirm("Tandai transaksi dari " + s.supplier_name + " ini sebagai LUNAS?")) handleUpdateStatus(s.id, 'LUNAS'); }}
                               style={{ padding: '10px 18px', borderRadius: 12, background: '#10b981', color: 'white', border: 'none', fontWeight: 950, fontSize: '11px', cursor: 'pointer' }}
                             >
                               PELUNASAN
                             </button>
                          ) : (
                             <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                <CheckCircle2 size={16} />
                                <span style={{ fontSize: '11px', fontWeight: 950 }}>LUNAS</span>
                             </div>
                          )}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </GlassCard>

    </div>
  );
}
