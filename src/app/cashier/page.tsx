"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, Search, Trash2, CreditCard, QrCode, ArrowRight,
  Plus, Minus, ChefHat, ChevronLeft, Receipt, Camera, X, Check,
  Package, Wallet, History, Clock, ChevronRight, Tag, TrendingDown,
  Phone, Calendar as CalendarIcon, Filter, AlertCircle, Eye, EyeOff
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/DashboardCard";
import { InventoryItem, Expense } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { mockFinishedProducts, mockEmployees } from "@/lib/mockData";

export default function CashierPortal() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { 
    setIsMounted(true); 
  }, []);

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

        // Packages
        const { data: pk } = await supabase.from('packages').select('*, installments(*)');
        if (pk) setPaketHistory(pk.map(p => ({ ...p, payments: p.installments?.map((i: any) => i.amount) || [] })));

        // Expenses
        const { data: ex } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (ex) setExpenseHistory(ex);

        // Customers
        const { data: cust } = await supabase.from('customers').select('*');
        if (cust) setCustomerDB(cust);

        // Cash Drawer (from special inventory item or settings table - using inventory as per schema)
        const { data: dw } = await supabase.from('inventory').select('stock_quantity').eq('product_id', 'CASH_DRAWER').single();
        if (dw) setTotalCashInDrawer(dw.stock_quantity);
     };
     fetchInitial();
     const interval = setInterval(fetchInitial, 5000);
     return () => clearInterval(interval);
  }, []);

  const historyStats = useMemo(() => {
    return txHistory.reduce((acc, tx) => {
      acc.total += tx.total;
      const m = tx.method ? tx.method.toUpperCase() : '';
      if (m === 'CASH' || m === 'TUNAI') acc.cash += tx.total;
      else if (m === 'QRIS') acc.qris += tx.total;
      else if (m === 'TRANSFER') acc.transfer += tx.total;
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
  const [expenseHistory, setExpenseHistory] = useState<any[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);

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
    localStorage.setItem('ELA_PAKET_HISTORY', JSON.stringify(newHistory));
  };
  const paketTotal = useMemo(() => {
    return paketHistory.reduce((acc, p) => acc + p.payments.reduce((a: number, b: number) => a + b, 0), 0);
  }, [paketHistory]);
  const totalRevenueToday = historyStats.total + paketTotal;

  const [productionQty, setProductionQty] = useState("");
  const [kasbonAmount, setKasbonAmount] = useState("");
  const [selectedKasbonEmployee, setSelectedKasbonEmployee] = useState("");
  const [showVariantModal, setShowVariantModal] = useState<any | null>(null);
  const [showPriceSelector, setShowPriceSelector] = useState<any | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [addonPrice, setAddonPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'TRANSFER' | 'CASH'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<'BCA' | 'MANDIRI' | 'BRI' | 'BNI'>('BCA');
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseSource, setExpenseSource] = useState<string>("Tunai Kasir");
  const [paymentType, setPaymentType] = useState<'LUNAS' | 'HUTANG'>('LUNAS');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProductionProduct, setSelectedProductionProduct] = useState<string>("");
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('operasional');
  const [expenseTarget, setExpenseTarget] = useState("");

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredHistory = txHistory.filter(tx => activeHistoryFilter === 'ALL' || tx.status === 'HUTANG');

  const addToCart = (product: any, variant: any, priceType: string) => {
    let p = variant.price;
    let label = "Utama";
    if (priceType === 'grosir') { p = variant.wholesale_price || variant.price * 0.9; label = "Grosir"; }
    else if (priceType === 'lainya') { p = variant.other_price || variant.price; label = "Lainnya"; }
    const cid = `${product.id}-${variant.id}-${priceType}`;
    const exist = cart.find(i => i.cartId === cid);
    if (exist) setCart(cart.map(i => i.cartId === cid ? { ...i, qty: i.qty + 1 } : i));
    else setCart([...cart, { ...product, cartId: cid, name: `${product.name} (${variant.name})`, typeName: label, qty: 1, price_per_unit: p, variantId: variant.id, priceType }]);
    setShowPriceSelector(null); setShowVariantModal(null);
  };

  const removeFromCart = (cid: string) => setCart(cart.filter(i => i.cartId !== cid));
  const updateQty = (cid: string, d: number) => setCart(cart.map(i => i.cartId === cid ? { ...i, qty: Math.max(1, i.qty + d) } : i));

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

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', color: '#011627', overflow: 'hidden' }}>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 40px', overflowY: 'auto', background: '#ffffff' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <Link href="/" style={{ padding: '12px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#64748b' }}><ChevronLeft size={24} /></Link>
             <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>RUMAH KUE GROSIR HULONDELA</h1>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', margin: 0 }}>RUMAH KUE GORONTALO • V.5</p>
             </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <button onClick={() => setShowSetorModal(true)} style={{ padding: '12px 20px', borderRadius: '14px', background: '#f0fdf4', color: '#16a34a', fontWeight: 950, border: 'none', cursor: 'pointer' }}>SETOR</button>
             <button onClick={() => setShowProductionModal(true)} style={{ padding: '12px 20px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', fontWeight: 950, border: 'none', cursor: 'pointer' }}>STOK KUE</button>
             <button onClick={() => setShowKasbonModal(true)} style={{ padding: '12px 20px', borderRadius: '14px', background: '#fff7ed', color: '#ea580c', fontWeight: 950, border: 'none', cursor: 'pointer' }}>KASBON</button>
             <button onClick={() => setShowExpenseModal(true)} style={{ padding: '12px 20px', borderRadius: '14px', background: '#fef2f2', color: '#ef4444', fontWeight: 950, border: 'none', cursor: 'pointer' }}>PENGELUARAN</button>
             <button onClick={() => setShowPaketModal(true)} style={{ padding: '12px 20px', borderRadius: '14px', background: '#faf5ff', color: '#a855f7', fontWeight: 950, border: 'none', cursor: 'pointer' }}>PAKET LEBARAN</button>
             <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Search product..." value={searchTerm || ''} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }} />
             </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.2fr', gap: 24, marginBottom: 40, padding: '28px 32px', background: '#f8fafc', borderRadius: '32px', border: '1px solid #f1f5f9', alignItems: 'center' }}>
           <div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>PENDAPATAN HARINI</span>
              <h2 style={{ fontSize: '26px', fontWeight: 950, margin: 0 }}>
                {showRevenue ? `Rp ${(totalRevenueToday || 0).toLocaleString('id-ID')}` : "Rp ••••••"}
              </h2>
           </div>
           <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#16a34a', fontSize: '10px', fontWeight: 900 }}>TUNAI</span><br/>
              <b style={{ fontSize: '18px', fontWeight: 950 }}>{showRevenue ? `Rp ${(totalCashInDrawer || 0).toLocaleString('id-ID')}` : "Rp ••••••"}</b>
           </div>
           <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#2563eb', fontSize: '10px', fontWeight: 900 }}>QRIS</span><br/>
              <b style={{ fontSize: '18px', fontWeight: 950 }}>{showRevenue ? `Rp ${(historyStats?.qris || 0).toLocaleString('id-ID')}` : "Rp ••••••"}</b>
           </div>
           <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#ec4899', fontSize: '10px', fontWeight: 900 }}>TRANSFER</span><br/>
              <b style={{ fontSize: '18px', fontWeight: 950 }}>{showRevenue ? `Rp ${(historyStats?.transfer || 0).toLocaleString('id-ID')}` : "Rp ••••••"}</b>
           </div>
           <button onClick={() => setShowRevenue(!showRevenue)} style={{ background: '#ffffff', border: '1px solid #e1e8f0', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              {showRevenue ? <EyeOff size={20} /> : <Eye size={20} />}
           </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 28, marginBottom: 60 }}>
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p, idx) => (
              <motion.div 
                whileHover={{ y: -8 }} 
                whileTap={{ scale: 0.98 }} 
                key={p.id || `p-${idx}`} 
                onClick={() => setShowVariantModal(p)} 
                style={{ background: '#ffffff', borderRadius: '30px', border: '1px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 15px 45px rgba(0,0,0,0.03)' }}
              >
                 <div style={{ height: 180, background: '#f8fafc', position: 'relative' }}>
                    {p.image_url ? <Image src={p.image_url} alt={p.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}><ChefHat size={54} /></div>}
                 </div>
                 <div style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 900 }}>{p.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '17px', fontWeight: 950, color: '#2563eb' }}>Rp {(p.price_per_unit || 0).toLocaleString('id-ID')}</span>
                       <div style={{ background: '#0f172a', padding: 6, borderRadius: 10, color: 'white' }}><Plus size={16}/></div>
                    </div>
                 </div>
              </motion.div>
            ))}
        </div>

        <div style={{ marginTop: 40, paddingTop: 40, borderTop: '2px dashed #f1f5f9' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                 <h2 style={{ fontSize: '20px', fontWeight: 950, margin: 0 }}>Riwayat Transaksi</h2>
                 <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 14 }}>
                    <button onClick={() => setActiveHistoryFilter('ALL')} style={{ padding: '8px 24px', borderRadius: 10, border: 'none', background: activeHistoryFilter === 'ALL' ? '#ffffff' : 'transparent', fontWeight: 900, cursor: 'pointer' }}>SEMUA</button>
                    <button onClick={() => setActiveHistoryFilter('HUTANG')} style={{ padding: '8px 24px', borderRadius: 10, border: 'none', background: activeHistoryFilter === 'HUTANG' ? '#ef4444' : 'transparent', color: activeHistoryFilter === 'HUTANG' ? '#fff' : '#000', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={15}/> HUTANG</button>
                 </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8' }}>TOTAL: {filteredHistory.length} TX</span>
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
                     <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0' }}>Produk:</p>
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
        </div>
      </div>

      <div style={{ width: 440, background: '#ffffff', borderLeft: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', padding: '32px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 950, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}><ShoppingCart size={22}/> Keranjang Belanja</h2>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
          {cart.length === 0 ? <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}><Receipt size={64}/><p>Keranjang Kosong</p></div> : 
             cart.map(i => (
               <div key={i.cartId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '12px', fontWeight: 950, margin: '0 0 4px 0' }}>{i.name}</p>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '9px', background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: 6, fontWeight: 950 }}>{i.typeName}</span>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#2563eb' }}>@Rp {(i.price_per_unit || 0).toLocaleString('id-ID')}</span>
                     </div>
                     <div style={{ marginTop: 8, fontSize: '14px', fontWeight: 950, color: '#0f172a' }}>
                        Rp {((i.price_per_unit || 0) * i.qty).toLocaleString('id-ID')}
                     </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                     <Minus size={14} style={{ cursor: 'pointer', background: '#fff', borderRadius: 6, padding: 2 }} onClick={() => updateQty(i.cartId, -1)} />
                     <b style={{ fontSize: '15px', minWidth: 20, textAlign: 'center' }}>{i.qty}</b>
                     <Plus size={14} style={{ cursor: 'pointer', background: '#fff', borderRadius: 6, padding: 2 }} onClick={() => updateQty(i.cartId, 1)} />
                     <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer', marginLeft: 8 }} onClick={() => removeFromCart(i.cartId)} />
                  </div>
               </div>
             ))
          }
        </div>

        <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
           <div style={{ position: 'relative' }}>
             <input 
               type="text" 
               placeholder="Nama Pelanggan..." 
               value={customerName || ''} 
               onChange={e => {
                 setCustomerName(e.target.value);
                 setShowCustomerDropdown(true);
               }} 
               onFocus={() => setShowCustomerDropdown(true)}
               style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800 }} 
             />
             {showCustomerDropdown && customerName && (
               <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'white', borderRadius: 16, boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', marginBottom: 8, zIndex: 50, maxHeight: 200, overflowY: 'auto', border: '1px solid #f1f5f9' }}>
                 {customerDB.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).map(c => (
                   <div key={c.id} onClick={() => { setCustomerName(c.name); setCustomerWA(c.wa || ""); setShowCustomerDropdown(false); }} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}>
                     <span style={{ fontWeight: 800, fontSize: '13px' }}>{c.name}</span>
                     <span style={{ fontSize: '10px', color: '#94a3b8' }}>{c.wa}</span>
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
                          alert("Gagal simpan pelanggan: " + error.message);
                        } else {
                          setCustomerDB([data, ...customerDB]); 
                          setShowCustomerDropdown(false); 
                          alert("Pelanggan Berhasil Disimpan!"); 
                        }
                      }} 
                      style={{ padding: '12px 16px', background: '#eff6ff', color: '#2563eb', fontWeight: 950, fontSize: '12px', cursor: 'pointer', textAlign: 'center' }}
                    >
                      + SIMPAN PELANGGAN
                    </div>
                  )}
               </div>
             )}
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input type="text" placeholder="WhatsApp..." value={customerWA || ''} onChange={e => setCustomerWA(e.target.value)} style={{ padding: 14, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
              <input type="date" value={transactionDate || ''} onChange={e => setTransactionDate(e.target.value)} style={{ padding: 14, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px' }} />
           </div>

           <input type="text" placeholder="Tambahan (Addon) Rp" value={formatCurrency(String(addonPrice || ""))} onChange={e => setAddonPrice(Number(parseCurrency(e.target.value)))} style={{ padding: 14, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 950, fontSize: '15px' }} />
           
           <div style={{ background: '#0f172a', padding: '24px', borderRadius: '24px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.6, marginBottom: 6 }}><span>Total + Pajak (11%)</span><span>Rp {(totalSales + taxAmount).toLocaleString('id-ID')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 800 }}>GRAND TOTAL</span><span style={{ fontSize: '24px', fontWeight: 950 }}>Rp {grandFinal.toLocaleString('id-ID')}</span></div>
           </div>

           <button disabled={cart.length === 0 || !customerName} onClick={() => setShowPaymentModal(true)} style={{ width: '100%', padding: '20px', borderRadius: '20px', background: '#2563eb', color: 'white', border: 'none', fontWeight: 950, fontSize: '16px', cursor: 'pointer', opacity: (cart.length === 0 || !customerName) ? 0.5 : 1 }}>PROSES PEMBAYARAN</button>
        </div>
      </div>

      <AnimatePresence>
         {showVariantModal && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: 420, background: 'white', borderRadius: '32px', padding: 40 }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 950 }}>Pilih Varian</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {showVariantModal.variants.map((v: any) => (
                     <button key={v.id} onClick={() => setShowPriceSelector({ product: showVariantModal, variant: v })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '18px', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: 900, cursor: 'pointer' }}>{v.name} <ChevronRight size={18}/></button>
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

                            // 3. Local State Update
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
                        <select value={selectedProductionProduct} onChange={e => setSelectedProductionProduct(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                           <option value="">Pilih Produk...</option>
                           {mockFinishedProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>JUMLAH (PICIS/MIKA)</label>
                        <input type="number" value={productionQty} onChange={e => setProductionQty(e.target.value)} placeholder="0" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '18px' }} />
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                     <button onClick={() => { setShowProductionModal(false); setProductionQty(""); alert("Stok berhasil ditambahkan!"); }} style={{ flex: 1, padding: 18, background: '#2563eb', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>SIMPAN STOK</button>
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
                           {mockEmployees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>NOMINAL KASBON (RP)</label>
                        <input type="text" value={formatCurrency(kasbonAmount)} onChange={e => setKasbonAmount(parseCurrency(e.target.value))} placeholder="Rp 0" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '18px' }} />
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                     <button onClick={() => { setShowKasbonModal(false); setKasbonAmount(""); alert("Kasbon dicatat!"); }} style={{ flex: 1, padding: 18, background: '#ea580c', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>CATAT KASBON</button>
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
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>KETERANGAN / NOTA</label>
                        <input type="text" value={expenseNote} onChange={e => setExpenseNote(e.target.value)} placeholder="Contoh: Beli Token Listrik, Parkir, dll" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }} />
                     </div>
                     <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>NOMINAL (RP)</label>
                        <input type="text" value={formatCurrency(expenseAmount)} onChange={e => setExpenseAmount(parseCurrency(e.target.value))} placeholder="Rp 0" style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: '18px' }} />
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                     <button onClick={() => { 
                        if (expenseSource === 'Tunai Kasir') {
                           updateDrawerState(totalCashInDrawer - Number(expenseAmount));
                        }
                        setShowExpenseModal(false); 
                        setExpenseAmount(""); 
                        setExpenseNote(""); 
                        const newExp = {
                            id: `EXP-${Date.now().toString().slice(-4)}`,
                            category: expenseCategory,
                            target: expenseTarget,
                            amount: Number(expenseAmount),
                            source: expenseSource,
                            date: new Date().toISOString().split('T')[0]
                         };
                         updateExpenseHistory([newExp, ...expenseHistory]);
                         alert("Pengeluaran berhasil dicatat!");
 
                     }} style={{ flex: 1, padding: 18, background: '#ef4444', color: 'white', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>SIMPAN BIAYA</button>
                     <button onClick={() => setShowExpenseModal(false)} style={{ padding: 18, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 16, fontWeight: 950, cursor: 'pointer' }}>BATAL</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {/* PAKET LEBARAN MODAL */}
         {showPaketModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: 700, background: 'white', borderRadius: 32, padding: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                     <h3 style={{ margin: 0, fontWeight: 950 }}>{showCreatePaket ? 'Daftar Paket Lebaran Baru' : 'Manajemen Paket Lebaran (11x Bayar)'}</h3>
                     <button onClick={() => { setShowPaketModal(false); setSelectedPaket(null); setShowCreatePaket(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                  </div>

                  {showCreatePaket ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                           <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>PILIH PELANGGAN</label>
                              <select onChange={e => setPaketCustomer(customerDB.find(c => String(c.id) === e.target.value))} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                                 <option value="">- Cari Customer -</option>
                                 {customerDB.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                              </select>
                           </div>
                           <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: 8 }}>PILIH PRODUK</label>
                              <select 
                                onChange={e => {
                                   const p = products.find(pr => String(pr.id) === e.target.value);
                                   if (p) setNewPaketCart([...newPaketCart, { ...p, qty: 1 }]);
                                }} 
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}
                              >
                                 <option value="">+ Tambah Produk</option>
                                 {products.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                              </select>
                           </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, minHeight: 120 }}>
                           <p style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', marginBottom: 12 }}>ITEM PAKET:</p>
                           {newPaketCart.length === 0 && <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>Belum ada produk dipilih</p>}
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {newPaketCart.map((item, i) => (
                                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{item.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                       <input type="number" value={item.qty} onChange={e => setNewPaketCart(newPaketCart.map((it, idx) => idx === i ? { ...it, qty: Number(e.target.value) } : it))} style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }} />
                                       <button onClick={() => setNewPaketCart(newPaketCart.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {newPaketCart.length > 0 && (
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                              <b style={{ fontSize: '14px' }}>ESTIMASI HARGA TOTAL:</b>
                              <b style={{ fontSize: '20px', color: '#2563eb' }}>Rp {(newPaketCart.reduce((a, b) => a + (b.variants?.[0]?.price || 100000) * b.qty, 0)).toLocaleString('id-ID')}</b>
                           </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                           <button onClick={() => {
                              if (!paketCustomer || newPaketCart.length === 0) { alert("Pilih customer & produk dulu!"); return; }
                              const totalPrice = newPaketCart.reduce((a, b) => a + (b.variants?.[0]?.price || 100000) * b.qty, 0);
                              const newEntry = {
                                 id: `PK-${Date.now().toString().slice(-4)}`,
                                 customer_name: paketCustomer.name,
                                 products: newPaketCart.map(i => i.name).join(', '),
                                 total_toples: newPaketCart.reduce((a, b) => a + b.qty, 0),
                                 total_price: totalPrice,
                                 payments: Array(11).fill(0)
                              };
                              updatePaketState([newEntry, ...paketHistory]);
                              setShowCreatePaket(false);
                              setNewPaketCart([]);
                              alert("Paket Baru Berhasil Didaftarkan!");
                           }} style={{ flex: 1, padding: 20, background: '#a855f7', color: 'white', border: 'none', borderRadius: 18, fontWeight: 950, fontSize: '15px', cursor: 'pointer' }}>DAFTARKAN PAKET</button>
                           <button onClick={() => setShowCreatePaket(false)} style={{ flex: 1, padding: 20, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 18, fontWeight: 950, fontSize: '15px', cursor: 'pointer' }}>BATAL</button>
                        </div>
                     </div>
                  ) : !selectedPaket ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>PILIH PAKET AKTIF:</p>
                           <button onClick={() => setShowCreatePaket(true)} style={{ padding: '8px 16px', background: '#a855f7', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>+ BUAT PAKET BARU</button>
                        </div>
                        {paketHistory.map(p => (
                           <button key={p.id} onClick={() => setSelectedPaket(p)} style={{ width: '100%', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
                              <div>
                                 <strong style={{ fontSize: '15px', display: 'block' }}>{p.customer_name}</strong>
                                 <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.products} • {p.total_toples} Toples</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <span style={{ fontSize: '13px', fontWeight: 950, color: '#0f172a' }}>Rp {(p.total_price || 0).toLocaleString('id-ID')}</span>
                                 <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Sudah Bayar: Rp {(p.payments || []).reduce((a: any, b: any) => a + (Number(b) || 0), 0).toLocaleString('id-ID')}</p>
                              </div>
                           </button>
                        ))}
                     </div>
                  ) : (
                     <div>
                        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 24 }}>
                           <p style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>PELANGGAN: {selectedPaket.customer_name}</p>
                           <h4 style={{ margin: 0 }}>Input Cicilan Ke Berapa?</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
                           {[...Array(11)].map((_, i) => {
                              const isPaid = selectedPaket.payments[i] > 0;
                              return (
                                 <button 
                                    key={i} 
                                    onClick={() => {
                                       if (isPaid) return;
                                       const amount = selectedPaket.total_price / 11;
                                       const newPayments = [...selectedPaket.payments];
                                       newPayments[i] = amount;
                                       const updated = { ...selectedPaket, payments: newPayments };
                                       updatePaketState(paketHistory.map(ph => ph.id === selectedPaket.id ? updated : ph));
                                       setSelectedPaket(updated);
                                       updateDrawerState(totalCashInDrawer + amount);
                                       alert(`Pembayaran ke-${i+1} berhasil dikonfirmasi!`);
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
                                    BAYAR {i + 1}
                                 </button>
                              );
                           })}
                        </div>
                        <button onClick={() => setSelectedPaket(null)} style={{ width: '100%', padding: '18px', background: '#f1f5f9', border: 'none', borderRadius: '16px', fontWeight: 950, color: '#64748b', cursor: 'pointer' }}>KEMBALI</button>
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
