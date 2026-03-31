"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, Search, Trash2, CreditCard, QrCode, ArrowRight,
  Plus, Minus, ChefHat, ChevronLeft, Receipt, Camera, X, Check,
  Package, Wallet, History, Clock, ChevronRight, Tag, TrendingDown,
  Phone, Calendar as CalendarIcon, Filter, AlertCircle, Eye, EyeOff,
  User, Lock, LogIn
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/DashboardCard";
import { InventoryItem, Expense } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { mockFinishedProducts, mockEmployees } from "@/lib/mockData";

// Cloudinary Constants
const CLOUDINARY_CLOUD_NAME = "dmjpjmece";
const CLOUDINARY_UPLOAD_PRESET = "ellacakes";

async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return null;
  }
}

export default function CashierPortal() {
  const [isMounted, setIsMounted] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
    const saved = localStorage.getItem('ELA_CASHIER_AUTH');
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
       .in('role', ['cashier', 'admin']) // Admin can also access cashier
       .single();

    if (data) {
       setLoggedInUser(data);
       localStorage.setItem('ELA_CASHIER_AUTH', JSON.stringify(data));
    } else {
       alert("Username atau kata sandi salah, atau Anda tidak punya akses Kasir!");
    }
    setIsLoggingIn(false);
  };

  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeHistoryFilter, setActiveHistoryFilter] = useState<'ALL' | 'HUTANG'>('ALL');
  const [showRevenue, setShowRevenue] = useState(false);
  const [customerDB, setCustomerDB] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);

  useEffect(() => {
     const fetchInitial = async () => {
         // Products
         const { data: p } = await supabase.from('products').select('*, product_variants(*)');
         if (p) {
            setProducts(p.map((prod: any) => ({ 
               ...prod, 
               price_per_unit: prod.product_variants?.[0]?.price || 0,
               variants: prod.product_variants || [] 
            })));
         }

         // Transactions
         const { data: tx } = await supabase
            .from('transactions')
            .select('*, transaction_items(*, product_variants(products(name))), customers(name)')
            .order('created_at', { ascending: false });
         if (tx) {
            setTxHistory(tx.map(t => ({ 
               ...t, 
               customer_name: t.customers?.name || 'Umum', 
               total: Number(t.grand_total || 0), 
               addon: Number(t.addon_price || 0),
               tax: Number(t.tax_amount || 0),
               method: t.payment_method,
               cash_paid: Number(t.pay_amount || 0),
               cash_change: Number(t.change_amount || 0),
               items_summary: t.transaction_items?.map((item: any) => `${item.qty}x ${item.product_variants?.products?.name || 'Produk'}`).join(', '),
               items_detail: t.transaction_items?.map((item: any) => ({
                   name: item.product_variants?.products?.name,
                   qty: item.qty,
                   price_per_unit: item.price_per_unit
               })),
               time: new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
               date: new Date(t.created_at).toLocaleDateString('id-ID')
            })));
         }

         // 3. Packages from Supabase
         const { data: pkAll } = await supabase.from('holiday_packages').select('*, package_payments(*)');
         if (pkAll) {
            const formatted = pkAll.map(p => ({
               ...p,
               payments: p.package_payments || []
            }));
            setPaketHistory(formatted.filter(p => p.type === 'LEBARAN'));
            setPaketNatalHistory(formatted.filter(p => p.type === 'NATAL'));
         }

        // Expenses
        const locE = localStorage.getItem('ELA_EXPENSES');
        if (locE) setExpenseHistory(JSON.parse(locE));

        // Customers
        const { data: cust } = await supabase.from('customers').select('*');
        if (cust) setCustomerDB(cust);

        // Cash Drawer (from special inventory item or settings table - using inventory as per schema)
        const { data: dw } = await supabase.from('inventory').select('stock_quantity').eq('product_id', 'CASH_DRAWER').single();
        if (dw) setTotalCashInDrawer(dw.stock_quantity);
         const { data: st } = await supabase.from('staff').select('*');
         if (st) setStaff(st);
         
         const { data: logs } = await supabase.from('production_logs').select('*, staff(full_name)').order('created_at', { ascending: false });
         if (logs) {
            const { data: pAll } = await supabase.from('products').select('id, name');
            const formatted = logs.flatMap((l: any) => {
               const matched = pAll?.find(pr => pr.name === l.recipe);
               const base = {
                  id: l.id,
                  product_id: matched?.id,
                  product_name: l.recipe,
                  employee_name: l.staff?.full_name || 'Staff',
                  date: new Date(l.created_at).toLocaleDateString('id-ID'),
                  time: new Date(l.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
               };
               const res = [];
               if (l.mika > 0) res.push({ ...base, variant_name: 'Mika', qty: l.mika });
               if (l.sedang > 0) res.push({ ...base, variant_name: 'Toples Sedang', qty: l.sedang });
               if (l.besar > 0) res.push({ ...base, variant_name: 'Toples Besar', qty: l.besar });
               return res;
            });
            setStockLogs(formatted);
         }
     };
     fetchInitial();
     const interval = setInterval(fetchInitial, 5000);
     return () => clearInterval(interval);
  }, []);

  const historyStats = useMemo(() => {
    const today = new Date().toLocaleDateString('id-ID');
    return txHistory.reduce((acc, tx) => {
      if (tx.date === today) {
        acc.total += tx.total;
        const m = tx.method ? tx.method.toUpperCase() : '';
        if (m === 'CASH' || m === 'TUNAI') acc.cash += tx.total;
        else if (m === 'QRIS') acc.qris += tx.total;
        else if (m === 'TRANSFER') acc.transfer += tx.total;
      }
      return acc;
    }, { total: 0, cash: 0, qris: 0, transfer: 0 });
  }, [txHistory]);

  const [showSetorModal, setShowSetorModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showKasbonModal, setShowKasbonModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaketModal, setShowPaketModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<any>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnToStock, setReturnToStock] = useState(true);
  const [selectedPaket, setSelectedPaket] = useState<any>(null);
  const [showCreatePaket, setShowCreatePaket] = useState(false);
  const [newPaketCart, setNewPaketCart] = useState<any[]>([]);
  const [paketCustomer, setPaketCustomer] = useState<any>(null);
  const [paketHistory, setPaketHistory] = useState<any[]>([]);
  const [paketNatalHistory, setPaketNatalHistory] = useState<any[]>([]);
  const [activePaketTab, setActivePaketTab] = useState<'LEBARAN' | 'NATAL'>('LEBARAN');

  const [expenseHistory, setExpenseHistory] = useState<any[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showStockHistoryModal, setShowStockHistoryModal] = useState<any>(null);
  const [selectedStockEmployee, setSelectedStockEmployee] = useState("");

  const [totalCashInDrawer, setTotalCashInDrawer] = useState(0);

  const updateDrawerState = async (newVal: number) => {
    setTotalCashInDrawer(newVal);
    await supabase.from('inventory').upsert({ product_id: 'CASH_DRAWER', stock_quantity: newVal });
  };

  const updateExpenseHistory = (newHistory: any[]) => {
    setExpenseHistory(newHistory);
    localStorage.setItem('ELA_EXPENSES', JSON.stringify(newHistory));
  };

  const updatePaketState = (newHistory: any[]) => {
    setPaketHistory(newHistory);
  };
  const updatePaketNatalState = (newHistory: any[]) => {
    setPaketNatalHistory(newHistory);
  };

  const paketTotal = useMemo(() => {
    const p1 = paketHistory.reduce((acc, p) => acc + (p.payments || []).reduce((a: number, b: any) => a + Number(b.amount), 0), 0);
    const p2 = paketNatalHistory.reduce((acc, p) => acc + (p.payments || []).reduce((a: number, b: any) => a + Number(b.amount), 0), 0);
    return p1 + p2;
  }, [paketHistory, paketNatalHistory]);
  const totalRevenueToday = historyStats.total + paketTotal;

  const [selectedProductionProduct, setSelectedProductionProduct] = useState("");
  const [selectedProductionVariant, setSelectedProductionVariant] = useState("");
  const [productionQty, setProductionQty] = useState("");
  const [kasbonAmount, setKasbonAmount] = useState("");
  const [selectedKasbonEmployee, setSelectedKasbonEmployee] = useState("");
  const [showVariantModal, setShowVariantModal] = useState<any | null>(null);
  const [showPriceSelector, setShowPriceSelector] = useState<any | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustWA, setNewCustWA] = useState("");
  const [addonPrice, setAddonPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'TRANSFER' | 'CASH'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<'BCA' | 'MANDIRI' | 'BRI' | 'BNI'>('BCA');
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseSource, setExpenseSource] = useState<string>("Tunai Kasir");
  const [paymentType, setPaymentType] = useState<'LUNAS' | 'HUTANG'>('LUNAS');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<any>('operasional');
  const [expenseTarget, setExpenseTarget] = useState("");
  const [expenseReceipt, setExpenseReceipt] = useState<File | null>(null);
  const [isUploadingExpense, setIsUploadingExpense] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [payingCicilan, setPayingCicilan] = useState<any>(null);
  const [cicilanMethod, setCicilanMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH');
  const [cicilanPhoto, setCicilanPhoto] = useState<File | null>(null);
  const [isUploadingCicilan, setIsUploadingCicilan] = useState(false);
  const cicilanPhotoRef = useRef<HTMLInputElement>(null);
  
  const [shippingPacket, setShippingPacket] = useState<any>(null);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredHistory = txHistory.filter(tx => activeHistoryFilter === 'ALL' || tx.status === 'HUTANG');

  const addToCart = (product: any, variant: any, priceType: string) => {
    if ((variant.stock || 0) <= 0) {
      alert("Stok varian ini sudah habis!");
      return;
    }
    let p = variant.price;
    let label = "Utama";
    if (priceType === 'grosir') { p = variant.wholesale_price || variant.price * 0.9; label = "Grosir"; }
    else if (priceType === 'lainya') { p = variant.other_price || variant.price; label = "Lainnya"; }
    const cid = `${product.id}-${variant.id}-${priceType}`;
    const exist = cart.find(i => i.cartId === cid);
    if (exist) {
      if (exist.qty + 1 > (variant.stock || 0)) {
        alert("Stok tidak mencukupi!");
        return;
      }
      setCart(cart.map(i => i.cartId === cid ? { ...i, qty: i.qty + 1 } : i));
    }
    else setCart([...cart, { ...product, cartId: cid, name: `${product.name} (${variant.name})`, typeName: label, qty: 1, price_per_unit: p, variantId: variant.id, priceType, maxStock: variant.stock }]);
    setShowPriceSelector(null); setShowVariantModal(null);
  };

  const removeFromCart = (cid: string) => setCart(cart.filter(i => i.cartId !== cid));
  const updateQty = (cid: string, d: number) => setCart(cart.map(i => {
    if (i.cartId === cid) {
      const nextQty = Math.max(1, i.qty + d);
      if (d > 0 && nextQty > (i.maxStock || 0)) {
        alert("Stok tidak mencukupi!");
        return i;
      }
      return { ...i, qty: nextQty };
    }
    return i;
  }));

  const totalSales = cart.reduce((acc, i) => acc + (i.price_per_unit * i.qty), 0);
  const taxAmount = totalSales * 0.11;
  const grandFinal = totalSales + taxAmount + Number(addonPrice || 0);

  const formatCurrency = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num ? Number(num).toLocaleString('id-ID') : "";
  };
  const parseCurrency = (val: string) => val.replace(/\D/g, "");

  const sendToWhatsApp = async (tx: any) => {
     if (!tx.customer_wa) { alert("Nomor WA tidak ditemukan!"); return; }
     
     const message = `*RUMAH KUE GROSIR HULONDELA*\n` +
        `--------------------------------\n` +
        `No. Transaksi : ${tx.id}\n` +
        `Tanggal : ${tx.date} ${tx.time}\n` +
        `Pelanggan : ${tx.customer_name}\n\n` +
        `*RINCIAN PESANAN:*\n` +
        `${tx.items_detail?.map((i: any) => `- ${i.name} (${i.qty}x) @Rp ${(i.price_per_unit || 0).toLocaleString('id-ID')}`).join('\n')}\n` +
        `--------------------------------\n` +
        `Total : *Rp ${(tx.total || 0).toLocaleString('id-ID')}*\n` +
        `Status : ${tx.status}\n\n` +
        `Terima kasih telah berbelanja!`;

     try {
        const res = await fetch('https://api.fonnte.com/send', {
           method: 'POST',
           headers: { 'Authorization': 'YOUR_FONNTE_TOKEN_HERE' }, // TODO: Gantilah dengan Token Anda dari Dashboard Fonnte
           body: new URLSearchParams({
              target: tx.customer_wa,
              message: message,
              countryCode: '62'
           })
        });
        const data = await res.json();
        if (data.status) alert("Berhasil dikirim ke WhatsApp!");
        else alert("Gagal kirim: " + data.reason);
     } catch (e) { alert("Error API Fonnte"); }
  };

  if (!isMounted) return null;

  if (!loggedInUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 20 }}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: '100%', maxWidth: 400 }}>
              <div style={{ padding: 48, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 40, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: 72, height: 72, background: '#2563eb', color: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                      <ShoppingCart size={32} />
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: 950, color: 'white', marginBottom: 8 }}>ELA POS</h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: 40 }}>Sistem Kasir Rumah Kue Hulondela</p>
                  
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ textAlign: 'left' }}>
                          <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Username</label>
                          <input 
                              type="text" 
                              placeholder="Username Kasir..." 
                              value={loginForm.username}
                              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                              required 
                              style={{ width: '100%', height: 56, borderRadius: 16, padding: '0 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700 }}
                          />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                          <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>M-PIN / Password</label>
                          <input 
                              type="password" 
                              placeholder="••••" 
                              value={loginForm.password}
                              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                              required 
                              style={{ width: '100%', height: 56, borderRadius: 16, padding: '0 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700 }}
                          />
                      </div>
                      
                      <button type="submit" disabled={isLoggingIn} style={{ width: '100%', height: 60, borderRadius: 20, border: 'none', background: '#2563eb', color: 'white', fontSize: '15px', fontWeight: 950, marginTop: 12, cursor: 'pointer' }}>
                          {isLoggingIn ? "Memverifikasi..." : "MASUK KASIR"}
                      </button>
                  </form>
                  <p style={{ color: '#475569', fontSize: '11px', marginTop: 32, fontWeight: 700 }}>VERSI 5.0 • SECURE POS ACCESS</p>
              </div>
          </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', color: '#011627', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 40px', overflowY: 'auto', background: '#ffffff' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Link href="/" style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18} /></Link>
               <div>
                  <h1 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0, color: '#0f172a' }}>RUMAH KUE GROSIR HULONDELA</h1>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>RUMAH KUE GORONTALO • POS V.5.0</p>
               </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', margin: 0 }}>KASIR</p>
                  <p style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{loggedInUser?.full_name || 'Kasir'}</p>
               </div>
               <button 
                  onClick={() => { localStorage.removeItem('ELA_CASHIER_AUTH'); setLoggedInUser(null); }}
                  style={{ width: 32, height: 32, borderRadius: '10px', background: '#fff1f2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               >
                  <X size={16} />
               </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
             <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setShowSetorModal(true)} style={{ height: 38, padding: '0 12px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', fontWeight: 900, fontSize: '11px', border: '1px solid #dcfce7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                   <Wallet size={14} /> SETOR
                </button>
                <button onClick={() => { setShowProductionModal(true); setSelectedStockEmployee(loggedInUser?.id || ""); }} style={{ height: 38, padding: '0 12px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontWeight: 900, fontSize: '11px', border: '1px solid #dbeafe', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                   <Package size={14} /> STOK
                </button>
                <button onClick={() => setShowKasbonModal(true)} style={{ height: 38, padding: '0 12px', borderRadius: '10px', background: '#fff7ed', color: '#ea580c', fontWeight: 900, fontSize: '11px', border: '1px solid #ffedd5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                   <Clock size={14} /> KASBON
                </button>
                <button onClick={() => setShowExpenseModal(true)} style={{ height: 38, padding: '0 12px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', fontWeight: 900, fontSize: '11px', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                   <TrendingDown size={14} /> COST
                </button>
                <button onClick={() => setShowPaketModal(true)} style={{ height: 38, padding: '0 12px', borderRadius: '10px', background: '#faf5ff', color: '#a855f7', fontWeight: 900, fontSize: '11px', border: '1px solid #f3e8ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                   <Tag size={14} /> PAKET
                </button>
                <button onClick={() => setShowHistoryModal(true)} style={{ height: 38, padding: '0 12px', borderRadius: '10px', background: '#0f172a', color: 'white', fontWeight: 950, fontSize: '11px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                   <History size={14}/> LOG
                </button>
             </div>

             <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} />
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  value={searchTerm || ''} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    height: 38,
                    padding: '0 40px 0 36px', 
                    borderRadius: '12px', 
                    border: '1px solid #2563eb', 
                    background: '#ffffff', 
                    fontWeight: 800,
                    fontSize: '13px',
                    color: '#0f172a'
                  }} 
                />
                <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: '#2563eb', color: 'white', width: 32, height: 26, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ArrowRight size={14} />
                </div>
             </div>
          </div>
        </div>



        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p, idx) => {
              const isOutOfStock = p.variants?.every((v: any) => (v.stock || 0) <= 0);
              return (
                <motion.div 
                  whileHover={isOutOfStock ? {} : { y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }} 
                  whileTap={isOutOfStock ? {} : { scale: 0.98 }} 
                  key={p.id || `p-${idx}`} 
                  onClick={() => !isOutOfStock && setShowVariantModal(p)} 
                  style={{ 
                    background: '#ffffff', 
                    borderRadius: '20px', 
                    border: '1px solid #f1f5f9', 
                    overflow: 'hidden', 
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)', 
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                   {isOutOfStock && (
                     <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: 8, fontSize: '8px', fontWeight: 950 }}>
                        HABIS
                     </div>
                   )}
                   <div style={{ height: 130, background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isOutOfStock ? 0.35 : 1 }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                          <ChefHat size={40} />
                        </div>
                      )}
                   </div>
                   <div style={{ padding: '12px 14px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 900, color: '#0f172a', lineHeight: '1.3', height: 28, overflow: 'hidden' }}>{p.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', fontWeight: 950, color: isOutOfStock ? '#94a3b8' : '#2563eb' }}>Rp {(p.price_per_unit || 0).toLocaleString('id-ID')}</span>
                         <div style={{ display: 'flex', gap: 4 }}>
                            <button 
                               onClick={(e) => { e.stopPropagation(); setShowStockHistoryModal(p); }} 
                               style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '4px', borderRadius: '8px', color: '#64748b', cursor: 'pointer' }}
                            >
                               <History size={12}/>
                            </button>
                            <div style={{ background: isOutOfStock ? '#e2e8f0' : '#0f172a', padding: '4px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <Plus size={12}/>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              );
            })}
        </div>


      </div>

      <div style={{ width: 380, background: '#ffffff', borderLeft: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 950, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}><ShoppingCart size={22}/> Keranjang Belanja</h2>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
          {cart.length === 0 ? <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}><Receipt size={64}/><p>Keranjang Kosong</p></div> : 
             cart.map(i => (
               <div key={i.cartId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#f8fafc', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '11px', fontWeight: 950, margin: '0 0 2px 0', color: '#0f172a', textTransform: 'uppercase' }}>{i.name}</p>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: '8px', background: '#0f172a', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 950 }}>{i.typeName}</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>@Rp {(i.price_per_unit || 0).toLocaleString('id-ID')}</span>
                     </div>
                     <div style={{ fontSize: '13px', fontWeight: 950, color: '#000' }}>
                        Rp {((i.price_per_unit || 0) * i.qty).toLocaleString('id-ID')}
                     </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <button onClick={() => updateQty(i.cartId, -1)} style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Minus size={14} /></button>
                     <b style={{ fontSize: '14px', minWidth: 24, textAlign: 'center' }}>{i.qty}</b>
                     <button onClick={() => updateQty(i.cartId, 1)} style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid #0f172a', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={14} /></button>
                     <button onClick={() => removeFromCart(i.cartId)} style={{ width: 28, height: 28, borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 4 }}><Trash2 size={14} /></button>
                  </div>
               </div>
             ))
          }
        </div>

        <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
           <div style={{ position: 'relative' }}>
             <input 
               type="text" 
               placeholder="Pelanggan..." 
               value={customerName || ''} 
               onChange={e => {
                 setCustomerName(e.target.value);
                 setShowCustomerDropdown(true);
               }} 
               onFocus={() => setShowCustomerDropdown(true)}
               style={{ width: '100%', padding: 10, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '12px' }} 
             />
             {showCustomerDropdown && customerName && (
               <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'white', borderRadius: 12, boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', marginBottom: 6, zIndex: 50, maxHeight: 150, overflowY: 'auto', border: '1px solid #f1f5f9' }}>
                 {customerDB.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).map(c => (
                   <div key={c.id} onClick={() => { setCustomerName(c.name); setCustomerWA(c.wa || ""); setShowCustomerDropdown(false); }} style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}>
                     <span style={{ fontWeight: 800, fontSize: '12px' }}>{c.name}</span>
                     <span style={{ fontSize: '9px', color: '#94a3b8' }}>{c.wa}</span>
                   </div>
                 ))}
                 {!customerDB.find(c => c.name.toLowerCase() === customerName.toLowerCase()) && (
                    <div 
                      onClick={async () => { 
                        const { data, error } = await supabase.from('customers').insert({
                          name: customerName,
                          wa_number: customerWA
                        }).select().single();
                        
                        if (error) {
                          alert("Gagal simpan pelanggan: " + (error?.message || "Error"));
                        } else {
                          setCustomerDB([data, ...customerDB]); 
                          setShowCustomerDropdown(false); 
                        }
                      }} 
                      style={{ padding: '10px 14px', background: '#eff6ff', color: '#2563eb', fontWeight: 950, fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}
                    >
                      + SIMPAN
                    </div>
                  )}
               </div>
             )}
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="text" placeholder="WA..." value={customerWA || ''} onChange={e => setCustomerWA(e.target.value)} style={{ padding: 10, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px' }} />
              <input type="date" value={transactionDate || ''} onChange={e => setTransactionDate(e.target.value)} style={{ padding: 10, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px' }} />
           </div>

           <input type="text" placeholder="Addon Rp" value={formatCurrency(String(addonPrice || ""))} onChange={e => setAddonPrice(Number(parseCurrency(e.target.value)))} style={{ padding: 10, borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 900, fontSize: '13px' }} />
           
           <div style={{ background: '#0f172a', padding: '16px', borderRadius: '18px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.6, marginBottom: 4 }}><span>Total + Tax</span><span>Rp {(totalSales + taxAmount).toLocaleString('id-ID')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 800, fontSize: '12px' }}>GRAND TOTAL</span><span style={{ fontSize: '18px', fontWeight: 950 }}>Rp {grandFinal.toLocaleString('id-ID')}</span></div>
           </div>

           <button disabled={cart.length === 0 || !customerName} onClick={() => setShowPaymentModal(true)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#2563eb', color: 'white', border: 'none', fontWeight: 950, fontSize: '14px', cursor: 'pointer', opacity: (cart.length === 0 || !customerName) ? 0.5 : 1 }}>BAYAR SEKARANG</button>
        </div>
      </div>

      <AnimatePresence>
         {showVariantModal && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: 420, background: 'white', borderRadius: '32px', padding: 40 }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 950 }}>Pilih Varian</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {showVariantModal.variants.map((v: any) => (
                      <button 
                        key={v.id} 
                        disabled={(v.stock || 0) <= 0}
                        onClick={() => setShowPriceSelector({ product: showVariantModal, variant: v })} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '18px', border: '1px solid #f1f5f9', background: (v.stock || 0) <= 0 ? '#f8fafc' : '#f8fafc', opacity: (v.stock || 0) <= 0 ? 0.4 : 1, fontWeight: 900, cursor: (v.stock || 0) <= 0 ? 'not-allowed' : 'pointer' }}
                      >
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span>{v.name}</span>
                            <span style={{ fontSize: '10px', color: (v.stock || 0) <= 0 ? '#ef4444' : '#64748b' }}>
                               {(v.stock || 0) <= 0 ? "Stok Habis" : `Stok: ${v.stock}`}
                            </span>
                         </div>
                         <ChevronRight size={18}/>
                      </button>
                    ))}
                 </div>
                <button onClick={() => setShowVariantModal(null)} style={{ width: '100%', marginTop: 20, border: 'none', background: 'none', color: '#94a3b8', fontWeight: 800, cursor: 'pointer' }}>BATAL</button>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showPriceSelector && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: 440, background: 'white', borderRadius: '40px', padding: 40 }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 950 }}>Pilih Tipe Harga</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                   <button onClick={() => addToCart(showPriceSelector.product, showPriceSelector.variant, 'utama')} style={{ padding: '24px', borderRadius: '22px', border: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Tag size={18}/><b style={{ fontWeight: 950 }}>Harga Utama</b></div>
                      <b style={{ fontWeight: 950 }}>Rp {(showPriceSelector.variant.price || 0).toLocaleString('id-ID')}</b>
                   </button>
                   <button onClick={() => addToCart(showPriceSelector.product, showPriceSelector.variant, 'grosir')} style={{ padding: '24px', borderRadius: '22px', border: '1px solid #dcfce7', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><TrendingDown color="#16a34a" size={18}/><b style={{ fontWeight: 950, color: '#16a34a' }}>Harga Grosir</b></div>
                      <b style={{ fontWeight: 950, color: '#16a34a' }}>Rp {(showPriceSelector.variant.wholesale_price || 0).toLocaleString('id-ID')}</b>
                   </button>
                </div>
                <button onClick={() => setShowPriceSelector(null)} style={{ width: '100%', marginTop: 24, border: 'none', background: 'none', color: '#94a3b8', fontWeight: 800, cursor: 'pointer' }}>KEMBALI</button>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 30, 0.6)', backdropFilter: 'blur(20px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: 440, background: 'white', borderRadius: '40px', padding: 40 }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 950 }}>Pilih Pembayaran</h3>
                <div style={{ marginBottom: 24 }}>
                   <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>TOTAL TAGIHAN</span>
                   <h2 style={{ fontSize: '32px', fontWeight: 950, margin: 0 }}>Rp {(grandFinal || 0).toLocaleString('id-ID')}</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                   {['CASH', 'QRIS', 'TRANSFER'].map(m => (
                     <button key={m} onClick={() => setPaymentMethod(m as any)} style={{ padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', background: paymentMethod === m ? '#0f172a' : '#f8fafc', color: paymentMethod === m ? 'white' : '#64748b', fontSize: '11px', fontWeight: 950, cursor: 'pointer' }}>{m}</button>
                   ))}
                </div>
                {paymentMethod === 'CASH' && (
                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>JUMLAH BAYAR (TUNAI)</label>
                      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                         <input type="text" value={formatCurrency(cashAmount || '')} onChange={e => setCashAmount(parseCurrency(e.target.value))} placeholder="Rp 0" style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 950, fontSize: '20px' }} />
                         {(Number(cashAmount) || 0) >= grandFinal && (
                            <div style={{ marginTop: 12, padding: '12px 20px', background: '#f0fdf4', borderRadius: 12, color: '#16a34a', fontWeight: 950, fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                               <span>KEMBALI:</span>
                               <span>Rp {((Number(cashAmount) || 0) - grandFinal).toLocaleString('id-ID')}</span>
                            </div>
                         )}
                      </div>
                   </motion.div>
                )}
                {(paymentMethod === 'TRANSFER' || paymentMethod === 'QRIS') && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20, background: '#f8fafc', borderRadius: 20, border: '2px dashed #e2e8f0', marginBottom: 24, textAlign: 'center' }}>
                      {paymentMethod === 'TRANSFER' ? <p style={{ fontSize: '12px', fontWeight: 900, margin: 0 }}>No Rek: {selectedBank} 123-456-7890 a/n El-A</p> : <div style={{ opacity: 0.5 }}><QrCode size={40} style={{ margin: '0 auto' }}/> Scan & Upload</div>}
                   </motion.div>
                )}
                <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 14, marginBottom: 32 }}>
                   {['LUNAS', 'HUTANG'].map(s => (
                     <button key={s} onClick={() => setPaymentType(s as any)} style={{ flex: 1, padding: 12, borderRadius: 11, border: 'none', background: paymentType === s ? '#0f172a' : 'transparent', color: paymentType === s ? 'white' : '#64748b', fontWeight: 950, cursor: 'pointer' }}>{s}</button>
                   ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={async () => {
                         try {
                            const transactionId = `TX-${Date.now().toString().slice(-6)}`;
                            const customerId = customerDB.find(c => c.name === customerName)?.id;

                            // 1. Create Transaction record
                            const { error: txError } = await supabase.from('transactions').insert({
                               id: transactionId,
                               customer_id: customerId,
                               cashier_name: 'Kasir Utama',
                               total_sales: totalSales,
                               tax_amount: taxAmount,
                               addon_price: Number(addonPrice || 0),
                               grand_total: grandFinal,
                               payment_method: paymentMethod,
                               status: paymentType,
                               pay_amount: paymentMethod === 'CASH' ? Number(cashAmount) : grandFinal,
                               change_amount: paymentMethod === 'CASH' ? (Number(cashAmount) - grandFinal) : 0
                            });

                            if (txError) throw txError;

                            // 2. Create Transaction Items
                            const itemsToInsert = cart.map(i => ({
                               transaction_id: transactionId,
                               variant_id: i.variantId,
                               qty: i.qty,
                               price_per_unit: i.price_per_unit
                            }));

                            const { error: itemsError } = await supabase.from('transaction_items').insert(itemsToInsert);
                            if (itemsError) throw itemsError;

                            // 3. Update Stocks
                            for (const item of cart) {
                               const { data: vData } = await supabase.from('product_variants').select('stock').eq('id', item.variantId).single();
                               if (vData) {
                                 const currentStock = vData.stock || 0;
                                 const newStock = Math.max(0, currentStock - item.qty);
                                 await supabase.from('product_variants').update({ stock: newStock }).eq('id', item.variantId);
                               }
                            }

                            // 4. Local State Update
                            const ntx = { 
                               id: transactionId,
                               customer_name: customerName,
                               total: grandFinal,
                               status: paymentType,
                               method: paymentMethod,
                               date: new Date().toLocaleDateString('id-ID'),
                               time: new Date().toLocaleTimeString('id-ID'),
                               items_detail: cart,
                               cash_paid: paymentMethod === 'CASH' ? Number(cashAmount) : grandFinal,
                               cash_change: paymentMethod === 'CASH' ? (Number(cashAmount) - grandFinal) : 0
                            };

                            setTxHistory([ntx, ...txHistory]); 
                            setReceiptPreview(ntx); 
                            setCart([]); 
                            setCustomerName(""); 
                            setCustomerWA(""); 
                            setAddonPrice(0); 
                            setCashAmount(""); 
                            setShowPaymentModal(false);

                            if (paymentMethod === 'CASH' && paymentType === 'LUNAS') {
                               updateDrawerState(totalCashInDrawer + grandFinal);
                            }
                            alert("Transaksi Berhasil!");
                         } catch (err: any) {
                            console.error("Checkout error:", err);
                            alert("Gagal memproses transaksi: " + err.message);
                         }
                    }} style={{ flex: 2, padding: 18, borderRadius: 16, border: 'none', background: '#10b981', color: 'white', fontWeight: 950, fontSize: '15px', cursor: 'pointer' }}>KONFIRMASI BAYAR</button>
                    <button onClick={() => setShowPaymentModal(false)} style={{ flex: 1, padding: 18, borderRadius: 16, border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: 950, fontSize: '13px', cursor: 'pointer' }}>X</button>
                 </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receiptPreview && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(24px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ width: 440, background: 'white', borderRadius: '24px', padding: '48px', boxShadow: '0 40px 100px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }}></div>
                <button onClick={() => setReceiptPreview(null)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20}/></button>
                
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                   <h2 style={{ fontSize: '18px', fontWeight: 950, margin: 0, color: '#0f172a', letterSpacing: '0.05em' }}>RUMAH KUE GROSIR HULONDELA</h2>
                   <p style={{ fontSize: '10px', color: '#64748b', marginTop: 4, fontWeight: 700 }}>Jl. DJ Buloto, Kel. Tenilo, Kec. Limboto, Kab. Gorontalo</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28, fontSize: '11px', color: '#475569', fontWeight: 800 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No. Transaksi</span><span>{receiptPreview.id}</span></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tanggal</span><span>{receiptPreview.date} • {receiptPreview.time}</span></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kasir</span><span>{receiptPreview.cashier_name || "Admin"}</span></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pelanggan</span><span>{receiptPreview.customer_name}</span></div>
                </div>

                <div style={{ borderBottom: '2px dashed #f1f5f9', marginBottom: 24 }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                   {receiptPreview.items_detail ? receiptPreview.items_detail.map((item: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
                            <span>{item.name}</span>
                            <span>Rp {(item.price_per_unit * item.qty).toLocaleString('id-ID')}</span>
                         </div>
                         <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>
                            {item.qty} x Rp {item.price_per_unit.toLocaleString('id-ID')} ({item.typeName})
                         </div>
                      </div>
                   )) : (
                      <div style={{ fontSize: '13px', fontWeight: 900 }}>{receiptPreview.items_summary || receiptPreview.id}</div>
                   )}
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: 800 }}>
                      <span>Subtotal</span>
                      <span>Rp {((receiptPreview.total || 0) - (receiptPreview.addon || 0) + (receiptPreview.discount || 0) - (receiptPreview.tax || 0)).toLocaleString('id-ID')}</span>
                   </div>
                   {(receiptPreview.addon || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2563eb', fontWeight: 800 }}>
                         <span>Biaya Tambahan</span>
                         <span>Rp {(receiptPreview.addon || 0).toLocaleString('id-ID')}</span>
                      </div>
                   )}
                   {(receiptPreview.discount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ef4444', fontWeight: 800 }}>
                         <span>Diskon</span>
                         <span>- Rp {(receiptPreview.discount || 0).toLocaleString('id-ID')}</span>
                      </div>
                   )}
                   <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0' }}></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 950, color: '#0f172a' }}>
                      <span>TOTAL</span>
                      <span>Rp {(receiptPreview.total || 0).toLocaleString('id-ID')}</span>
                   </div>
                   {receiptPreview.method === 'CASH' && receiptPreview.status === 'LUNAS' && (
                      <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: 800 }}>
                            <span>Bayar</span>
                            <span>Rp {(receiptPreview.cash_paid || 0).toLocaleString('id-ID')}</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: 800 }}>
                            <span>Kembali</span>
                            <span>Rp {(receiptPreview.cash_change || 0).toLocaleString('id-ID')}</span>
                         </div>
                      </div>
                   )}
                   <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <span style={{ fontSize: '10px', background: '#0f172a', color: 'white', padding: '6px 14px', borderRadius: 20, fontWeight: 950, letterSpacing: '0.03em' }}>
                         {receiptPreview.status || 'LUNAS'} • {receiptPreview.method}
                      </span>
                   </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                   <p style={{ fontSize: '12px', fontWeight: 900, color: '#475569', margin: 0 }}>Terima kasih telah berbelanja</p>
                   <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginTop: 4 }}>Semoga harimu menyenangkan!</p>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, color: '#2563eb' }}>
                      <Phone size={12}/>
                      <span style={{ fontSize: '11px', fontWeight: 950 }}>081927952540</span>
                   </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                   <button onClick={() => window.print()} style={{ flex: '1 1 100%', padding: '18px', background: '#0f172a', color: 'white', borderRadius: '16px', fontWeight: 950, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Receipt size={20}/> CETAK STRUK</button>
                   <button onClick={() => sendToWhatsApp(receiptPreview)} style={{ flex: 1, padding: '16px', background: '#25d366', color: 'white', borderRadius: '16px', fontWeight: 950, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Phone size={18}/> WHATSAPP</button>
                   <button onClick={() => setReceiptPreview(null)} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#64748b', borderRadius: '16px', fontWeight: 950, border: 'none', cursor: 'pointer' }}>TUTUP</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modals */}
      <AnimatePresence>
         {/* SETOR MODAL */}
         {showSetorModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: 400, background: 'white', borderRadius: 32, padding: 40, textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, background: '#f0fdf4', color: '#16a34a', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                     <Wallet size={32} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontWeight: 950 }}>Setoran Kas</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: 32 }}>Silahkan setor uang tunai di laci ke kasir gudang / owner.</p>
                  <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20, marginBottom: 32 }}>
                     <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>TOTAL TUNAI SAAT INI</span>
                     <h2 style={{ fontSize: '28px', fontWeight: 950, margin: 0, color: '#0f172a' }}>Rp {(totalCashInDrawer || 0).toLocaleString('id-ID')}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                     <button onClick={() => { 
                        const currentGudang = Number(localStorage.getItem('ELA_GUDANG_BALANCE') || '15000000');
                        localStorage.setItem('ELA_GUDANG_BALANCE', String(currentGudang + totalCashInDrawer));
                        updateDrawerState(0);
                        setShowSetorModal(false); 
                        alert("Berhasil di setor ke Gudang!"); 
                     }} style={{ flex: 1, padding: 18, background: '#16a34a', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>KONFIRMASI</button>
                     <button onClick={() => setShowSetorModal(false)} style={{ padding: 18, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>BATAL</button>
                  </div>
               </motion.div>
            </div>
         )}

         {/* STOK KUE MODAL */}
         {showProductionModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: 420, background: 'white', borderRadius: 32, padding: 40 }}>
                   <h3 style={{ margin: '0 0 24px 0', fontWeight: 950 }}>Input Stok Baru</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                      <div>
                         <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>PILIH PRODUK</label>
                         <select value={selectedProductionProduct} onChange={e => { setSelectedProductionProduct(e.target.value); setSelectedProductionVariant(""); }} style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                            <option value="">Pilih Produk...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                      </div>
                      {selectedProductionProduct && (
                         <div>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>PILIH VARIAN / UKURAN</label>
                            <select value={selectedProductionVariant} onChange={e => setSelectedProductionVariant(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                               <option value="">Pilih Ukuran...</option>
                               {products.find(p => p.id === selectedProductionProduct)?.variants?.map(v => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                               ))}
                            </select>
                         </div>
                      )}
                      <div>
                         <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>PETUGAS INPUT (KARYAWAN / KASIR)</label>
                         <select value={selectedStockEmployee} onChange={e => setSelectedStockEmployee(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                            <option value="">Pilih Petugas...</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role.toUpperCase()})</option>)}
                            {!staff.find(s => s.id === loggedInUser?.id) && loggedInUser && (
                               <option value={loggedInUser.id}>{loggedInUser.full_name} (KASIR LOGIN)</option>
                            )}
                         </select>
                      </div>
                      <div>
                         <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>JUMLAH (PICIS/MIKA)</label>
                         <input type="number" value={productionQty} onChange={e => setProductionQty(e.target.value)} placeholder="0" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '18px' }} />
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={async () => { 
                         if (!selectedProductionProduct || !selectedProductionVariant || !selectedStockEmployee || !productionQty) { alert("Data tidak lengkap!"); return; }
                         const product = products.find(p => p.id === selectedProductionProduct);
                         const variant = product?.variants?.find(v => v.id === selectedProductionVariant);
                         const emp = staff.find(s => s.id === selectedStockEmployee) || (loggedInUser?.id === selectedStockEmployee ? loggedInUser : null);
                         
                         const newLog = { 
                            id: `STK-${Date.now()}`, 
                            product_id: selectedProductionProduct, 
                            product_name: product?.name,
                            variant_name: variant?.name,
                            employee_name: emp?.full_name || 'Petugas', 
                            qty: Number(productionQty), 
                            date: new Date().toLocaleDateString('id-ID'), 
                            time: new Date().toLocaleTimeString('id-ID') 
                         };
                         const updatedLogs = [newLog, ...stockLogs];
                          await supabase.from("production_logs").insert({ staff_id: selectedStockEmployee, recipe: product?.name || "", weight_kg: 0, mika: (variant?.name || "").toLowerCase().includes("mika") ? Number(productionQty) : 0, sedang: (variant?.name || "").toLowerCase().includes("sedang") ? Number(productionQty) : 0, besar: (variant?.name || "").toLowerCase().includes("besar") ? Number(productionQty) : 0, date: new Date().toISOString().split("T")[0] });                         
                         if (variant) {
                            await supabase.from('product_variants').update({ stock: (variant.stock || 0) + Number(productionQty) }).eq('id', variant.id);
                         }
                         setShowProductionModal(false); setProductionQty(""); setSelectedProductionVariant(""); alert("Stok Varian Berhasil Dicatat!");
                      }} style={{ flex: 1, padding: 18, background: '#2563eb', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>SIMPAN STOK</button>
                      <button onClick={() => setShowProductionModal(false)} style={{ padding: 18, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>BATAL</button>
                   </div>
                </motion.div>
            </div>
         )}

         {/* KASBON MODAL */}
         {showKasbonModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: 420, background: 'white', borderRadius: 32, padding: 40 }}>
                  <h3 style={{ margin: '0 0 24px 0', fontWeight: 950 }}>Input Kasbon Karyawan</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>KARYAWAN</label>
                        <select value={selectedKasbonEmployee} onChange={e => setSelectedKasbonEmployee(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                           <option value="">Pilih Karyawan...</option>
                           {staff.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>NOMINAL KASBON (RP)</label>
                        <input type="text" value={formatCurrency(kasbonAmount)} onChange={e => setKasbonAmount(parseCurrency(e.target.value))} placeholder="Rp 0" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '18px' }} />
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={async () => { 
                         if (!selectedKasbonEmployee || !kasbonAmount) return alert("Lengkapi data!");
                         const { error } = await supabase.from('staff_kasbon').insert({
                            staff_id: selectedKasbonEmployee,
                            amount: Number(kasbonAmount),
                            date: new Date().toISOString().split('T')[0],
                            reason: 'Kasbon Kasir'
                         });
                         if (error) alert("Gagal catat: " + error.message);
                         else {
                            setShowKasbonModal(false); 
                            setKasbonAmount(""); 
                            alert("Kasbon berhasil dicatat!"); 
                         }
                      }} style={{ flex: 1, padding: 18, background: '#ea580c', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>CATAT KASBON</button>
                     <button onClick={() => setShowKasbonModal(false)} style={{ padding: 18, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>BATAL</button>
                  </div>
               </motion.div>
            </div>
         )}

         {/* PENGELUARAN MODAL */}
         {showExpenseModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: 420, background: 'white', borderRadius: 32, padding: 40 }}>
                  <h3 style={{ margin: '0 0 24px 0', fontWeight: 950 }}>Input Pengeluaran / Biaya</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>SUMBER KAS</label>
                        <select value={expenseSource} onChange={e => setExpenseSource(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                           <option value="Tunai Kasir">Tunai Kasir</option>
                           <option value="Kas Gudang">Kas Gudang</option>
                           <option value="Bank">Bank / Transfer</option>
                        </select>
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>KATEGORI</label>
                        <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value as any)} style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                           <option value="bahan_baku">Bahan Baku</option>
                           <option value="operasional">Operasional</option>
                           <option value="gaji">Gaji / Kasbon</option>
                           <option value="lainnya">Lain-lain</option>
                        </select>
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>TUJUAN PENGELUARAN</label>
                        <input type="text" value={expenseTarget} onChange={e => setExpenseTarget(e.target.value)} placeholder="Contoh: Beli Telur, Bayar Listrik" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }} />
                     </div>
                     <div>
                        <input type="text" value={expenseNote} onChange={e => setExpenseNote(e.target.value)} placeholder="Contoh: Beli Token Listrik, Parkir, dll" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }} />
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>UPLOAD FOTO STRUK (OPSIONAL)</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()} 
                          style={{ padding: '20px', borderRadius: 18, border: '2px dashed #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                           {expenseReceipt ? (
                             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                               <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px 14px', borderRadius: 10, fontSize: '11px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: 6 }}>
                                 <Check size={14}/> TERPILIH
                               </div>
                               <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{expenseReceipt.name}</span>
                             </div>
                           ) : (
                             <>
                               <Camera size={24} color="#94a3b8" />
                               <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>Klik untuk ambil foto / pilih struk</span>
                             </>
                           )}
                        </div>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" capture="environment" onChange={(e) => setExpenseReceipt(e.target.files?.[0] || null)} />
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>NOMINAL (RP)</label>
                        <input type="text" value={formatCurrency(expenseAmount)} onChange={e => setExpenseAmount(parseCurrency(e.target.value))} placeholder="Rp 0" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '18px' }} />
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                     <button 
                       disabled={isUploadingExpense}
                       onClick={async () => { 
                         if (!expenseTarget || !expenseAmount) { alert("Data tidak lengkap!"); return; }
                         setIsUploadingExpense(true);
                         let url = "";
                         try {
                            if (expenseReceipt) {
                               const fname = `receipts/${Date.now()}-${expenseReceipt.name.replace(/\s+/g, '_')}`;
                               const { data, error: upError } = await supabase.storage.from('documents').upload(fname, expenseReceipt);
                               if (upError) throw upError;
                               const { data: pUrl } = supabase.storage.from('documents').getPublicUrl(fname);
                               url = pUrl.publicUrl;
                            }

                            if (expenseSource === 'Tunai Kasir') {
                               updateDrawerState(totalCashInDrawer - Number(expenseAmount));
                            }

                            const newExp = {
                                category: expenseCategory,
                                target: expenseTarget,
                                amount: Number(expenseAmount),
                                source: expenseSource,
                                note: expenseNote,
                                attachment_url: url,
                                date: new Date().toISOString().split('T')[0]
                             };
                             const { error: dbError } = await supabase.from('expenses').insert(newExp);
                             if (dbError) throw dbError;

                             updateExpenseHistory([newExp, ...expenseHistory]);
                             alert("Pengeluaran berhasil dicatat!");
                             setShowExpenseModal(false); 
                             setExpenseAmount(""); 
                             setExpenseNote(""); 
                             setExpenseTarget("");
                             setExpenseReceipt(null);
                         } catch (err: any) {
                            alert("Gagal simpan: " + err.message);
                         } finally {
                            setIsUploadingExpense(false);
                         }
                      }} style={{ flex: 1, padding: 18, background: '#ef4444', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer', opacity: isUploadingExpense ? 0.6 : 1 }}>
                         {isUploadingExpense ? "MENYIMPAN..." : "SIMPAN BIAYA"}
                      </button>
                      <button onClick={() => { setShowExpenseModal(false); setExpenseReceipt(null); }} style={{ padding: 18, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>BATAL</button>
                   </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {/* STOCK HISTORY MODAL */}
         {showStockHistoryModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: 500, background: 'white', borderRadius: '32px', padding: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                     <div>
                        <h3 style={{ margin: 0, fontWeight: 950 }}>Riwayat Stok</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{showStockHistoryModal.name}</p>
                     </div>
                     <button onClick={() => setShowStockHistoryModal(null)} style={{ background: '#f8fafc', border: 'none', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}><X size={20}/></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
                     {stockLogs.filter(l => l.product_id === showStockHistoryModal.id).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                           <Package size={48} style={{ margin: '0 auto 12px' }}/>
                           <p style={{ fontSize: '13px' }}>Belum ada riwayat input stok</p>
                        </div>
                     ) : (
                        stockLogs.filter(l => l.product_id === showStockHistoryModal.id).map(log => (
                           <div key={`${log.id}-${log.variant_name}`} style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: '18px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                 <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>{log.date} • {log.time}</span>
                                 <p style={{ margin: '2px 0 0 0', fontWeight: 900, color: '#0f172a' }}>{log.employee_name}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <span style={{ fontSize: '14px', fontWeight: 950, color: '#2563eb' }}>+ {log.qty}</span>
                                 <p style={{ fontSize: '9px', color: '#64748b', margin: 0 }}>Input Stok</p>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
                  <button onClick={() => setShowStockHistoryModal(null)} style={{ width: '100%', marginTop: 32, padding: '16px', background: '#f1f5f9', border: 'none', borderRadius: '14px', color: '#64748b', fontWeight: 950, cursor: 'pointer' }}>BATAL</button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {/* HISTORY MODAL */}
         {showHistoryModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: 1000, background: 'white', borderRadius: '40px', padding: 48, boxShadow: '0 40px 100px -20px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                     <div>
                        <h2 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Audit Penjualan & Riwayat</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginTop: 4 }}>Monitoring pendapatan real-time dan log transaksi harian.</p>
                     </div>
                     <button onClick={() => setShowHistoryModal(false)} style={{ background: '#f8fafc', border: 'none', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}><X size={24}/></button>
                  </div>

                  {/* Profit Summary Dashboard */}
                  <div style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, display: 'grid', marginBottom: 48, background: '#f8fafc', padding: '32px', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                     <div style={{ padding: '0 16px', borderRight: '1px solid #e1e8f0' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pendapatan Harini</span>
                        <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: '4px 0 0 0' }}>Rp {(totalRevenueToday || 0).toLocaleString('id-ID')}</h3>
                     </div>
                     <div style={{ padding: '0 16px', borderRight: '1px solid #e1e8f0' }}>
                        <span style={{ color: '#16a34a', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tunai (Laci)</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#16a34a', margin: '4px 0 0 0' }}>Rp {(historyStats?.cash || 0).toLocaleString('id-ID')}</h3>
                     </div>
                     <div style={{ padding: '0 16px', borderRight: '1px solid #e1e8f0' }}>
                        <span style={{ color: '#2563eb', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>QRIS</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#2563eb', margin: '4px 0 0 0' }}>Rp {(historyStats?.qris || 0).toLocaleString('id-ID')}</h3>
                     </div>
                     <div style={{ padding: '0 16px' }}>
                        <span style={{ color: '#ec4899', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transfer</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#ec4899', margin: '4px 0 0 0' }}>Rp {(historyStats?.transfer || 0).toLocaleString('id-ID')}</h3>
                     </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                      <div style={{ display: 'flex', background: '#f8fafc', padding: 6, borderRadius: 14 }}>
                         <button onClick={() => setActiveHistoryFilter('ALL')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: activeHistoryFilter === 'ALL' ? '#0f172a' : 'transparent', color: activeHistoryFilter === 'ALL' ? '#fff' : '#64748b', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>SEMUA TRANSAKSI</button>
                         <button onClick={() => setActiveHistoryFilter('HUTANG')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: activeHistoryFilter === 'HUTANG' ? '#ef4444' : 'transparent', color: activeHistoryFilter === 'HUTANG' ? '#fff' : '#64748b', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}><AlertCircle size={16}/> PIUTANG / HUTANG</button>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8' }}>Ditemukan {filteredHistory.length} Record</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filteredHistory.map(tx => (
                      <GlassCard key={tx.id} style={{ padding: '24px 32px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: tx.status === 'HUTANG' ? '1px solid #fecdd3' : '1px solid #f1f5f9' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 2 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={18} color="#64748b" /></div>
                            <div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h4 style={{ margin: 0, fontWeight: 950, fontSize: '15px' }}>{tx.customer_name}</h4><span style={{ fontSize: '10px', background: tx.status === 'LUNAS' ? '#dcfce7' : '#fee2e2', color: tx.status === 'LUNAS' ? '#16a34a' : '#ef4444', padding: '2px 8px', borderRadius: 6, fontWeight: 950 }}>{tx.status}</span></div>
                               <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>{tx.id} • {tx.time} • {tx.method}</p>
                            </div>
                         </div>
                         <div style={{ flex: 1.5, padding: '0 24px', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 24px' }}>Produk:</p>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: '#475569', margin: 0 }}>{tx.items_summary || tx.id}</p>
                         </div>
                         <div style={{ flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'flex-end' }}>
                            <div><span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>TOTAL</span><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 950 }}>Rp {(tx.total || 0).toLocaleString('id-ID')}</h3></div>
                            {tx.status === 'HUTANG' && (
                              <button 
                                onClick={() => { if(confirm("Pelunasan Tx " + tx.id + " ?")) setTxHistory(txHistory.map(t => t.id === tx.id ? { ...t, status: 'LUNAS' } : t)); }}
                                style={{ padding: '12px 20px', borderRadius: 12, background: '#10b981', color: 'white', border: 'none', fontWeight: 950, fontSize: '11px', cursor: 'pointer' }}
                              >LUNASKAN</button>
                            )}
                            <button onClick={() => setReceiptPreview(tx)} style={{ padding: '12px', borderRadius: 12, border: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer' }}><Receipt size={18}/></button>
                         </div>
                      </GlassCard>
                    ))}
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* PAKET LEBARAN MODAL */}
      <AnimatePresence>
         {showPaketModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: 700, background: 'white', borderRadius: 32, padding: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                     <h3 style={{ margin: 0, fontWeight: 950 }}>{showCreatePaket ? `Daftar Paket ${activePaketTab === 'LEBARAN' ? 'Lebaran' : 'Natal'} Baru` : `Manajemen Paket ${activePaketTab === 'LEBARAN' ? 'Lebaran (11x)' : 'Natal (8x)'}`}</h3>
                     <button onClick={() => { setShowPaketModal(false); setSelectedPaket(null); setShowCreatePaket(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                   </div>

                   {!selectedPaket && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, background: '#f8fafc', borderRadius: 16 }}>
                         {['LEBARAN', 'NATAL'].map(t => (
                            <button key={t} onClick={() => { setActivePaketTab(t as any); setShowCreatePaket(false); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: activePaketTab === t ? 'white' : 'transparent', color: activePaketTab === t ? '#a855f7' : '#94a3b8', fontWeight: 950, fontSize: '12px', cursor: 'pointer', boxShadow: activePaketTab === t ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>PAKET {t}</button>
                         ))}
                      </div>
                   )}

                  {showCreatePaket ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                           <div style={{ flex: 1 }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>PILIH PELANGGAN</label>
                                  <button onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)} style={{ background: 'none', border: 'none', color: '#a855f7', fontWeight: 950, fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                     {isAddingNewCustomer ? 'Cancel' : '+ PELANGGAN BARU'}
                                  </button>
                               </div>
                               
                               {isAddingNewCustomer ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                     <input autoFocus placeholder="Nama Pelanggan Baru..." value={newCustName} onChange={e => setNewCustName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, fontSize: '12px' }} />
                                     <div style={{ display: 'flex', gap: 8 }}>
                                        <input placeholder="No WA (Opsional)..." value={newCustWA} onChange={e => setNewCustWA(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, fontSize: '11px' }} />
                                        <button 
                                          onClick={async () => {
                                             if (!newCustName) return;
                                             const { data, error } = await supabase.from('customers').insert({ name: newCustName, wa_number: newCustWA }).select().single();
                                             if (data) {
                                                setCustomerDB([...customerDB, data]);
                                                setPaketCustomer(data);
                                                setIsAddingNewCustomer(false);
                                                setNewCustName("");
                                                setNewCustWA("");
                                                alert("Pelanggan baru berhasil disimpan!");
                                             } else {
                                                alert("Gagal simpan: " + (error?.message || "Error tidak diketahui"));
                                             }
                                          }}
                                          style={{ padding: '0 16px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 950, fontSize: '10px', cursor: 'pointer' }}
                                        >SIMPAN</button>
                                     </div>
                                  </div>
                               ) : (
                                  <select onChange={e => setPaketCustomer(customerDB.find(c => String(c.id) === e.target.value))} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                                     <option value="">- Cari Customer -</option>
                                     {customerDB.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                  </select>
                               )}
                            </div>
                           <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>PILIH PRODUK</label>
                              <select 
                                 value=""
                                 onChange={e => {
                                    if (!e.target.value) return;
                                    const p = products.find(pr => String(pr.id) === e.target.value);
                                    if (p) {
                                       const defaultVariant = p.variants?.[0];
                                       const newItem = {
                                          ...p,
                                          selectedVariantId: defaultVariant?.id,
                                          selectedVariantName: defaultVariant?.name,
                                          selectedPrice: defaultVariant?.price || p.price_per_unit || 0,
                                          qty: 1,
                                          cartId: `${p.id}-${defaultVariant?.id || 'default'}`
                                       };
                                       
                                       const exist = newPaketCart.find(it => it.cartId === newItem.cartId);
                                       if (exist) {
                                          setNewPaketCart(newPaketCart.map(it => it.cartId === newItem.cartId ? { ...it, qty: it.qty + 1 } : it));
                                       } else {
                                          setNewPaketCart([...newPaketCart, newItem]);
                                       }
                                    }
                                 }} 
                                 style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}
                              >
                                 <option value="">+ Tambah Produk Lagi...</option>
                                 {products.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                              </select>
                           </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, minHeight: 120 }}>
                           <p style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', marginBottom: 12 }}>ITEM PAKET:</p>
                           {newPaketCart.length === 0 && <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>Belum ada produk dipilih</p>}
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {newPaketCart.map((item, i) => (
                                 <div key={item.cartId || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                       <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>{item.name}</span>
                                       <select 
                                          value={item.selectedVariantId} 
                                          onChange={e => {
                                             const v = item.variants?.find((v: any) => v.id === e.target.value);
                                             if (v) {
                                                setNewPaketCart(newPaketCart.map((it, idx) => idx === i ? { 
                                                   ...it, 
                                                   selectedVariantId: v.id, 
                                                   selectedVariantName: v.name,
                                                   selectedPrice: v.price,
                                                   cartId: `${it.id}-${v.id}`
                                                } : it));
                                             }
                                          }}
                                          style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '11px', fontWeight: 700, color: '#64748b' }}
                                       >
                                          {item.variants?.map((v: any) => (
                                             <option key={v.id} value={v.id}>
                                                {v.name} (Rp {v.price.toLocaleString('id-ID')}) - Stok: {v.stock || 0}
                                             </option>
                                          ))}
                                       </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                       <div style={{ textAlign: 'right' }}>
                                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 950 }}>Rp {(item.selectedPrice * item.qty).toLocaleString('id-ID')}</p>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                                             <span style={{ fontSize: '10px', color: (item.variants?.find((v:any)=>v.id===item.selectedVariantId)?.stock || 0) <= 0 ? '#ef4444' : '#16a34a', fontWeight: 900 }}>
                                                {(item.variants?.find((v:any)=>v.id===item.selectedVariantId)?.stock || 0) <= 0 ? 'HABIS' : `Stok: ${item.variants?.find((v:any)=>v.id===item.selectedVariantId)?.stock || 0}`}
                                             </span>
                                             <span style={{ fontSize: '10px', color: '#94a3b8' }}>• {item.qty} x {item.selectedPrice.toLocaleString('id-ID')}</span>
                                          </div>
                                       </div>
                                       <input type="number" min="1" value={item.qty} onChange={e => setNewPaketCart(newPaketCart.map((it, idx) => idx === i ? { ...it, qty: Math.max(1, Number(e.target.value)) } : it))} style={{ width: 50, padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 800, fontSize: '13px' }} />
                                       <button onClick={() => setNewPaketCart(newPaketCart.filter((_, idx) => idx !== i))} style={{ background: '#fff1f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, borderRadius: 10 }}><Trash2 size={14}/></button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {newPaketCart.length > 0 && (
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                              <b style={{ fontSize: '14px' }}>ESTIMASI HARGA TOTAL:</b>
                              <b style={{ fontSize: '20px', color: '#2563eb' }}>Rp {(newPaketCart.reduce((a, b) => a + (b.selectedPrice || 0) * b.qty, 0)).toLocaleString('id-ID')}</b>
                           </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                           <button onClick={async () => {
                               if (!paketCustomer || newPaketCart.length === 0) { alert("Pilih customer & produk dulu!"); return; }
                               const totalPrice = newPaketCart.reduce((a, b) => a + (b.selectedPrice || 0) * b.qty, 0);
                               const packageId = `PK-${Date.now().toString().slice(-4)}`;
                               
                               const { error } = await supabase.from('holiday_packages').insert({
                                  id: packageId,
                                  customer_id: paketCustomer.id,
                                  products_summary: newPaketCart.map(i => `${i.name} (${i.selectedVariantName})`).join(', '),
                                  products_json: newPaketCart.map(i => ({ name: i.name, variant_name: i.selectedVariantName, qty: i.qty })),
                                  total_toples: newPaketCart.reduce((a, b) => a + b.qty, 0),
                                  total_price: totalPrice,
                                  type: activePaketTab
                               });

                               if (!error) {
                                  alert(`Paket ${activePaketTab} Berhasil Didaftarkan ke Database!`);
                                  setShowCreatePaket(false);
                                  setNewPaketCart([]);
                                  // Refresh data
                                  const { data: pkRef } = await supabase.from('holiday_packages').select('*, package_payments(*)').eq('id', packageId).single();
                                  if (pkRef) {
                                     const formatted = { ...pkRef, payments: pkRef.package_payments || [] };
                                     if (activePaketTab === 'LEBARAN') setPaketHistory([formatted, ...paketHistory]);
                                     else setPaketNatalHistory([formatted, ...paketNatalHistory]);
                                  }
                               } else {
                                  alert("Gagal daftar paket: " + error.message);
                               }
                            }} style={{ flex: 1, padding: 20, background: '#a855f7', color: 'white', border: 'none', borderRadius: 18, fontWeight: 950, fontSize: '15px', cursor: 'pointer' }}>DAFTARKAN PAKET</button>
                           <button onClick={() => setShowCreatePaket(false)} style={{ flex: 1, padding: 20, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 18, fontWeight: 950, fontSize: '15px', cursor: 'pointer' }}>BATAL</button>
                        </div>
                     </div>
                  ) : !selectedPaket ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>PILIH PAKET AKTIF ({activePaketTab}):</p>
                           <button onClick={() => setShowCreatePaket(true)} style={{ padding: '8px 16px', background: '#a855f7', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>+ BUAT PAKET BARU</button>
                        </div>
                        {(activePaketTab === 'LEBARAN' ? paketHistory : paketNatalHistory).map(p => (
                           <button key={p.id} onClick={() => setSelectedPaket(p)} style={{ width: '100%', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
                              <div>
                                 <strong style={{ fontSize: '15px', display: 'block' }}>{p.customer_name}</strong>
                                 <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.products} • {p.total_toples} Toples</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <span style={{ fontSize: '13px', fontWeight: 950, color: '#0f172a' }}>Rp {(p.total_price || 0).toLocaleString('id-ID')}</span>
                                 <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Sudah Bayar: Rp {(p.payments || []).reduce((a: any, b: any) => a + (Number(b.amount) || 0), 0).toLocaleString('id-ID')}</p>
                              </div>
                           </button>
                        ))}
                     </div>
                  ) : (
                     <div>
                        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 24 }}>
                           <p style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>PELANGGAN: {selectedPaket.customer_name}</p>
                           <h4 style={{ margin: 0 }}>Input Cicilan Ke Berapa? ({activePaketTab})</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
                           {[...Array(activePaketTab === 'LEBARAN' ? 11 : 8)].map((_, i) => {
                              const isPaid = selectedPaket.payments[i] !== undefined;
                              return (
                                 <button 
                                    key={i} 
                                    onClick={() => {
                                       if (isPaid) return;
                                       setPayingCicilan({ index: i, amount: selectedPaket.total_price / (activePaketTab === 'LEBARAN' ? 11 : 8) });
                                    }}
                                    style={{ 
                                       padding: '16px 10px', 
                                       borderRadius: '14px', 
                                       border: '1px solid #f1f5f9', 
                                       background: isPaid ? '#10b981' : '#f8fafc', 
                                       color: isPaid ? 'white' : '#64748b',
                                       fontWeight: 950,
                                       fontSize: '11px',
                                       cursor: isPaid ? 'default' : 'pointer'
                                    }}
                                 >
                                    {isPaid ? <Check size={16}/> : `BAYAR ${i+1}`}
                                 </button>
                              );
                           })}
                        </div>

                        {payingCicilan && (
                           <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                              <div style={{ width: '100%', maxWidth: 320 }}>
                                 <h4 style={{ margin: '0 0 20px', textAlign: 'center' }}>Detail Pembayaran ke-{payingCicilan.index + 1}</h4>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                       {['CASH', 'QRIS', 'TRANSFER'].map(m => (
                                          <button key={m} onClick={() => setCicilanMethod(m as any)} style={{ flex: 1, padding: '12px 8px', borderRadius: 10, border: '1px solid #f1f5f9', background: cicilanMethod === m ? '#0f172a' : '#f8fafc', color: cicilanMethod === m ? 'white' : '#64748b', fontSize: '10px', fontWeight: 950 }}>{m}</button>
                                       ))}
                                    </div>
                                    {cicilanMethod === 'TRANSFER' && (
                                       <div onClick={() => cicilanPhotoRef.current?.click()} style={{ padding: 16, borderRadius: 12, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                          <Camera size={20} color="#94a3b8" />
                                          <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: 4 }}>{cicilanPhoto ? cicilanPhoto.name : 'Bukti Transfer'}</span>
                                       </div>
                                    )}
                                    <input type="file" ref={cicilanPhotoRef} hidden accept="image/*" onChange={e => setCicilanPhoto(e.target.files?.[0] || null)} />
                                 </div>
                                 <div style={{ display: 'flex', gap: 12 }}>
                                    <button 
                                      disabled={isUploadingCicilan}
                                      onClick={async () => {
                                         if ((cicilanMethod === 'TRANSFER' || cicilanMethod === 'QRIS') && !cicilanPhoto) {
                                            return alert("Mohon ambil/upload foto bukti bayar!");
                                         }
                                         
                                         setIsUploadingCicilan(true);
                                         let proofUrl = "";
                                         try {
                                            if (cicilanPhoto) {
                                               proofUrl = await uploadToCloudinary(cicilanPhoto) || "";
                                            }

                                            const amount = payingCicilan.amount;
                                            
                                            // 1. Save to database
                                            const { error: payErr } = await supabase.from('package_payments').insert({
                                               package_id: selectedPaket.id,
                                               installment_index: payingCicilan.index,
                                               amount: amount,
                                               payment_method: cicilanMethod,
                                               proof_url: proofUrl,
                                               date: new Date().toISOString().split('T')[0]
                                            });

                                            if (payErr) throw payErr;

                                            // 2. Refresh local state for this package
                                            const { data: pkRefresh } = await supabase.from('holiday_packages').select('*, package_payments(*)').eq('id', selectedPaket.id).single();
                                            if (pkRefresh) {
                                               const updated = { ...pkRefresh, payments: pkRefresh.package_payments || [] };
                                               if (activePaketTab === 'LEBARAN') setPaketHistory(paketHistory.map(ph => ph.id === selectedPaket.id ? updated : ph));
                                               else setPaketNatalHistory(paketNatalHistory.map(ph => ph.id === selectedPaket.id ? updated : ph));
                                               setSelectedPaket(updated);
                                            }
                                            
                                            if (cicilanMethod === 'CASH') updateDrawerState(totalCashInDrawer + amount);
                                            
                                            setPayingCicilan(null);
                                            setCicilanPhoto(null);
                                            alert("Cicilan Berhasil Dibayar & Masuk Database!");
                                         } catch (err: any) {
                                            alert("Gagal bayar cicilan: " + err.message);
                                         } finally {
                                            setIsUploadingCicilan(false);
                                         }
                                      }} 
                                      style={{ flex: 2, padding: 16, background: '#10b981', color: 'white', borderRadius: 14, border: 'none', fontWeight: 950, fontSize: '12px' }}>
                                         {isUploadingCicilan ? 'UPLOAD...' : 'KONFIRMASI'}
                                    </button>
                                    <button onClick={() => setPayingCicilan(null)} style={{ flex: 1, padding: 16, background: '#f1f5f9', color: '#64748b', borderRadius: 14, border: 'none', fontWeight: 950, fontSize: '12px' }}>BATAL</button>
                                 </div>
                              </div>
                           </div>
                        )}

                        <div style={{ marginTop: 24, padding: 24, background: '#fff7ed', borderRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                              <p style={{ margin: 0, fontSize: '11px', fontWeight: 950, color: '#ea580c' }}>STATUS PENGIRIMAN</p>
                              <h4 style={{ margin: '4px 0 0', fontWeight: 950 }}>{selectedPaket.is_shipped ? '✓ SUDAH DIKIRIM' : 'BELUM DIKIRIM'}</h4>
                           </div>
                           {!selectedPaket.is_shipped && (
                              <button 
                                onClick={async () => {
                                   const totalPaid = selectedPaket.payments.reduce((a:number, b:number) => a + b, 0);
                                   if (totalPaid < selectedPaket.total_price * 0.95) { 
                                      if (!confirm("Belum lunas sepenuhnya. Tetap lunas + kirim? Stok akan berkurang!")) return;
                                   } else {
                                      if (!confirm("Konfirmasi pengiriman? Stok produk akan otomatis berkurang!")) return;
                                   }
                                   
                                   try {
                                      const prods = JSON.parse(selectedPaket.products_json || "[]");
                                      for (const p of prods) {
                                         const { data: v } = await supabase.from('product_variants').select('stock').eq('id', p.variant_id).single();
                                         if (v) {
                                            await supabase.from('product_variants').update({ stock: Math.max(0, (v.stock || 0) - p.qty) }).eq('id', p.variant_id);
                                         }
                                      }
                                      
                                      const updated = { ...selectedPaket, is_shipped: true };
                                      updatePaketState(paketHistory.map(ph => ph.id === selectedPaket.id ? updated : ph));
                                      setSelectedPaket(updated);
                                      alert("Pengiriman Berhasil! Stok Produk Sudah Dikurangi.");
                                   } catch (e: any) {
                                      alert("Error Kirim: " + e.message);
                                   }
                                }}
                                style={{ padding: '16px 24px', background: '#ea580c', color: 'white', borderRadius: 14, border: 'none', fontWeight: 950, fontSize: '12px', cursor: 'pointer' }}
                              >LUNAS + KIRIM BARANG</button>
                           )}
                        </div>

                        <div style={{ marginTop: 12 }}>
                           <button onClick={() => setSelectedPaket(null)} style={{ width: '100%', padding: '18px', background: '#f1f5f9', border: 'none', borderRadius: '16px', fontWeight: 950, color: '#64748b', cursor: 'pointer' }}>KEMBALI</button>
                        </div>
                     </div>
                  )}
               </motion.div>
            </div>
         )}
      </AnimatePresence>

       <AnimatePresence>
         {/* RETURN MODAL */}
         {showReturnModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: 440, background: 'white', borderRadius: 32, padding: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                     <h3 style={{ margin: 0, fontWeight: 950 }}>Return Produk</h3>
                     <button onClick={() => setShowReturnModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X/></button>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 24 }}>
                     <p style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', margin: 0 }}>TX: {showReturnModal.id}</p>
                     <p style={{ margin: '4px 0 0', fontWeight: 900 }}>{showReturnModal.customer_name}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>ALASAN RETURN</label>
                        <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                           <option>Produk Rusak / Berjamur</option>
                           <option>Salah Input / Varian</option>
                           <option>Expired / Kadaluarsa</option>
                           <option>Lainnya</option>
                        </select>
                     </div>
                     <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setReturnToStock(true)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: returnToStock ? '#10b981' : '#f8fafc', color: returnToStock ? 'white' : '#64748b', fontWeight: 950, fontSize: '11px', cursor: 'pointer' }}>KEMBALI KE STOK</button>
                        <button onClick={() => setReturnToStock(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: !returnToStock ? '#ef4444' : '#f8fafc', color: !returnToStock ? 'white' : '#64748b', fontWeight: 950, fontSize: '11px', cursor: 'pointer' }}>HAPUS DARI STOK</button>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                         <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>REFUND UANG KEMBALI</label>
                         <b style={{ fontSize: '24px', color: '#ef4444' }}>Rp {(showReturnModal?.total || 0).toLocaleString('id-ID')}</b>
                     </div>
                     <button onClick={() => {
                        updateDrawerState(totalCashInDrawer - (showReturnModal?.total || 0));
                        setTxHistory(txHistory.filter(t => t.id !== showReturnModal.id));
                        setShowReturnModal(null);
                        alert("Return Berhasil! Saldo dikembalikan ke pelanggan.");
                     }} style={{ padding: '20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>KONFIRMASI RETURN</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
