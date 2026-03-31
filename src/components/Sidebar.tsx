"use client";

import { 
  LayoutGrid, 
  ChefHat, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  ShoppingCart,
  Box,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutGrid },
  { name: 'Transaksi', href: '/admin/transactions', icon: ShoppingCart },
  { name: 'Produk', href: '/admin/products', icon: Box },
  // { name: 'Resep Master', href: '/admin/recipes', icon: ChefHat }, // Tutup sementara
  { name: 'Pelanggan', href: '/admin/customers', icon: Users },
  { name: 'Karyawan', href: '/admin/employees', icon: Users },
  { name: 'Penggajian & Kasbon', href: '/admin/payroll', icon: FileText },
  { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [payrollInfo, setPayrollInfo] = useState({ total: 0, count: 0, month: '' });

  useEffect(() => {
    const fetchPayroll = async () => {
      const { data } = await supabase.from('employees').select('salary');
      if (data) {
        const total = data.reduce((acc: number, curr: any) => acc + (Number(curr.salary) || 0), 0);
        const count = data.length;
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const currentMonth = monthNames[new Date().getMonth()];
        setPayrollInfo({ total, count, month: currentMonth.toUpperCase() });
      }
    };
    fetchPayroll();
  }, []);

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      setIsLoggingOut(true);
      setTimeout(() => {
        router.push('/');
      }, 800);
    }
  };

  return (
    <aside style={{ 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      bottom: 0, 
      width: 280, 
      backgroundColor: '#ffffff', 
      borderRight: '1px solid #f1f5f9', 
      zIndex: 100, 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Brand Section */}
      <div style={{ padding: '40px 32px' }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 8,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)'
          }}>
            <img src="/logo.png" alt="Logo" width={28} height={28} style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.04em' }}>ElaApp</span>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '0 20px', marginBottom: 12 }}>MENU UTAMA</p>
        
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderRadius: '16px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                textDecoration: 'none',
                background: isActive ? '#0f172a' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                boxShadow: isActive ? '0 12px 24px -10px rgba(15, 23, 42, 0.3)' : 'none',
                fontWeight: isActive ? 900 : 700,
                fontSize: '15px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '32px 20px' }}>
        <button 
          onClick={handleLogout}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16, 
            width: '100%', 
            padding: '18px 20px', 
            borderRadius: '16px', 
            background: isLoggingOut ? '#fff1f2' : 'transparent', 
            border: 'none', 
            color: '#ef4444', 
            fontWeight: 800, 
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <LogOut size={20} />
          <span style={{ fontWeight: 900 }}>{isLoggingOut ? 'Log Out System...' : 'Keluar Sistem'}</span>
        </button>
      </div>
    </aside>
  );
}
