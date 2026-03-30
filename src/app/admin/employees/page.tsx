"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, UserPlus, Filter, 
  MapPin, Clock, Camera,
  CheckCircle2, XCircle, MoreVertical,
  Mail, Phone, FileText, Check, X, Umbrella, Save, Trash2, Edit, User
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'attendance' | 'requests'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const fetchAllData = async () => {
    // 1. Fetch Staff
    const { data: staff } = await supabase.from('staff').select('*').order('full_name');
    if (staff) setEmployees(staff);

    // 2. Fetch Attendance for Today
    const today = new Date().toISOString().split('T')[0];
    const { data: att } = await supabase.from('attendance_logs').select('*, staff(full_name)').eq('date', today);
    if (att) setAttendance(att);

    // 3. Fetch Leave Requests
    const { data: lv } = await supabase.from('leave_requests').select('*, staff(full_name)').order('created_at', { ascending: false });
    if (lv) setRequests(lv);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = (emp.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (emp.role?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "all" || emp.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [employees, searchTerm, roleFilter]);

  const stats = useMemo(() => {
     const present = attendance.filter(a => a.check_in).length;
     const leaves = requests.filter(r => r.status === 'pending').length;
     return { present, leaves };
  }, [attendance, requests]);

  const handleRequestAction = async (id: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase.from('leave_requests').update({ status: action }).eq('id', id);
    if (!error) {
       alert(`Permohonan telah ${action.toUpperCase()}.`);
       fetchAllData();
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const empData: any = {
      full_name: formData.get('name') as string,
      role: formData.get('role') as string,
      base_salary: Number(formData.get('salary')),
      username: formData.get('username') as string,
      password_hash: formData.get('password') as string, 
    };

    if (editingEmployee) {
      const { error } = await supabase.from('staff').update(empData).eq('id', editingEmployee.id);
      if (error) alert("Gagal perbarui staf: " + error.message);
      else alert("Data staf berhasil diperbarui!");
    } else {
      const { error } = await supabase.from('staff').insert({
         ...empData,
         id: `EMP-${Date.now().toString().slice(-4)}`
      });
      if (error) alert("Gagal daftarkan staf: " + error.message);
      else alert("Staf baru telah terdaftar.");
    }
    
    fetchAllData();
    setShowAddModal(false);
    setEditingEmployee(null);
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Database Karyawan</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Manajemen staf produksi, log absensi, dan pengajuan perizinan terpadu.</p>
        </div>
        <button onClick={() => { setEditingEmployee(null); setShowAddModal(true); }} className="primary-button" style={{ borderRadius: 14, height: 52, padding: '0 32px' }}>
          <UserPlus size={20} /> Registrasi Staf
        </button>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
         {[
           { label: 'Total Staf', val: `${employees.length}`, icon: Users, color: '#0f172a' },
           { label: 'Hadir Pagi Ini', val: `${stats.present}`, icon: Clock, color: '#10b981' },
           { label: 'Pending Izin', val: `${stats.leaves}`, icon: Umbrella, color: '#ef4444' },
           { label: 'Alpha Karyawan', val: `${Math.max(0, employees.length - stats.present)}`, icon: XCircle, color: '#94a3b8' },
         ].map((stat, i) => (
            <GlassCard key={i} style={{ padding: '24px 32px', borderRadius: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                 <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: stat.color + '12', color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <stat.icon size={22} />
                 </div>
                 <div>
                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{stat.label}</p>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{stat.val} <small style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>ORANG</small></h3>
                 </div>
               </div>
            </GlassCard>
         ))}
      </div>

      {/* Tab Select & Table Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48, borderBottom: '1px solid #f1f5f9' }}>
           {[
             { id: 'all', label: 'Daftar Karyawan Aktif' },
             { id: 'attendance', label: 'Monitor Kehadiran' },
             { id: 'requests', label: `Permohonan Izin (${stats.leaves})` },
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               style={{ 
                 padding: '16px 8px', 
                 fontSize: '14px', 
                 fontWeight: 800, 
                 background: 'none', 
                 border: 'none', 
                 borderBottom: activeTab === tab.id ? '2px solid #0f172a' : '2px solid transparent',
                 color: activeTab === tab.id ? '#0f172a' : '#94a3b8',
                 cursor: 'pointer',
                 transition: 'all 0.2s',
                 textTransform: 'uppercase',
                 letterSpacing: '0.1em'
               }}
             >{tab.label}</button>
           ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'all' && (
            <motion.div key="db" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               <GlassCard style={{ padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
                  <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <div style={{ position: 'relative', width: 380 }}>
                        <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94a3b8' }} />
                        <input 
                          type="text" 
                          placeholder="Cari nama atau jabatan..." 
                          className="input-field" 
                          value={searchTerm || ''}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ paddingLeft: 48, borderRadius: 14, height: 48, fontWeight: 700 }} 
                        />
                     </div>
                     <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="input-field" 
                        style={{ width: 220, height: 48, borderRadius: 14, fontWeight: 700 }}
                      >
                         <option value="all">Semua Jabatan</option>
                         <option value="employee">Produksi</option>
                         <option value="cashier">Kasir POS</option>
                         <option value="driver">Driver / Kurir</option>
                         <option value="admin">Administrator</option>
                      </select>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                     <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                           <tr style={{ background: '#f8fafc' }}>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profil Karyawan</th>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Jabatan</th>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gaji Pokok</th>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Username</th>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Aksi</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredEmployees.map((emp) => (
                             <tr key={emp.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                <td style={{ padding: '24px 40px' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                      <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: 16 }}>{emp.full_name?.[0] || 'E'}</div>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                         <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{emp.full_name}</span>
                                         <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{emp.id}</span>
                                      </div>
                                   </div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>{emp.role}</td>
                                <td style={{ padding: '24px 40px', fontWeight: 900 }}>Rp {Number(emp.base_salary || 0).toLocaleString('id-ID')}</td>
                                <td style={{ padding: '24px 40px', color: '#64748b' }}>{emp.username}</td>
                                <td style={{ padding: '24px 40px' }}>
                                   <span style={{ background: '#f0fdf4', color: '#10b981', fontSize: '10px', fontWeight: 950, padding: '6px 14px', borderRadius: 12 }}>AKTIF</span>
                                </td>
                                <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                                      <button onClick={() => { setEditingEmployee(emp); setShowAddModal(true); }} style={{ padding: '10px', borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><Edit size={16}/></button>
                                      <button onClick={async () => {
                                          if (confirm("Hapus karyawan ini?")) {
                                             await supabase.from('staff').delete().eq('id', emp.id);
                                             fetchAllData();
                                          }
                                       }} style={{ padding: '10px', borderRadius: 12, backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </GlassCard>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div key="req" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
               {requests.map(req => (
                 <GlassCard key={req.id} style={{ padding: 48, borderRadius: '32px', borderTop: req.status === 'pending' ? '4px solid #ef4444' : '4px solid #10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Umbrella size={28} />
                          </div>
                          <div>
                             <h4 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{req.staff?.full_name}</h4>
                             <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>PENGAJUAN {req.type} • {req.date}</p>
                          </div>
                       </div>
                    </div>

                    <div style={{ padding: 32, background: '#f8fafc', borderRadius: 24, border: '1px solid #f1f5f9', marginBottom: 32 }}>
                       <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.7', fontWeight: 500 }}>"{req.reason}"</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
                        {req.attachment_url && (
                          <div style={{ width: 120, height: 120, borderRadius: 20, background: '#f1f5f9', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                             <img src={req.attachment_url} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, flex: 1, lineHeight: '1.6' }}>Bukti terlampir diunggah via portal staf. Periksa kebenaran alasan sebelum konfirmasi.</p>
                    </div>

                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 20 }}>
                         <button onClick={() => handleRequestAction(req.id, 'approved')} style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: 950, fontSize: 13, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.3)' }}>SETUJUI</button>
                         <button onClick={() => handleRequestAction(req.id, 'rejected')} style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 950, fontSize: 13, cursor: 'pointer' }}>TOLAK</button>
                      </div>
                    )}
                 </GlassCard>
               ))}
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div key="att" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                  {attendance.map((log, i) => (
                    <GlassCard key={i} style={{ padding: 32, borderRadius: '32px', background: '#ffffff' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                             <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: 16 }}>{log.staff?.full_name?.[0]}</div>
                             <div>
                                <h4 style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{log.staff?.full_name}</h4>
                                <span style={{ fontSize: '10px', fontWeight: 950, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRESENT</span>
                             </div>
                          </div>
                          <Clock size={18} style={{ color: '#cbd5e1' }} />
                       </div>
                       
                       {/* Photos Row */}
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                          <div style={{ aspectRatio: '1/1', borderRadius: 12, background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                             {log.photo_in ? <img src={log.photo_in} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Camera size={16} color="#e2e8f0" /></div>}
                          </div>
                          <div style={{ aspectRatio: '1/1', borderRadius: 12, background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                             {log.photo_out ? <img src={log.photo_out} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Camera size={16} color="#e2e8f0" /></div>}
                          </div>
                       </div>

                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 16, border: '1px solid #f1f5f9' }}>
                             <p style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In</p>
                             <p style={{ fontSize: '16px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 16, border: '1px solid #f1f5f9' }}>
                             <p style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out</p>
                             <p style={{ fontSize: '16px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                          </div>
                       </div>
                    </GlassCard>
                  ))}
                  {attendance.length === 0 && <div style={{ gridColumn: 'span 3', padding: 60, textAlign: 'center', opacity: 0.5 }}>Belum ada log absensi hari ini.</div>}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Modal Registration */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: 700, background: 'white', borderRadius: '40px', padding: 56, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
                   <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{editingEmployee ? 'Update Data Staf' : 'Registrasi Staf Baru'}</h3>
                      <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Lengkapi seluruh data identitas dan keamanan staf.</p>
                   </div>
                   <button onClick={() => { setShowAddModal(false); setEditingEmployee(null); }} style={{ background: '#f8fafc', border: 'none', width: 44, height: 44, borderRadius: 12, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24}/></button>
                </div>
                
                <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                         <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Nama Lengkap (KTP)</label>
                         <input name="name" type="text" className="input-field" defaultValue={editingEmployee?.full_name || ''} placeholder="Masukkan nama..." required style={{ height: 50, fontWeight: 700 }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                             <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Username</label>
                             <input name="username" type="text" className="input-field" defaultValue={editingEmployee?.username || ''} placeholder="Untuk login..." required style={{ height: 50, fontWeight: 700 }} />
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                             <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Kata Sandi</label>
                             <input name="password" type="password" className="input-field" defaultValue={editingEmployee?.password_hash || ''} placeholder="Minimal 6 karakter..." required style={{ height: 50, fontWeight: 700 }} />
                         </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                             <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Jabatan / Role</label>
                             <select name="role" className="input-field" defaultValue={editingEmployee?.role || 'employee'} style={{ height: 50, fontWeight: 700 }}>
                                <option value="employee">Produksi</option>
                                <option value="cashier">Kasir POS</option>
                                <option value="driver">Driver / Kurir</option>
                                <option value="admin">Admin Staf</option>
                             </select>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                             <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Gaji Pokok</label>
                             <input name="salary" type="number" className="input-field" defaultValue={editingEmployee?.base_salary || 3000000} required style={{ height: 50, fontWeight: 950, fontSize: 16 }} />
                         </div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                      <button type="button" onClick={() => { setShowAddModal(false); setEditingEmployee(null); }} style={{ flex: 1, height: 60, borderRadius: 20, background: '#f8fafc', border: 'none', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>Batal</button>
                      <button type="submit" className="primary-button" style={{ flex: 2, height: 60, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                         <Save size={20} /> Simpan Data Karyawan
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
