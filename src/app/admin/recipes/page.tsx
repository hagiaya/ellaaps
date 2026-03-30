"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, Plus, ShoppingCart, Calculator, 
  Trash2, Edit3, ChevronRight, CheckCircle2, 
  AlertTriangle, Save, X, FlaskConical, PackageCheck, History
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { mockRecipes, mockRawMaterials } from "@/lib/mockData";
import { useState, useMemo } from "react";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState(mockRecipes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [productionQty, setProductionQty] = useState(1);
  const [activeTab, setActiveTab] = useState('master'); // 'master' or 'logs'

  // Form State for New/Edit Recipe
  const [recipeName, setRecipeName] = useState('');
  const [recipeOutputQty, setRecipeOutputQty] = useState(1);
  const [recipeOutputUnit, setRecipeOutputUnit] = useState('toples');
  const [newRecipeIngredients, setNewRecipeIngredients] = useState<any[]>([
    { material_id: '', amount: 0 }
  ]);

  // Production Log Storage (Local State)
  const [logs, setLogs] = useState([
    { id: '1', date: '29 Mar', name: 'Nastar Premium', qty: '8 Toples', cost: 'Rp 64.000', user: 'Sarah Ahmed' },
    { id: '2', date: '29 Mar', name: 'Kastengel Keju', qty: '3 Toples', cost: 'Rp 32.500', user: 'Rahmat Hidayat' },
  ]);

  const calculateRecipeCost = (recipe: any) => {
    return recipe.ingredients.reduce((total: number, ing: any) => {
      const material = mockRawMaterials.find(m => m.id === ing.material_id);
      return total + (ing.amount * (material?.price_per_unit || 0));
    }, 0);
  };

  const calculateMaxBatches = (recipe: any) => {
     const batchLims = recipe.ingredients.map((ing: any) => {
        const material = mockRawMaterials.find(m => m.id === ing.material_id);
        if (!material) return 0;
        return Math.floor(material.stock / ing.amount);
     });
     return Math.min(...batchLims);
  };

  const handleLogProduction = () => {
     if (!selectedRecipe) return;
     const costPerBatch = calculateRecipeCost(selectedRecipe);
     const newLog = {
        id: Math.random().toString(),
        date: '29 Mar',
        name: selectedRecipe.name,
        qty: `${selectedRecipe.output_qty * productionQty} ${selectedRecipe.output_unit}`,
        cost: `Rp ${(costPerBatch * productionQty).toLocaleString('id-ID')}`,
        user: 'Super Admin'
     };
     setLogs([newLog, ...logs]);
     setShowProductionModal(false);
     alert(`Produksi ${selectedRecipe.name} berhasil dicatat. Stok bahan baku telah terpotong dan stok kue jadi telah bertambah.`);
  };

  const handleOpenAddModal = () => {
    setEditingRecipe(null);
    setRecipeName('');
    setRecipeOutputQty(1);
    setRecipeOutputUnit('toples');
    setNewRecipeIngredients([{ material_id: '', amount: 0 }]);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (recipe: any) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setRecipeOutputQty(recipe.output_qty);
    setRecipeOutputUnit(recipe.output_unit);
    // Deep copy ingredients to avoid mutating state directly
    setNewRecipeIngredients(JSON.parse(JSON.stringify(recipe.ingredients)));
    setShowAddModal(true);
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the new recipe object
    const updatedRecipe = {
       id: editingRecipe ? editingRecipe.id : Math.random().toString(),
       name: recipeName,
       output_qty: recipeOutputQty,
       output_unit: recipeOutputUnit,
       selling_price: editingRecipe ? editingRecipe.selling_price : 0, 
       base_cost_production: editingRecipe?.base_cost_production || 0,
       ingredients: newRecipeIngredients.filter((ing: any) => ing.material_id !== '') 
    };

    if (editingRecipe) {
       // Update existing
       setRecipes(recipes.map(r => r.id === editingRecipe.id ? updatedRecipe : r));
       alert("Komposisi resep berhasil diperbarui!");
    } else {
       // Add new
       setRecipes([...recipes, updatedRecipe]);
       alert("Resep baru berhasil ditambahkan!");
    }

    setShowAddModal(false);
  };

  const handleDeleteRecipe = (id: string) => {
     if (confirm("Anda yakin ingin menghapus resep ini?")) {
        setRecipes(recipes.filter(r => r.id !== id));
     }
  };

  const addIngredientRow = () => {
    setNewRecipeIngredients([...newRecipeIngredients, { material_id: '', amount: 0 }]);
  };

  const removeIngredientRow = (index: number) => {
    setNewRecipeIngredients(newRecipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredientRow = (index: number, field: string, value: any) => {
    const updated = [...newRecipeIngredients];
    updated[index][field] = value;
    setNewRecipeIngredients(updated);
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Bill of Materials (BOM)</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Definisikan komposisi bahan baku untuk perhitungan modal & stok produksi otomatis.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
           <button onClick={() => setActiveTab(activeTab === 'master' ? 'logs' : 'master')} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', height: 56, padding: '0 24px', borderRadius: 16, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              {activeTab === 'master' ? <History size={20} /> : <Calculator size={20} />}
              {activeTab === 'master' ? 'Lihat Log Produksi' : 'Kembali ke Resep'}
           </button>
           <button onClick={handleOpenAddModal} className="primary-button" style={{ borderRadius: 16, height: 56, padding: '0 32px' }}>
             <Plus size={20} /> Komposisi Baru
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'master' ? (
          <motion.div key="master" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
            {recipes.map((recipe, idx) => {
              const costPerBatch = calculateRecipeCost(recipe);
              const maxBatches = calculateMaxBatches(recipe);
              const isLowOnStock = maxBatches < 5;

              return (
                <GlassCard key={recipe.id} delay={idx * 0.1} style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
                    <div style={{ padding: 40, background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <ChefHat size={22} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{recipe.name}</h3>
                         </div>
                         <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => handleOpenEditModal(recipe)} style={{ padding: 10, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><Edit3 size={16}/></button>
                            <button onClick={() => handleDeleteRecipe(recipe.id)} style={{ padding: 10, borderRadius: 10, background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                         </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                         <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, border: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Modal Bahan / Batch</p>
                            <h4 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {costPerBatch.toLocaleString('id-ID')}</h4>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: 4 }}>Margin {recipe.selling_price ? Math.round(((recipe.selling_price * recipe.output_qty - costPerBatch) / (recipe.selling_price * recipe.output_qty)) * 100) : 0}%</p>
                         </div>
                         <div style={{ background: isLowOnStock ? '#fff1f2' : '#f0fdf4', padding: 20, borderRadius: 20, border: isLowOnStock ? '1px solid #fee2e2' : '1px solid #dcfce7' }}>
                            <p style={{ fontSize: '10px', fontWeight: 900, color: isLowOnStock ? '#ef4444' : '#10b981', textTransform: 'uppercase', marginBottom: 8 }}>Potensi Produksi</p>
                            <h4 style={{ fontSize: '20px', fontWeight: 950, color: isLowOnStock ? '#ef4444' : '#10b981', margin: 0 }}>{maxBatches} <small style={{ fontSize: 12 }}>BATCH</small></h4>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: 4 }}>Sisa stok bahan baku</p>
                         </div>
                      </div>
                    </div>

                    <div style={{ padding: 32, background: '#f8fafc' }}>
                       <p style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Daftar Bahan Baku (BOM)</p>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                         {recipe.ingredients.map((ing: any) => {
                           const material = mockRawMaterials.find(m => m.id === ing.material_id);
                           return (
                             <div key={ing.material_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                   <FlaskConical size={14} style={{ color: '#cbd5e1' }} />
                                   <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{material?.name}</span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 850, color: '#64748b' }}>{ing.amount} <small>{material?.unit}</small></span>
                             </div>
                           );
                         })}
                       </div>

                       <button 
                         onClick={() => { setSelectedRecipe(recipe); setShowProductionModal(true); setProductionQty(1); }}
                         style={{ 
                           width: '100%', 
                           marginTop: 32, 
                           height: 56, 
                           borderRadius: 16, 
                           backgroundColor: '#0f172a', 
                           color: 'white', 
                           border: 'none', 
                           fontWeight: 950, 
                           fontSize: '14px', 
                           letterSpacing: '0.05em',
                           cursor: 'pointer',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: 12
                         }}>
                         <PackageCheck size={20} /> CATAT HASIL PRODUKSI
                       </button>
                    </div>
                </GlassCard>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="logs" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                   <thead>
                      <tr style={{ background: '#f8fafc' }}>
                         <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Waktu Log</th>
                         <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Nama Produk</th>
                         <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Jumlah Jadi</th>
                         <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Modal Produksi</th>
                         <th style={{ padding: '24px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>Operator</th>
                      </tr>
                   </thead>
                   <tbody>
                      {logs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '24px 40px', fontSize: '14px', fontWeight: 700, color: '#64748b' }}>{log.date}</td>
                           <td style={{ padding: '24px 40px', fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{log.name}</td>
                           <td style={{ padding: '24px 40px', fontSize: '14px', fontWeight: 800, color: '#2563eb' }}>{log.qty}</td>
                           <td style={{ padding: '24px 40px', fontSize: '14px', fontWeight: 950, color: '#1e293b' }}>{log.cost}</td>
                           <td style={{ padding: '24px 40px' }}>
                              <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 10, fontSize: '11px', fontWeight: 800, color: '#64748b' }}>{log.user}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Production Modal */}
      <AnimatePresence>
        {showProductionModal && selectedRecipe && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: '32px', padding: 56 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                   <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                      <PackageCheck size={32} />
                   </div>
                   <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Lapor Hasil Produksi</h3>
                   <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginTop: 8 }}>{selectedRecipe.name}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div>
                       <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 12 }}>Berapa Kali Resep (Batch)?</label>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 24px', background: '#f1f5f9', borderRadius: 20 }}>
                          <button onClick={() => setProductionQty(Math.max(1, productionQty - 1))} style={{ background: 'white', border: '1px solid #e2e8f0', width: 44, height: 44, borderRadius: 12, fontWeight: 950, cursor: 'pointer' }}>-</button>
                          <span style={{ flex: 1, textAlign: 'center', fontSize: '24px', fontWeight: 950, color: '#0f172a' }}>{productionQty}</span>
                          <button onClick={() => setProductionQty(Math.min(calculateMaxBatches(selectedRecipe), productionQty + 1))} style={{ background: 'white', border: '1px solid #e2e8f0', width: 44, height: 44, borderRadius: 12, fontWeight: 950, cursor: 'pointer' }}>+</button>
                       </div>
                       <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textAlign: 'center', marginTop: 12 }}>= Jadi {productionQty * selectedRecipe.output_qty} {selectedRecipe.output_unit}</p>
                    </div>

                    <div style={{ padding: 24, background: '#f8fafc', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Total Modal Bahan</span>
                          <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>Rp {(calculateRecipeCost(selectedRecipe) * productionQty).toLocaleString('id-ID')}</span>
                       </div>
                       <div style={{ padding: '16px', background: '#ffffff', borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                          <p style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, margin: 0 }}>Menyimpan log akan langsung memotong stok gudang.</p>
                       </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                       <button onClick={() => setShowProductionModal(false)} style={{ flex: 1, height: 60, borderRadius: 20, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>Batal</button>
                       <button onClick={handleLogProduction} className="primary-button" style={{ flex: 2, height: 60, borderRadius: 20 }}>Simpan Log Kerja</button>
                    </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Recipe Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: 540, background: 'white', borderRadius: '32px', padding: 56 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                   <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: 0 }}>
                      {editingRecipe ? 'Edit Komposisi Resep' : 'Definisikan Resep Baru'}
                   </h3>
                   <button onClick={() => setShowAddModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: 12, width: 44, height: 44, cursor: 'pointer' }}><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveRecipe} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Nama Produk Jadi</label>
                      <input 
                        type="text" 
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                        className="input-field" 
                        placeholder="Misal: Nastar Keju Special" 
                        required 
                        style={{ height: 56, fontWeight: 700 }} 
                      />
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Hasil Per 1 Batch PRODUKSI</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                         <input 
                           type="number" 
                           value={recipeOutputQty}
                           onChange={(e) => setRecipeOutputQty(Number(e.target.value))}
                           className="input-field" 
                           placeholder="Qty" 
                           required 
                           style={{ height: 56, fontWeight: 700 }} 
                         />
                         <select 
                           value={recipeOutputUnit}
                           onChange={(e) => setRecipeOutputUnit(e.target.value)}
                           className="input-field" 
                           style={{ height: 56, fontWeight: 700 }}
                         >
                            <option value="Toples">Toples</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Mika">Mika</option>
                         </select>
                      </div>
                   </div>
                   <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20 }}>
                      <p style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16 }}>Daftar Bahan (BOM)</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                         {newRecipeIngredients.map((ing, index) => (
                           <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <select 
                                required
                                value={ing.material_id}
                                onChange={(e) => updateIngredientRow(index, 'material_id', e.target.value)}
                                className="input-field" 
                                style={{ flex: 2, height: 48, fontWeight: 700 }}
                              >
                                <option value="">Pilih Bahan...</option>
                                {mockRawMaterials.map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                              <div style={{ flex: 1, position: 'relative' }}>
                                 <input 
                                   required
                                   type="number" 
                                   value={ing.amount}
                                   onChange={(e) => updateIngredientRow(index, 'amount', Number(e.target.value))}
                                   className="input-field" 
                                   placeholder="Qty" 
                                   style={{ height: 48, fontWeight: 800, paddingRight: 40 }} 
                                 />
                                 <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#94a3b8', fontWeight: 900 }}>
                                    {mockRawMaterials.find(m => m.id === ing.material_id)?.unit || ''}
                                 </span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeIngredientRow(index)}
                                style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Trash2 size={18} />
                              </button>
                           </div>
                         ))}
                      </div>

                      <button 
                        type="button" 
                        onClick={addIngredientRow}
                        style={{ width: '100%', height: 44, background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 12, color: '#2563eb', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        + Tambah Bahan Lain
                      </button>
                   </div>
                   <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                      <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, height: 60, borderRadius: 20, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>Batal</button>
                      <button type="submit" className="primary-button" style={{ flex: 2, height: 60, borderRadius: 20 }}>
                         {editingRecipe ? 'Simpan Perubahan' : 'Simpan Master Resep'}
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
