"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Filter, MoreVertical, 
  Box, TrendingUp, AlertTriangle, Zap,
  X, History, Trash2, Edit3, ShoppingBag,
  Barcode, Image as ImageIcon, CheckCircle2,
  DollarSign, Star, PackageCheck
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { mockFinishedProducts } from "@/lib/mockData";
import { useState, useMemo, useEffect, useRef } from "react";
import { InventoryItem, ProductVariant } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default function ProductsPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*)');
    if (data) {
      const formatted = data.map((p: any) => ({
        ...p,
        variants: p.product_variants || []
      }));
      setProducts(formatted);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const saveProducts = async (newProducts: InventoryItem[]) => {
    // This will be handled by individual add/update/delete calls now
    await fetchProducts();
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<InventoryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    stock: 0,
    unit: "pcs" as any,
    image_url: "",
    variants: [
      { id: "v1", name: "Mika", price: 0, wholesale_price: 0, other_price: 0 },
      { id: "v2", name: "Toples Sedang", price: 0, wholesale_price: 0, other_price: 0 },
      { id: "v3", name: "Toples Besar", price: 0, wholesale_price: 0, other_price: 0 },
    ]
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const totalAssetValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.price_per_unit), 0);
  }, [products]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentProduct(null);
    setFormData({
      name: "",
      barcode: "",
      stock: 0,
      unit: "pcs",
      image_url: "",
      variants: [
        { id: "v1", name: "Mika", price: 0, wholesale_price: 0, other_price: 0 },
        { id: "v2", name: "Toples Sedang", price: 0, wholesale_price: 0, other_price: 0 },
        { id: "v3", name: "Toples Besar", price: 0, wholesale_price: 0, other_price: 0 },
      ]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product: InventoryItem) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      barcode: `BRC-00-${product.id.split('-')[1] || '92'}`,
      stock: product.stock,
      unit: product.unit,
      image_url: product.image_url || "",
      variants: (product.variants || []).map(v => ({
        id: v.id,
        name: v.name,
        price: v.price || 0,
        wholesale_price: v.wholesale_price || 0,
        other_price: v.other_price || 0
      })) || [
        { id: "v1", name: "Mika", price: 0, wholesale_price: 0, other_price: 0 },
        { id: "v2", name: "Toples Sedang", price: 0, wholesale_price: 0, other_price: 0 },
        { id: "v3", name: "Toples Besar", price: 0, wholesale_price: 0, other_price: 0 },
      ]
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", file);
    cloudinaryForm.append("upload_preset", "ellacakes"); 
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dmjpjmece/image/upload`,
        { method: "POST", body: cloudinaryForm }
      );
      const data = await response.json();
      if (data.secure_url) {
        setFormData({ ...formData, image_url: data.secure_url });
        alert("Gambar berhasil di-upload!");
      } else {
        console.error("Cloudinary Error:", data);
        alert("Gagal upload gambar: " + (data.error?.message || "Cek preset ellacakes Anda"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal koneksi ke Cloudinary.");
    } finally {
      setUploading(false);
    }
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentProduct) {
        // Update Product
        const { error: pError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            image_url: formData.image_url,
            category: 'finished'
          })
          .eq('id', currentProduct.id);

        if (pError) throw pError;

        // Update Variants
        for (const v of formData.variants) {
           // If variant has no UUID-like ID, it's a new variant
           const isNewVariant = v.id.startsWith('v');
           const variantData = {
              product_id: currentProduct.id,
              name: v.name,
              price: v.price,
              wholesale_price: v.wholesale_price,
              other_price: v.other_price,
              stock: v.name === "Mika" ? formData.stock : 0 // Assign initial stock to one variant for simplicity or handle per variant
           };

           if (isNewVariant) {
              const { error: vError } = await supabase.from('product_variants').insert(variantData);
              if (vError) throw vError;
           } else {
              const { error: vError } = await supabase.from('product_variants').update(variantData).eq('id', v.id);
              if (vError) throw vError;
           }
        }
      } else {
        // Create Product (Let Supabase generate ID)
        const { data: pData, error: pError } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            category: 'finished',
            image_url: formData.image_url
          })
          .select()
          .single();

        if (pError) throw pError;
        const newProductId = pData.id;

        // Insert Variants
        const variantInserts = formData.variants.map(v => ({
           product_id: newProductId,
           name: v.name,
           price: v.price,
           wholesale_price: v.wholesale_price,
           other_price: v.other_price,
           stock: v.name === "Mika" ? formData.stock : 0 
        }));
        const { error: vError } = await supabase.from('product_variants').insert(variantInserts);
        if (vError) throw vError;
      }
      
      alert(`Sukses! Produk ${formData.name} berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.`);
      await fetchProducts();
      setShowModal(false);
    } catch (error: any) {
      console.error("Save error details:", error);
      alert("Gagal menyimpan produk: " + (error.message || JSON.stringify(error)));
    }
  };

  const updateVariant = (index: number, field: string, value: number) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Katalog Produk Jadi</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Kelola daftar produk, harga bertingkat, dan stok siap jual.</p>
        </div>
        <button onClick={handleOpenAdd} className="primary-button" style={{ borderRadius: 16, height: 56, padding: '0 32px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <Plus size={20} /> Input Produk Baru
        </button>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
         <GlassCard delay={0.1} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Total SKU Aktif</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{products.length} Produk</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.2} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Estimasi Nilai Jual</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {totalAssetValue.toLocaleString('id-ID')}</h3>
               </div>
            </div>
         </GlassCard>
         <GlassCard delay={0.3} style={{ padding: 32, borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageCheck size={22} />
               </div>
               <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Stok Menipis</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{products.filter(p => p.stock < 15).length} Produk</h3>
               </div>
            </div>
         </GlassCard>
      </div>

      {/* Main Table Layout */}
      <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
         <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
            <div style={{ position: 'relative', width: 340 }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Cari nama produk atau barcode..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field" 
                  style={{ paddingLeft: 48, borderRadius: 14, height: 48, fontWeight: 700, width: '100%', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                />
            </div>
            <button className="secondary-button" style={{ borderRadius: 14, height: 48, padding: '0 20px', background: 'white', border: '1px solid #e1e8f0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}><Filter size={18} /> Filter</button>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ background: '#f8fafc' }}>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Detail Produk</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Variant & Ukuran</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Stok</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Status</th>
                     <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
               </tr>
               </thead>
               <tbody>
                  {filteredProducts.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: idx === filteredProducts.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                       <td style={{ padding: '24px 40px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                             <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f8fafc', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                {p.image_url ? (
                                   <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                      <ImageIcon size={24} />
                                   </div>
                                )}
                             </div>
                             <div>
                                <span style={{ fontSize: '16px', fontWeight: 950, color: '#0f172a', display: 'block' }}>{p.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                   <Barcode size={12} color="#94a3b8" />
                                   <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>BRC-00-{p.id.split('-')[1] || '92'}</span>
                                </div>
                             </div>
                          </div>
                       </td>
                       <td style={{ padding: '24px 40px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: '280px' }}>
                             {p.variants?.map((v: any) => (
                               <div key={v.id} style={{ padding: '8px 12px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', minWidth: '100px' }}>
                                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>{v.name}</p>
                                  <p style={{ fontSize: '13px', fontWeight: 950, color: '#0f172a', margin: '2px 0 0 0' }}>Rp {v.price.toLocaleString('id-ID')}</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                     <span style={{ fontSize: '8px', fontWeight: 900, color: '#2563eb', background: '#eff6ff', padding: '1px 4px', borderRadius: 4 }}>GROSIR: {v.wholesale_price?.toLocaleString('id-ID')}</span>
                                     <span style={{ fontSize: '8px', fontWeight: 900, color: '#9333ea', background: '#faf5ff', padding: '1px 4px', borderRadius: 4 }}>LAIN: {v.other_price?.toLocaleString('id-ID')}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </td>
                       <td style={{ padding: '24px 40px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 950, color: p.stock < 15 ? '#ef4444' : '#0f172a' }}>{p.stock}</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginLeft: 6 }}>{p.unit}</span>
                       </td>
                       <td style={{ padding: '24px 40px' }}>
                          <span style={{ 
                             display: 'inline-flex', 
                             alignItems: 'center', 
                             gap: 6, 
                             padding: '6px 12px', 
                             borderRadius: '10px', 
                             fontSize: '10px', 
                             fontWeight: 950, 
                             textTransform: 'uppercase',
                             background: p.stock < 15 ? '#fff1f2' : '#f0fdf4',
                             color: p.stock < 15 ? '#ef4444' : '#10b981'
                          }}>
                             {p.stock < 15 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                             {p.stock < 15 ? 'RESTOCK' : 'READY'}
                          </span>
                       </td>
                       <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                             <button style={{ padding: '10px', borderRadius: 12, border: '1px solid #e1e8f0', color: '#64748b', cursor: 'pointer', background: 'white' }}><History size={16}/></button>
                             <button onClick={() => handleOpenEdit(p)} style={{ padding: '10px', borderRadius: 12, border: '1px solid #0f172a', color: '#0f172a', cursor: 'pointer', background: '#f8fafc' }}><Edit3 size={16}/></button>
                             <button onClick={() => handleDelete(p.id)} style={{ padding: '10px', borderRadius: 12, border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', background: 'white' }}><Trash2 size={16}/></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </GlassCard>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: 700, background: 'white', borderRadius: '40px', padding: 56, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                   <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{isEditing ? 'Edit Produk' : 'Input Produk Baru'}</h3>
                   <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 12, width: 44, height: 44, cursor: 'pointer' }}><X size={20}/></button>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                   
                   {/* Main Info */}
                   <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32 }}>
                      <div 
                        onClick={() => fileInputRef.current?.click()} 
                        style={{ width: 120, height: 120, borderRadius: 24, background: '#f8fafc', border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 8, position: 'relative', overflow: 'hidden' }}
                      >
                         {formData.image_url ? (
                            <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                            <>
                               <ImageIcon size={32} color="#94a3b8" />
                               <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{uploading ? 'UPLOADING...' : 'FOTO'}</span>
                            </>
                         )}
                         <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleImageUpload} 
                           accept="image/*" 
                           style={{ display: 'none' }} 
                         />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Nama Produk</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="Misal: Nastar Premium King" 
                              style={{ height: 50, borderRadius: 14, border: '1px solid #e1e8f0', padding: '0 20px', fontWeight: 700, fontSize: '16px' }} 
                            />
                         </div>
                         <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Kode Barcode</label>
                               <div style={{ position: 'relative' }}>
                                  <Barcode size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                  <input 
                                    type="text" 
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                    placeholder="Scan atau Ketik Kode..." 
                                    style={{ width: '100%', height: 50, borderRadius: 14, border: '1px solid #e1e8f0', padding: '0 20px 0 50px', fontWeight: 700 }} 
                                  />
                               </div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Stok Awal</label>
                               <input 
                                 type="number" 
                                 value={formData.stock}
                                 onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                                 style={{ height: 50, borderRadius: 14, border: '1px solid #e1e8f0', padding: '0 20px', fontWeight: 700 }} 
                               />
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Ukuran & Tiered Pricing */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Setting Variasi Ukuran & Harga Jual</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                         {formData.variants.map((variant, idx) => (
                            <div key={variant.name} style={{ background: '#f8fafc', padding: 24, borderRadius: 24, border: '1px solid #f1f5f9' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                  <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>Pilihan: {variant.name}</span>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                     <input type="checkbox" defaultChecked /> <span style={{ fontSize: '12px', fontWeight: 800 }}>Aktifkan</span>
                                  </label>
                               </div>
                               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                     <span style={{ fontSize: '10px', fontWeight: 900, color: '#64748b' }}>HARGA UTAMA</span>
                                     <input 
                                       type="number" 
                                       value={variant.price}
                                       onChange={(e) => updateVariant(idx, 'price', parseInt(e.target.value) || 0)}
                                       placeholder="Rp 12.000" 
                                       style={{ padding: '12px', borderRadius: 12, border: '1px solid #e1e8f0', fontWeight: 800 }} 
                                     />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                     <span style={{ fontSize: '10px', fontWeight: 900, color: '#2563eb' }}>HARGA GROSIR</span>
                                     <input 
                                       type="number" 
                                       value={variant.wholesale_price}
                                       onChange={(e) => updateVariant(idx, 'wholesale_price', parseInt(e.target.value) || 0)}
                                       placeholder="Rp 10.000" 
                                       style={{ padding: '12px', borderRadius: 12, border: '1px solid #2563eb44', background: '#eff6ff', fontWeight: 800 }} 
                                     />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                     <span style={{ fontSize: '10px', fontWeight: 900, color: '#9333ea' }}>HARGA LAINNYA</span>
                                     <input 
                                       type="number" 
                                       value={variant.other_price}
                                       onChange={(e) => updateVariant(idx, 'other_price', parseInt(e.target.value) || 0)}
                                       placeholder="Isi sendiri..." 
                                       style={{ padding: '12px', borderRadius: 12, border: '1px solid #f3e8ff', background: '#faf5ff', fontWeight: 800 }} 
                                     />
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                      <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, height: 64, borderRadius: 20, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>Batal</button>
                      <button type="submit" style={{ flex: 2, height: 64, borderRadius: 20, border: 'none', background: '#0f172a', color: 'white', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}>
                        {isEditing ? 'Simpan Perubahan' : 'Publish ke Katalog Jual'}
                      </button>
                   </div>
                </form>

             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
