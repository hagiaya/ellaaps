"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Clock, Gift, Shield, 
  MapPin, Info, Save, ChevronRight, CheckCircle2,
  Lock, Bell, Globe, Database, User as UserIcon,
  AlertCircle,
  CreditCard,
  Target,
  History as HistoryIcon
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { QrCode, Landmark, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Produksi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Settings State
  const [config, setConfig] = useState({
    baseSalary: 3000000,
    bonusPerKg: 10000,
    minTargetKg: 2,
    thrAmount: 1500000,
    checkInTime: "08:00",
    gpsLocation: "-6.2088, 106.8456",
    radiusMeter: 100,
    isMaintenance: false,
    autoBackup: true,
    qris_url: "",
    bank_accounts: [] as { bank: string, number: string, holder: string }[]
  });

  const fetchSettings = async () => {
     const { data } = await supabase.from('settings').select('*').eq('id', 'system_config').single();
     if (data) setConfig(data.value);
  };

  useEffect(() => {
     fetchSettings();
  }, []);

  const sections = [
    { title: 'Logika Gaji & Bonus', icon: Calculator, desc: 'Parameter keuangan produksi', label: 'Produksi' },
    { title: 'Absensi & Geo-fencing', icon: Clock, desc: 'Aturan kehadiran & lokasi', label: 'Jadwal' },
    { title: 'Manajemen Pembayaran', icon: CreditCard, desc: 'QRIS & Daftar Rekening Bank', label: 'Bayar' },
    { title: 'Benefit & Tunjangan', icon: Gift, desc: 'THR & dana kesehatan', label: 'Benefit' },
    { title: 'Integrasi Database', icon: Database, desc: 'Sinkronisasi cloud & lokal', label: 'Data' },
  ];

  const handleSave = async () => {
    setIsProcessing(true);
    const { error } = await supabase.from('settings').upsert({
       id: 'system_config',
       value: config,
       updated_at: new Date().toISOString()
    });
    
    setIsProcessing(false);
    if (!error) {
       setShowToast(true);
       setTimeout(() => setShowToast(false), 3000);
    } else {
       alert("Gagal sinkronisasi: " + error.message);
    }
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 40, 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 2000, 
              padding: '24px 48px', 
              background: '#0f172a', 
              color: 'white', 
              borderRadius: '24px', 
              boxShadow: '0 30px 60px -10px rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              fontWeight: 950,
              fontSize: '16px'
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <CheckCircle2 size={20} />
            </div>
            Konfigurasi Sistem Berhasil Disinkronisasi!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Pengaturan Parameter</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Kelola parameter operasional, keuangan, dan otorisasi toko.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isProcessing}
          className="primary-button" 
          style={{ 
            height: 60,
            padding: '0 48px', 
            borderRadius: 18, 
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2)'
          }}
        >
          {isProcessing ? (
            <div style={{ width: 24, height: 24, border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          ) : (
            <>
               <Save size={20} /> Simpan Perubahan
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 48 }}>
        
        {/* Left Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sections.map((section) => {
            const isTabActive = activeTab === section.label;
            return (
              <div 
                key={section.title} 
                onClick={() => setActiveTab(section.label)}
                style={{ 
                  padding: '20px 24px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isTabActive ? '#0f172a' : '#f1f5f9',
                  background: isTabActive ? '#0f172a' : '#ffffff',
                  color: isTabActive ? 'white' : '#0f172a',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: isTabActive ? 'rgba(255,255,255,0.1)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <section.icon size={22} style={{ color: isTabActive ? 'white' : '#64748b' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 950, margin: 0 }}>{section.title}</p>
                  <p style={{ fontSize: '10px', color: isTabActive ? 'rgba(255,255,255,0.6)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.desc}</p>
                </div>
                {isTabActive && <ChevronRight size={16} />}
              </div>
            );
          })}
        </div>

        {/* Right Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'Produksi' && (
            <motion.div key="prod" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <GlassCard style={{ padding: 40, borderRadius: 32 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}><Calculator size={24}/> Parameter Produksi & Gaji</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>GAJI POKOK DASAR (MONTHLY)</label>
                        <input type="number" value={config.baseSalary} onChange={(e) => setConfig({...config, baseSalary: Number(e.target.value)})} style={{ padding: '20px', borderRadius: 16, border: '2px solid #f1f5f9', fontWeight: 950, fontSize: '18px' }} />
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>BONUS PER KG (OVERWEIGHT)</label>
                        <input type="number" value={config.bonusPerKg} onChange={(e) => setConfig({...config, bonusPerKg: Number(e.target.value)})} style={{ padding: '20px', borderRadius: 16, border: '2px solid #f1f5f9', fontWeight: 950, fontSize: '18px' }} />
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>TARGET MINIMAL HARIAN (KG)</label>
                        <input type="number" value={config.minTargetKg} onChange={(e) => setConfig({...config, minTargetKg: Number(e.target.value)})} style={{ padding: '20px', borderRadius: 16, border: '2px solid #f1f5f9', fontWeight: 950, fontSize: '18px' }} />
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>TUNJANGAN HARI RAYA (THR)</label>
                        <input type="number" value={config.thrAmount} onChange={(e) => setConfig({...config, thrAmount: Number(e.target.value)})} style={{ padding: '20px', borderRadius: 16, border: '2px solid #f1f5f9', fontWeight: 950, fontSize: '18px' }} />
                     </div>
                  </div>
               </GlassCard>
            </motion.div>
          )}

          {activeTab === 'Jadwal' && (
            <motion.div key="jadwal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <GlassCard style={{ padding: 40, borderRadius: 32 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}><Clock size={24}/> Aturan Absensi & Lokasi</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>BATAS JAM MASUK (CHECK-IN)</label>
                        <input type="time" value={config.checkInTime} onChange={(e) => setConfig({...config, checkInTime: e.target.value})} style={{ padding: '20px', borderRadius: 16, border: '2px solid #f1f5f9', fontWeight: 950, fontSize: '18px' }} />
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>RADIUS GEO-FENCING (METER)</label>
                        <input type="number" value={config.radiusMeter} onChange={(e) => setConfig({...config, radiusMeter: Number(e.target.value)})} style={{ padding: '20px', borderRadius: 16, border: '2px solid #f1f5f9', fontWeight: 950, fontSize: '18px' }} />
                     </div>
                  </div>
                  <div style={{ marginTop: 32, padding: '24px', background: '#f8fafc', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                     <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 12 }}>TITIK KOORDINAT GPS TOKO</label>
                     <div style={{ position: 'relative' }}>
                        <MapPin size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" value={config.gpsLocation} onChange={(e) => setConfig({...config, gpsLocation: e.target.value})} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: 16, border: '1px solid #e2e8f0', fontWeight: 800 }} />
                     </div>
                  </div>
               </GlassCard>
            </motion.div>
          )}

          {activeTab === 'Bayar' && (
              <motion.div key="pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                 <GlassCard style={{ padding: 40, borderRadius: 32 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                       <QrCode size={22} /> QRIS Merchant
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 40, alignItems: 'start' }}>
                       <div style={{ width: 240, height: 240, background: '#f8fafc', borderRadius: '32px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }} onClick={() => {
                          const url = prompt("Masukkan URL Gambar QRIS (Cloudinary/Lainnya):", config.qris_url);
                          if (url !== null) setConfig({...config, qris_url: url});
                       }}>
                          {config.qris_url ? <img src={config.qris_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : (
                             <>
                                <ImageIcon size={32} color="#94a3b8" />
                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', marginTop: 12 }}>UPLOAD QRIS</span>
                             </>
                          )}
                       </div>
                       <div style={{ padding: 24, background: '#f0f9ff', borderRadius: '24px', border: '1px solid #bae6fd' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 950, color: '#0369a1', marginTop: 0 }}>Panduan File</h4>
                          <p style={{ fontSize: '14px', color: '#0c4a6e', lineHeight: 1.6, fontWeight: 500 }}>Unggah screenshot QRIS statis toko Anda. Gambar ini akan ditampilkan di portal kasir saat pelanggan memilih metode pembayaran QRIS.</p>
                       </div>
                    </div>
                 </GlassCard>

                 <GlassCard style={{ padding: 40, borderRadius: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                       <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Landmark size={22} /> Rekening Bank Manual
                       </h3>
                       <button onClick={() => setConfig({...config, bank_accounts: [...config.bank_accounts, { bank: 'BCA', number: '', holder: '' }]})} style={{ padding: '10px 20px', background: '#0f172a', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Plus size={16} /> TAMBAH REKENING
                       </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                       {config.bank_accounts.map((acc, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 60px', gap: 16, background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>BANK</label>
                                <input type="text" value={acc.bank} onChange={e => {
                                   const n = [...config.bank_accounts]; n[idx].bank = e.target.value; setConfig({...config, bank_accounts: n});
                                }} style={{ height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 750 }} />
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>NOMOR REKENING</label>
                                <input type="text" value={acc.number} onChange={e => {
                                   const n = [...config.bank_accounts]; n[idx].number = e.target.value; setConfig({...config, bank_accounts: n});
                                }} style={{ height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 750 }} />
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>NAMA PEMILIK</label>
                                <input type="text" value={acc.holder} onChange={e => {
                                   const n = [...config.bank_accounts]; n[idx].holder = e.target.value; setConfig({...config, bank_accounts: n});
                                }} style={{ height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 750 }} />
                             </div>
                             <button onClick={() => setConfig({...config, bank_accounts: config.bank_accounts.filter((_, i) => i !== idx)})} style={{ alignSelf: 'end', height: 44, borderRadius: 12, background: '#fef2f2', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={20} />
                             </button>
                          </div>
                       ))}
                       {config.bank_accounts.length === 0 && (
                          <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px', fontWeight: 700, background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>Belum ada rekening yang didaftarkan.</p>
                       )}
                    </div>
                 </GlassCard>
              </motion.div>
           )}

          {activeTab === 'Benefit' && (
            <motion.div key="benefit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <GlassCard style={{ padding: 40, borderRadius: 32 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}><Gift size={24}/> Benefit & Tunjangan Staf</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: '#f0fdf4', borderRadius: 20 }}>
                        <div>
                           <p style={{ fontSize: '15px', fontWeight: 950, color: '#16a34a', margin: 0 }}>Tunjangan Makan Harian</p>
                           <p style={{ fontSize: '12px', color: '#16a34a', opacity: 0.7 }}>Otomatis aktif saat status hadir.</p>
                        </div>
                        <input type="checkbox" defaultChecked style={{ width: 24, height: 24 }} />
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: '#f0f9ff', borderRadius: 20 }}>
                        <div>
                           <p style={{ fontSize: '15px', fontWeight: 950, color: '#0369a1', margin: 0 }}>Bonus Kerajinan (No Late Check-in)</p>
                           <p style={{ fontSize: '12px', color: '#0369a1', opacity: 0.7 }}>Rp 100.000 / bulan jika tidak telat.</p>
                        </div>
                        <input type="checkbox" defaultChecked style={{ width: 24, height: 24 }} />
                     </div>
                  </div>
               </GlassCard>
            </motion.div>
          )}

          {activeTab === 'Data' && (
            <motion.div key="data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <GlassCard style={{ padding: 40, borderRadius: 32 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}><Database size={24}/> Integrasi & Database</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                     <button style={{ padding: '24px', borderRadius: 20, background: '#0f172a', color: 'white', border: 'none', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
                        <Database size={20}/> SINKRONISASI DATA SEKARANG
                     </button>
                     <div style={{ padding: 24, borderRadius: 20, border: '1.5px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><HistoryIcon size={20}/></div>
                        <div>
                           <p style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Backup Terakhir</p>
                           <p style={{ fontSize: '12px', color: '#94a3b8' }}>30 Maret 2026, 14:20 WIB</p>
                        </div>
                     </div>
                  </div>
               </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
