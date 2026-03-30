"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Filter, 
  FlaskConical, AlertTriangle, TrendingUp,
  History, Zap, X, Save, Box, ShoppingCart
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { mockRawMaterials } from "@/lib/mockData";
import { useState, useMemo } from "react";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const filteredItems = useMemo(() => {
    return mockRawMaterials.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const totalModalRaw = useMemo(() => {
    return mockRawMaterials.reduce((acc, item) => acc + (item.stock * item.price_per_unit), 0);
  }, []);

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Stok ${selectedItem?.name} berhasil diperbarui!`);
    setShowStockModal(false);
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Stok Bahan Baku</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Kelola persediaan mentah untuk produksi kue.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="primary-button" style={{ borderRadius: 16, height: 56, padding: '0 32px' }}>
          <Plus size={20} /> Tambah Bahan Baru
        </button>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
         <GlassCard delay={0.1} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FlaskConical size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Nilai Modal Bahan Baku</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {totalModalRaw.toLocaleString('id-ID')}</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.2} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Turnover Rate</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>12.4% / Minggu</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.3} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Hampir Habis</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{mockRawMaterials.filter(i => i.stock < i.reorder_level).length} ITEM</h3>
               </div>
            </div>
         </GlassCard>
      </div>

      {/* Main Table Layout */}
      <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
         <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
            <div style={{ position: 'relative', width: 340 }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Cari bahan..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field" 
                  style={{ paddingLeft: 48, borderRadius: 14, height: 48, fontWeight: 700, width: '100%', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                />
            </div>
            <button className="secondary-button" style={{ borderRadius: 14, height: 48, padding: '0 20px', background: 'white', border: '1px solid #e1e8f0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}><Filter size={18} /> Filter</button>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: '#f8fafc' }}>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Nama Bahan</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Stok Tersisa</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Modal / Unit</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Status</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
               </tr>
               </thead>
               <tbody>
                  {filteredItems.map((item, idx) => {
                    const isLow = item.stock < item.reorder_level;
                    return (
                      <tr key={item.id} style={{ borderBottom: idx === filteredItems.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                         <td style={{ padding: '24px 40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <FlaskConical size={20} />
                               </div>
                               <div>
                                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', display: 'block' }}>{item.name}</span>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>INV-{item.id.toUpperCase()}</span>
                               </div>
                            </div>
                         </td>
                         <td style={{ padding: '24px 40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <span style={{ fontSize: '15px', fontWeight: 950, color: isLow ? '#ef4444' : '#0f172a' }}>{item.stock.toLocaleString('id-ID')}</span>
                               <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{item.unit}</span>
                            </div>
                         </td>
                         <td style={{ padding: '24px 40px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>Rp {item.price_per_unit.toLocaleString('id-ID')}</span>
                            <small style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>per {item.unit}</small>
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
                               background: isLow ? '#fff1f2' : '#f0fdf4',
                               color: isLow ? '#ef4444' : '#10b981'
                            }}>
                               {isLow ? <AlertTriangle size={12} /> : <Zap size={12} />}
                               {isLow ? 'Hampir Habis' : 'Stok Aman'}
                            </span>
                         </td>
                         <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                               <button style={{ padding: '10px', borderRadius: 12, border: '1px solid #e1e8f0', color: '#64748b', cursor: 'pointer', background: 'white' }}><History size={16}/></button>
                               <button onClick={() => { setSelectedItem(item); setShowStockModal(true); }} style={{ padding: '10px', borderRadius: 12, border: '1px solid #0f172a', color: '#0f172a', cursor: 'pointer', background: '#f8fafc' }}><Plus size={16}/></button>
                            </div>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </GlassCard>

      {/* Basic Stock Increase Modal */}
      <AnimatePresence>
        {showStockModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: '32px', padding: 48 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                   <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Restok Bahan</h3>
                   <button onClick={() => setShowStockModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: 12, width: 44, height: 44, cursor: 'pointer' }}><X size={20}/></button>
                </div>
                <form onSubmit={handleStockUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ffffff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <FlaskConical size={24} />
                      </div>
                      <div>
                         <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a', display: 'block' }}>{selectedItem?.name}</span>
                         <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>Stok saat ini: {selectedItem?.stock} {selectedItem?.unit}</span>
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                       <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Jumlah Tambahan ({selectedItem?.unit})</label>
                       <input type="number" placeholder="0" required style={{ height: 56, width: '100%', borderRadius: 14, border: '1px solid #e2e8f0', padding: '0 20px', fontWeight: 800, fontSize: '18px' }} />
                   </div>
                   <button type="submit" className="primary-button" style={{ height: 60, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Save size={20} /> Simpan Perubahan
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Item Modal (Focused on RAW) */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: '32px', padding: 56 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                   <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Input Bahan Baru</h3>
                   <button onClick={() => setShowAddModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: 12, width: 44, height: 44, cursor: 'pointer' }}><X size={20}/></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Nama Bahan Baku</label>
                      <input type="text" placeholder="Misal: Mentega Wisman" required style={{ height: 56, width: '100%', borderRadius: 14, border: '1px solid #e1e8f0', padding: '0 20px', fontWeight: 700 }} />
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Satuan</label>
                          <select style={{ height: 56, borderRadius: 14, border: '1px solid #e1e8f0', padding: '0 16px', fontWeight: 700 }}>
                             <option value="gram">Gram</option>
                             <option value="ml">ML</option>
                             <option value="pcs">Pcs</option>
                          </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Min. Reorder Level</label>
                          <input type="number" placeholder="500" required style={{ height: 56, width: '100%', borderRadius: 14, border: '1px solid #e1e8f0', padding: '0 20px', fontWeight: 700 }} />
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                      <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, height: 60, borderRadius: 20, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>Batal</button>
                      <button type="submit" style={{ flex: 2, height: 60, borderRadius: 20, border: 'none', background: '#0f172a', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Simpan Bahan</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
