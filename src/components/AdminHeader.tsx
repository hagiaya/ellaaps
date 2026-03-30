"use client";

import { motion } from "framer-motion";
import { 
  Bell, 
  Search, 
  User as UserIcon,
  ChevronDown,
  Calendar,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminHeader() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{ 
      height: 100, 
      backgroundColor: 'transparent', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 40px',
      position: 'relative',
      zIndex: 50
    }}>
      {/* Left Search Bar Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={18} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Global Search Cmd+K" 
            style={{ 
              width: '100%', 
              height: 48, 
              paddingLeft: 52, 
              paddingRight: 20, 
              backgroundColor: '#ffffff', 
              border: '1px solid #f1f5f9', 
              borderRadius: '16px', 
              fontSize: '14px', 
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.05)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, backgroundColor: 'rgba(15, 23, 42, 0.03)', padding: '8px 20px', borderRadius: '14px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} className="text-slate-400" />
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>{time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
           </div>
           <div style={{ width: 1, height: 12, backgroundColor: '#cbd5e1' }} />
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} className="text-slate-400" />
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>{time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
           </div>
        </div>
      </div>

      {/* Right User Actions Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <button 
          onClick={() => alert("Notification center: 4 Unread alerts regarding inventory levels.")}
          style={{ 
            position: 'relative', 
            width: 48, 
            height: 48, 
            borderRadius: '16px', 
            backgroundColor: '#ffffff', 
            border: '1px solid #f1f5f9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#64748b',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
          <Bell size={20} />
          <div style={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #ffffff' }} />
        </button>

        <div 
          onClick={() => {
            if (confirm("Logout from ElaApp Admin Panel?")) {
              window.location.href = "/";
            }
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16, 
            padding: '6px', 
            paddingRight: '20px', 
            backgroundColor: '#ffffff', 
            borderRadius: '20px', 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)', 
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
           <div style={{ width: 40, height: 40, borderRadius: '14px', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={20} />
           </div>
           <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '13px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Super Admin</p>
              <p style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HQ-OFFICE</p>
           </div>
           <ChevronDown size={14} style={{ color: '#cbd5e1', marginLeft: 8 }} />
        </div>
      </div>
    </header>
  );
}
