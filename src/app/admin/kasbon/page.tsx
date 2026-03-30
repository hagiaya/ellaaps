"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingDown,
  Wallet,
  ArrowDownRight,
  X,
  Check,
  Edit2,
  Trash2,
  ThumbsDown,
  Info
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { useState, useMemo } from "react";
import { mockEmployees } from "@/lib/mockData";

export default function KasbonManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [kasbonRequests, setKasbonRequests] = useState([
    { id: 'KB-001', employee_id: 'emp1', employee_name: 'Siti Rahma', amount: 50000, date: '2026-03-30', status: 'PENDING', note: 'Keperluan mendesak' },
    { id: 'KB-002', employee_id: 'emp2', employee_name: 'Rahmat Hidayat', amount: 100000, date: '2026-03-29', status: 'APPROVED', note: 'Beli bensin' },
    { id: 'KB-003', employee_id: 'emp1', employee_name: 'Siti Rahma', amount: 25000, date: '2026-03-25', status: 'PAID', note: 'Makan siang' },
  ]);

  // Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState<any>(null);
  const [correctedAmount, setCorrectedAmount] = useState<number>(0);

  const filteredRequests = useMemo(() => {
    return kasbonRequests.filter(r => 
      r.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, kasbonRequests]);

  const totalPending = useMemo(() => {
    return kasbonRequests.filter(r => r.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);
  }, [kasbonRequests]);

  const handleStatusChange = (id: string, status: 'APPROVED' | 'REJECTED' | 'PAID', amount?: number) => {
    setKasbonRequests(prev => prev.map(r => 
      r.id === id ? { ...r, status, amount: amount || r.amount } : r
    ));
    setShowCorrectionModal(null);
  };

  const openCorrection = (request: any) => {
    setShowCorrectionModal(request);
    setCorrectedAmount(request.amount);
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Verifikasi & Manajemen Kasbon</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Kelola verifikasi pengajuan kasbon dengan sistem koreksi nilai.</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
         <GlassCard delay={0.1} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Total Kasbon Pending</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {totalPending.toLocaleString('id-ID')}</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.2} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Total Kasbon Bulan Ini</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp 175.000</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.3} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={22} style={{ transform: 'rotate(180deg)' }} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Sudah Dipotong Gaji</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp 25.000</h3>
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
                  placeholder="Cari nama karyawan..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '0 16px 0 48px', borderRadius: 14, height: 48, fontWeight: 700, width: '100%', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                />
            </div>
            <button className="secondary-button" style={{ borderRadius: 14, height: 48, padding: '0 20px', background: 'white', border: '1px solid #e1e8f0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}><Filter size={18} /> Filter Status</button>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: '#f8fafc' }}>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Karyawan</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Tanggal</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Nominal Pinjaman</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Keterangan</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Status</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Aksi Verifikasi</th>
               </tr>
               </thead>
               <tbody>
                  {filteredRequests.map((r, idx) => (
                    <tr key={r.id} style={{ borderBottom: idx === filteredRequests.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                       <td style={{ padding: '24px 40px' }}>
                          <div>
                             <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>{r.employee_name}</span>
                             <p style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', margin: '2px 0 0 0' }}>ID: {r.id}</p>
                          </div>
                       </td>
                       <td style={{ padding: '24px 40px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                             <Clock size={14} color="#94a3b8" />
                             <span style={{ fontSize: '14px', fontWeight: 800, color: '#64748b' }}>{r.date}</span>
                          </div>
                       </td>
                       <td style={{ padding: '24px 40px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 950, color: r.status === 'REJECTED' ? '#94a3b8' : '#ef4444' }}>- Rp {r.amount.toLocaleString('id-ID')}</span>
                       </td>
                       <td style={{ padding: '24px 40px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{r.note}</span>
                       </td>
                       <td style={{ padding: '24px 40px' }}>
                          <div style={{ 
                             display: 'inline-flex', 
                             alignItems: 'center', 
                             gap: 6, 
                             padding: '6px 12px', 
                             borderRadius: '10px', 
                             fontSize: '10px', 
                             fontWeight: 950, 
                             textTransform: 'uppercase',
                             background: r.status === 'APPROVED' ? '#eff6ff' : (r.status === 'PENDING' ? '#fff7ed' : (r.status === 'REJECTED' ? '#fee2e2' : '#f0fdf4')),
                             color: r.status === 'APPROVED' ? '#2563eb' : (r.status === 'PENDING' ? '#ea580c' : (r.status === 'REJECTED' ? '#ef4444' : '#10b981'))
                          }}>
                             {r.status === 'PENDING' ? <Clock size={12} /> : (r.status === 'REJECTED' ? <ThumbsDown size={12} /> : <CheckCircle2 size={12} />)}
                             {r.status}
                          </div>
                       </td>
                       <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                          {r.status === 'PENDING' ? (
                             <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => handleStatusChange(r.id, 'APPROVED')} 
                                  style={{ padding: '10px', borderRadius: 12, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 900 }}
                                >
                                   <Check size={14}/> TERIMA
                                </button>
                                <button 
                                  onClick={() => openCorrection(r)} 
                                  style={{ padding: '10px', borderRadius: 12, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 900 }}
                                >
                                   <Edit2 size={14}/> KOREKSI
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(r.id, 'REJECTED')} 
                                  style={{ padding: '10px', borderRadius: 12, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 900 }}
                                >
                                   <ThumbsDown size={14}/> TOLAK
                                </button>
                             </div>
                          ) : (
                             <span style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>VERIFIED BY ADMIN</span>
                          )}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </GlassCard>

      {/* Correction Modal */}
      <AnimatePresence>
        {showCorrectionModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: 440, background: 'white', borderRadius: '32px', padding: 40, boxShadow: '0 40px 80px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={20}/></div>
                      <h3 style={{ fontSize: '20px', fontWeight: 950, margin: 0 }}>Koreksi Kasbon</h3>
                   </div>
                   <button onClick={() => setShowCorrectionModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24}/></button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: 4 }}>KARYAWAN</p>
                      <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{showCorrectionModal.employee_name}</h4>
                   </div>
                   
                   <div>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Nominal Koreksi (Rp)</label>
                      <div style={{ position: 'relative' }}>
                         <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#0f172a' }}>Rp</span>
                         <input 
                           type="number" 
                           value={correctedAmount} 
                           onChange={(e) => setCorrectedAmount(Number(e.target.value))}
                           style={{ width: '100%', padding: '20px 20px 20px 50px', borderRadius: '18px', border: '2px solid #2563eb', background: 'white', fontSize: '24px', fontWeight: 950, color: '#0f172a' }} 
                         />
                      </div>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                         <Info size={14} color="#2563eb" /> Pengajuan awal: Rp {showCorrectionModal.amount.toLocaleString('id-ID')}
                      </p>
                   </div>

                   <button 
                     onClick={() => handleStatusChange(showCorrectionModal.id, 'APPROVED', correctedAmount)}
                     style={{ width: '100%', padding: '20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '18px', fontSize: '15px', fontWeight: 950, cursor: 'pointer' }}
                   >TERIMA DENGAN NILAI KOREKSI</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlassCard style={{ padding: 40, borderRadius: '32px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'flex-start', gap: 24 }}>
         <div style={{ width: 48, height: 48, borderRadius: 16, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
            <AlertCircle size={24} />
         </div>
         <div>
            <h4 style={{ fontSize: '16px', fontWeight: 950, color: '#1e40af', margin: '0 0 8px 0' }}>Sistem Verifikasi Multi-Level</h4>
            <p style={{ fontSize: '14px', color: '#1e40af', opacity: 0.8, lineHeight: 1.6, margin: 0 }}>
               Admin memiliki kontrol penuh untuk <b>Menolak</b> pengajuan yang tidak valid atau <b>Mengkoreksi</b> nominal kasbon jika jumlah yang diajukan melebihi batas atau tidak sesuai dengan kebijakan perusahaan.
            </p>
         </div>
      </GlassCard>

    </div>
  );
}
