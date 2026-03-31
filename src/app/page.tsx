"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  UserCog, Users, ShoppingCart, ArrowRight, Star, 
  Activity, Zap, ShieldCheck, Clock, Bell
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const roles = [
    {
      title: "Admin Portal",
      description: "Pusat kendali resep, inventaris, laporan keuangan & penggajian karyawan.",
      icon: UserCog,
      href: "/admin",
      accent: "#2563eb",
      badge: "MANAGEMENT",
      status: "4 Unread Alerts",
      activity: "Last activity: 2m ago",
      iconColor: "#3b82f6"
    },
    {
      title: "Employee Portal",
      description: "Catat aktivitas harian, absensi, dan lihat panduan komposisi bahan.",
      icon: Users,
      href: "/employee",
      accent: "#6366f1",
      badge: "PRODUCTION",
      status: "Batch in Progress",
      activity: "3 Staff Online",
      iconColor: "#818cf8"
    },
    {
      title: "Cashier POS",
      description: "Point-of-Sale super cepat dengan integrasi pembayaran QRIS & Tunai.",
      icon: ShoppingCart,
      href: "/cashier",
      accent: "#10b981",
      badge: "POINT OF SALE",
      status: "Terminal Active",
      activity: "128 Orders Today",
      iconColor: "#34d399"
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 relative overflow-hidden min-h-screen" style={{ backgroundColor: '#fdfdfd' }}>
      
      {/* Dynamic Background */}
      <div className="absolute z-0 overflow-hidden" style={{ inset: 0, pointerEvents: 'none' }}>
         <motion.div 
           animate={{ 
             scale: [1, 1.2, 1],
             rotate: [0, 45, 0],
             opacity: [0.03, 0.05, 0.03]
           }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', backgroundColor: '#2563eb', borderRadius: '40%', filter: 'blur(120px)' }} 
         />
         <motion.div 
           animate={{ 
             scale: [1.2, 1, 1.2],
             rotate: [0, -45, 0],
             opacity: [0.03, 0.05, 0.03]
           }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', backgroundColor: '#6366f1', borderRadius: '40%', filter: 'blur(120px)' }} 
         />
      </div>

      {/* Top Navigation / Status Bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ position: 'fixed', top: 32, left: 32, right: 32, display: 'flex', justifyContent: 'space-between', zIndex: 100 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
           <Activity size={14} className="text-emerald-500" />
           <span style={{ fontSize: '11px', fontWeight: 950, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Online</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
           <Clock size={14} className="text-slate-400" />
           <span style={{ fontSize: '11px', fontWeight: 950, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
             {mounted ? (
               <>
                 {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
               </>
             ) : (
               "-- --- — --.--"
             )}
           </span>
        </div>
      </motion.div>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative z-10 mb-20"
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: '99px', backgroundColor: 'rgba(15, 23, 42, 0.05)', marginBottom: 48, border: '1px solid rgba(15, 23, 42, 0.03)' }}>
           <Zap size={14} className="fill-blue-500 text-blue-500" />
           <span style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Unified Ecosystem</span>
        </div>
        
        <h1 className="font-black text-slate-900 tracking-tighter" style={{ fontSize: 'clamp(44px, 8vw, 72px)', lineHeight: '0.9', marginBottom: 24 }}>
           RUMAH KUE<br/>GROSIR <span className="text-slate-200">HULONDELA</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium mx-auto" style={{ maxWidth: 720, lineHeight: '1.6' }}>
          Standardisasi operasional untuk efisiensi produksi, manajemen bahan baku, dan pengawasan finansial secara terpadu melalui platform ElaApp.
        </p>
      </motion.div>

      {/* Portal Grid */}
      <div className="grid relative z-10 w-full" style={{ maxWidth: 1240, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 40, padding: '0 20px' }}>
        {roles.map((role, i) => (
          <Link href={role.href} key={role.title} style={{ textDecoration: 'none' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ 
                padding: '48px',
                borderRadius: '48px',
                backgroundColor: '#ffffff',
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 40px -10px rgba(15, 23, 42, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 480,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="group"
            >
              {/* Card Accent Lines */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.2 }}>
                 <div style={{ position: 'absolute', top: 0, right: 0, width: 2, height: 100, background: `linear-gradient(to bottom, ${role.accent}, transparent)` }} />
                 <div style={{ position: 'absolute', top: 0, right: 0, height: 2, width: 100, background: `linear-gradient(to left, ${role.accent}, transparent)` }} />
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                   <div 
                      style={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: 24, 
                        backgroundColor: '#f8fafc', 
                        color: role.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                        border: '1px solid #f1f5f9',
                        transition: 'all 0.4s'
                      }}
                      className="group-hover:scale-110 group-hover:rotate-3"
                    >
                      <role.icon size={36} strokeWidth={2} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <span style={{ fontSize: '10px', fontWeight: 950, color: role.accent, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 4 }}>{role.badge}</span>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: role.accent === '#10b981' ? '#10b981' : (role.accent === '#2563eb' ? '#f59e0b' : '#6366f1') }} />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>{role.status}</span>
                       </div>
                    </div>
                </div>

                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-none group-hover:translate-x-1 transition-transform">{role.title}</h2>
                <p className="text-xl text-slate-500 font-medium" style={{ flex: 1, lineHeight: '1.6' }}>{role.description}</p>
                
                {/* Footer Info */}
                <div style={{ marginTop: 40, borderTop: '1px solid #f1f5f9', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Clock size={14} className="text-slate-300" />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>{role.activity}</span>
                   </div>
                   <div 
                      className="group-hover:translate-x-2 transition-transform"
                      style={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: '14px', 
                        backgroundColor: '#f8fafc', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: role.accent,
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <ArrowRight size={20} />
                    </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Footer Section */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 flex flex-col items-center gap-8 mt-32" style={{ paddingBottom: 60 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 24px', backgroundColor: '#ffffff', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
           <ShieldCheck size={20} className="text-emerald-500" />
           <div style={{ width: 1, height: 20, backgroundColor: '#f1f5f9' }} />
           <p style={{ fontSize: '12px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
             Secure Encrypted Environment v4.2.0
           </p>
        </div>
        <p style={{ fontSize: '11px', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
           &copy; 2026 RUMAH KUE GROSIR HULONDELA &bull; ELAAPP BAKERY CO.
        </p>
      </motion.footer>

      <style jsx>{`
        .group:hover {
          transform: translateY(-12px);
          box-shadow: 0 40px 80px -20px rgba(15, 23, 42, 0.12) !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
}
