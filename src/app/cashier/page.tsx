"use client";

import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  CreditCard, 
  QrCode, 
  ArrowRight,
  Plus,
  Minus
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { GlassCard } from "@/components/DashboardCard";

export default function CashierPortal() {
  const [cart, setCart] = useState<any[]>([]);
  const [showQR, setShowQR] = useState(false);

  const products = [
    { id: 1, name: 'Nastar Premium (Toples)', price: 75000, stock: 45 },
    { id: 2, name: 'Kastengel Keju (Toples)', price: 85000, stock: 32 },
    { id: 3, name: 'Brownies Fudgy (Mika)', price: 55000, stock: 12 },
    { id: 4, name: 'Putri Salju (Toples)', price: 65000, stock: 20 },
    { id: 5, name: 'Sagu Keju (Toples)', price: 65000, stock: 15 },
    { id: 6, name: 'Lidah Kucing (Toples)', price: 60000, stock: 18 },
  ];

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative w-12 h-12">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </Link>
            <h1 className="text-2xl font-bold">The Golden Whisk POS</h1>
          </div>
          <div className="relative group w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary" />
            <input type="text" placeholder="Search product..." className="w-full pl-10 pr-4 py-3 bg-white/5 border-glass-border rounded-xl text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(product => (
            <GlassCard 
              key={product.id} 
              className="p-0 overflow-hidden cursor-pointer group hover-glow border-glass-border"
              onClick={() => addToCart(product)}
            >
              <div className="h-48 bg-white/5 relative flex items-center justify-center p-8">
                <ChefHat size={64} className="text-white/10" />
                <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-primary/30">
                  {product.stock} in stock
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                <p className="text-primary font-black text-xl">Rp {product.price.toLocaleString('id-ID')}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Cart / Sidebar */}
      <div className="w-[450px] bg-black/40 border-l border-glass-border backdrop-blur-3xl flex flex-col p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" /> Current Order
          </h2>
          <span className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest">{cart.length} ITEMS</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-50">
              <ShoppingCart size={64} strokeWidth={1} />
              <p className="font-semibold">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={item.id} 
                className="flex items-center justify-between gap-4 group"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                  <p className="text-xs text-primary font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 bg-white/5 border border-glass-border rounded-xl px-3 py-1">
                    <button className="text-gray-400 hover:text-white transition-colors"><Minus size={14} /></button>
                    <span className="font-black text-sm">{item.qty}</span>
                    <button className="text-gray-400 hover:text-white transition-colors"><Plus size={14} /></button>
                  </div>
                  <button className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="space-y-6 pt-8 border-t border-glass-border">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-semibold">Subtotal</span>
            <span className="font-bold">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-semibold">Tax (Ppn 10%)</span>
            <span className="font-bold">Rp {(total * 0.1).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-glass-border">
            <span className="text-xl font-black">Total</span>
            <span className="text-2xl font-black text-primary">Rp {(total * 1.1).toLocaleString('id-ID')}</span>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={() => setShowQR(true)}
            className="primary-button w-full justify-center py-5 text-xl rounded-2xl disabled:opacity-50 disabled:grayscale"
          >
            Checkout with QRIS
          </button>
        </div>
      </div>

      {/* QRIS Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={() => setShowQR(false)}>
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="glass-card max-w-sm w-full p-10 text-center flex flex-col items-center gap-6"
             onClick={e => e.stopPropagation()}
           >
              <div className="flex flex-col items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={64} height={64} className="mb-2" />
                <h3 className="text-2xl font-black gradient-text">The Golden Whisk</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Midtrans Secure QRIS Payment</p>
              </div>

              <div className="aspect-square w-full bg-white p-6 rounded-3xl shadow-2xl shadow-primary/20">
                <div className="w-full h-full bg-slate-100 flex items-center justify-center relative">
                   <QrCode size={160} className="text-black opacity-20" />
                   <p className="absolute text-slate-400 text-xs font-bold">GENERATING QRIS...</p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 w-full">
                <p className="text-xs text-primary font-bold uppercase mb-1">Total Payable</p>
                <p className="text-2xl font-black">Rp {(total * 1.1).toLocaleString('id-ID')}</p>
              </div>

              <button className="text-gray-500 font-bold hover:text-white transition-colors" onClick={() => setShowQR(false)}>Cancel Payment</button>
           </motion.div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
