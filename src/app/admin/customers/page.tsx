"use client";

import { motion } from "framer-motion";
import { 
  Users, Search, Star, TrendingUp, History, MessageSquare, 
  ArrowUpRight, Filter, MoreVertical, ShieldCheck, Zap
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

   const fetchCustomers = async () => {
     // Join with transactions to get real stats
     const { data, error } = await supabase
       .from('customers')
       .select('*, transactions(grand_total, created_at)')
       .order('name');
       
     if (data) {
       const mapped = data.map((c: any) => {
         const txs = c.transactions || [];
         const total_spend = txs.reduce((acc: number, t: any) => acc + (Number(t.grand_total) || 0), 0);
         const total_orders = txs.length;
         const sorted = [...txs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
         const last_order_date = sorted[0] ? new Date(sorted[0].created_at).toLocaleDateString('id-ID') : '-';
         
         return {
           ...c,
           total_spend,
           total_orders,
           last_order_date,
           status: total_orders > 0 ? 'active' : 'pasif'
         };
       });
       setCustomers(mapped);
     }
   };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.wa_number && c.wa_number.includes(searchTerm))
    );
  }, [searchTerm, customers]);

  const totalRevenueFromCustomers = useMemo(() => {
    return customers.reduce((acc, c) => acc + (Number(c.total_spend) || 0), 0);
  }, [customers]);

  const avgOrderPerCustomer = useMemo(() => {
    if (customers.length === 0) return 0;
    return (customers.reduce((acc, c) => acc + (Number(c.total_orders) || 0), 0) / customers.length).toFixed(1);
  }, [customers]);

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Manajemen Pelanggan</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Analisis daya beli dan loyalitas pelanggan Rumah Kue Gorontalo.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button onClick={() => alert("Download Database Pelanggan")} className="secondary-button" style={{ borderRadius: 16, height: 52, padding: '0 24px', background: 'white', border: '1px solid #e1e8f0', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>Export CSV</button>
           <button onClick={() => alert("Fitur Broadcast WA - Coming Soon")} className="primary-button" style={{ borderRadius: 16, height: 52, padding: '0 24px', background: '#16a34a', color: 'white', border: 'none', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
             <MessageSquare size={18} /> Broadcast Promo
           </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          <GlassCard delay={0.1} style={{ padding: 24, borderRadius: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Users size={22} />
                </div>
                <div>
                   <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Total Database</p>
                   <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{customers.length} Orang</h3>
                </div>
             </div>
          </GlassCard>
         <GlassCard delay={0.2} style={{ padding: 24, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} />
               </div>
                <div>
                   <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Total Transaksi</p>
                   <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {(totalRevenueFromCustomers || 0).toLocaleString('id-ID')}</h3>
                </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.3} style={{ padding: 24, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Rata-rata Order</p>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{avgOrderPerCustomer}x / User</h3>
               </div>
            </div>
         </GlassCard>
          <GlassCard delay={0.4} style={{ padding: 24, borderRadius: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Star size={22} />
                </div>
                <div>
                   <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Pelanggan Loyal</p>
                   <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{customers.filter(c => (c.total_orders || 0) > 6).length} Orang</h3>
                </div>
             </div>
          </GlassCard>
      </div>

      {/* Main Table Layout */}
      <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
         <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
               <div style={{ position: 'relative', width: 340 }}>
                  <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Cari nama atau nomor WA..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field" 
                    style={{ paddingLeft: 48, borderRadius: 14, height: 48, fontWeight: 700, width: '100%', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                  />
               </div>
               <button onClick={() => alert("Filter functionality coming soon")} style={{ borderRadius: 14, height: 48, padding: '0 20px', background: 'white', border: '1px solid #e2e8f0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}><Filter size={18} /> Filter</button>
            </div>
            
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8' }}>Menampilkan {filteredCustomers.length} Pelanggan</span>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: '#f8fafc' }}>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Pelanggan</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Info Kontak</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Total Orders</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Total Belanja</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Status</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
               </tr>
               </thead>
               <tbody>
                  {filteredCustomers.map((customer, idx) => (
                    <tr key={customer.id} style={{ borderBottom: idx === filteredCustomers.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                       <td style={{ padding: '24px 40px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                             <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900 }}>
                                {customer.name.charAt(0)}
                             </div>
                             <div>
                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {customer.name}
                                  {customer.total_orders > 6 && <Star size={12} fill="#f59e0b" color="#f59e0b" />}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ID: {customer.id}</span>
                             </div>
                          </div>
                       </td>
                        <td style={{ padding: '24px 40px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: '14px', fontWeight: 750, color: '#1e293b' }}>{customer.wa_number || '-'}</span>
                              {customer.wa_number && <span onClick={() => window.open(`https://wa.me/${customer.wa_number}`, '_blank')} style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', cursor: 'pointer' }}>Buka WhatsApp</span>}
                           </div>
                        </td>
                        <td style={{ padding: '24px 40px' }}>
                           <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>{customer.total_orders || 0}x</span>
                           <small style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Terakhir: {customer.last_order_date || '-'}</small>
                        </td>
                        <td style={{ padding: '24px 40px' }}>
                           <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>Rp {(customer.total_spend || 0).toLocaleString('id-ID')}</span>
                           {(customer.total_orders || 0) > 6 && <small style={{ display: 'block', fontSize: '10px', color: '#10b981', fontWeight: 900 }}>LOYAL CUSTOMER</small>}
                        </td>
                       <td style={{ padding: '24px 40px' }}>
                          <span style={{ 
                             display: 'inline-flex', 
                             alignItems: 'center', 
                             gap: 6, 
                             padding: '6px 12px', 
                             borderRadius: '10px', 
                             fontSize: '10px', 
                             fontWeight: 950, 
                             textTransform: 'uppercase',
                             background: customer.status === 'active' ? '#f0fdf4' : '#f8fafc',
                             color: customer.status === 'active' ? '#10b981' : '#94a3b8'
                          }}>
                             <ShieldCheck size={12} />
                             {customer.status === 'active' ? 'AKTIF' : 'PASIF'}
                          </span>
                       </td>
                       <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                             <button onClick={() => alert("Histori Transaksi " + customer.name)} style={{ padding: '10px', borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }} title="History"><History size={16}/></button>
                             <button onClick={() => alert("Detail Pelanggan " + customer.name)} style={{ padding: '10px', borderRadius: 12, backgroundColor: '#f1f5f9', border: '1px solid #0f172a', color: '#0f172a', cursor: 'pointer' }}><ArrowUpRight size={16}/></button>
                          </div>
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
