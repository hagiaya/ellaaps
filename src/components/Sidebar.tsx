"use client";

import { 
  LayoutDashboard, 
  ChefHat, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Recipes', href: '/admin/recipes', icon: ChefHat },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Employees', href: '/admin/employees', icon: Users },
  { name: 'Payroll', href: '/admin/payroll', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black/60 glass-card rounded-none border-y-0 border-l-0 border-r border-glass-border z-40 hidden md:flex flex-col">
      <div className="p-8 border-b border-glass-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight gradient-text">ElaApp</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-primary'} />
                <span className="font-semibold text-sm">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={16} className="text-white/50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-glass-border">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors font-semibold text-sm">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
