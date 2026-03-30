"use client";
import AdminHeader from "@/components/AdminHeader";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Lock, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('ELA_ADMIN_AUTH');
    if (saved) {
       setLoggedInUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const { data, error } = await supabase
       .from('staff')
       .select('*')
       .eq('username', loginForm.username)
       .eq('password_hash', loginForm.password)
       .eq('role', 'admin') // Only admin can access admin panel
       .single();

    if (data) {
       setLoggedInUser(data);
       localStorage.setItem('ELA_ADMIN_AUTH', JSON.stringify(data));
    } else {
       alert("Username atau kata sandi salah, atau Anda bukan Admin!");
    }
    setIsLoggingIn(false);
  };

  if (!isMounted) return null;

  if (!loggedInUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: 20 }}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: '100%', maxWidth: 420 }}>
              <GlassCard style={{ padding: 48, borderRadius: 40, textAlign: 'center', boxShadow: '0 40px 100px -20px rgba(15, 23, 42, 0.15)' }}>
                  <div style={{ width: 72, height: 72, background: '#0f172a', color: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4)' }}>
                      <Lock size={32} />
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Admin Control</h1>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginBottom: 40 }}>Masuk dengan akun super admin Anda.</p>
                  
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ textAlign: 'left' }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>Username</label>
                          <input 
                              type="text" 
                              placeholder="admin@ela.com" 
                              className="input-field" 
                              value={loginForm.username}
                              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                              required 
                              style={{ width: '100%', height: 56, borderRadius: 16, padding: '0 20px', fontWeight: 700 }}
                          />
                      </div>
                      <div style={{ textAlign: 'left', marginBottom: 8 }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>Password</label>
                          <input 
                              type="password" 
                              placeholder="••••••••" 
                              className="input-field" 
                              value={loginForm.password}
                              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                              required 
                              style={{ width: '100%', height: 56, borderRadius: 16, padding: '0 20px', fontWeight: 700 }}
                          />
                      </div>
                      
                      <button 
                          type="submit" 
                          disabled={isLoggingIn}
                          className="primary-button" 
                          style={{ width: '100%', height: 60, borderRadius: 20, fontSize: '15px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}
                      >
                          {isLoggingIn ? "Memverifikasi..." : <><LogIn size={20} /> MASUK ADMIN</>}
                      </button>
                  </form>

                  <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.4 }}>
                      <ShieldCheck size={14} />
                      <span style={{ fontSize: '10px', fontWeight: 800 }}>SECURE ACCESS ONLY</span>
                  </div>
              </GlassCard>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: 280, width: 'calc(100% - 280px)' }}>
        <AdminHeader />
        <main style={{ padding: '0 0 80px 0' }}>
          {children}
        </main>
        <button 
           onClick={() => { localStorage.removeItem('ELA_ADMIN_AUTH'); setLoggedInUser(null); }}
           style={{ position: 'fixed', bottom: 32, left: 32, zIndex: 100, padding: '12px 20px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, color: '#ef4444', fontWeight: 800, fontSize: '12px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
        >LOGOUT ADMIN</button>
      </div>
    </div>
  );
}
