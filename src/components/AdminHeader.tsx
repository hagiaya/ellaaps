"use client";

import { Bell, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminHeader() {
  return (
    <header className="flex items-center justify-between p-6 glass-card rounded-none border-t-0 border-x-0 bg-black/40 mb-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-xl shadow-lg shadow-orange-500/10" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-400">Welcome back, Owner</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-10 pr-4 py-2 bg-white/5 border-glass-border rounded-xl text-sm w-64 focus:w-80 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary p-[2px] cursor-pointer">
            <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center overflow-hidden">
              <User size={24} className="text-white/50" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
