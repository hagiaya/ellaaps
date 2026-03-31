"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, UserPlus, Filter, 
  MapPin, Clock, Camera,
  CheckCircle2, XCircle, MoreVertical,
  Mail, Phone, FileText, Check, X, Umbrella, Save, Trash2, Edit, User as UserIcon, Info
} from "lucide-react";
import { GlassCard } from "@/components/DashboardCard";
import { useState, useMemo, useEffect } from "react";
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

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  const fetchAllData = async () => {
    const { data: st } = await supabase.from('staff').select('*').order('full_name');
    if (st) setEmployees(st);

    const today = new Date().toISOString().split('T')[0];
    const { data: att } = await supabase.from('attendance_logs').select('*, staff(full_name)').eq('date', today);
    if (att) setAttendance(att);

    const { data: req } = await supabase.from('leave_requests').select('*, staff(full_name)').order('created_at', { ascending: false });
    if (req) setRequests(req);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
     const present = attendance.length;
     const leaves = requests.filter(r => r.status === 'pending').length;
     return { present, leaves };
  }, [attendance, requests]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = (emp.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (emp.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (emp.nik || '').includes(searchTerm);
      const matchRole = roleFilter === "all" || emp.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [employees, searchTerm, roleFilter]);

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
    
    let photoUrl = editingEmployee?.profile_photo_url || '';
    if (profilePhoto) {
       const cdData = new FormData();
       cdData.append("file", profilePhoto);
       cdData.append("upload_preset", "ellacakes");
       try {
         const res = await fetch(`https://api.cloudinary.com/v1_1/dmjpjmece/image/upload`, { method: "POST", body: cdData });
         const json = await res.json();
         photoUrl = json.secure_url;
       } catch (err) {
         console.error("Photo upload error", err);
       }
    }

    const payload = {
      full_name: formData.get('name'),
      role: formData.get('role'),
      base_salary: Number(formData.get('salary')),
      username: formData.get('username'),
      password_hash: formData.get('password'),
      nik: formData.get('nik'),
      phone_number: formData.get('phone'),
      join_date: formData.get('join_date'),
      profile_photo_url: photoUrl
    };

    if (editingEmployee) {
      const { error } = await supabase.from('staff').update(payload).eq('id', editingEmployee.id);
      if (error) alert("Gagal update: " + error.message);
    } else {
      const id = 'EMP-' + Math.random().toString(36).substr(2, 4).toUpperCase();
      const { error } = await supabase.from('staff').insert({ ...payload, id });
      if (error) alert("Gagal daftar: " + error.message);
    }
    
    setShowAddModal(false);
    setProfilePhoto(null);
    setPhotoPreview(null);
    setEditingEmployee(null);
    fetchAllData();
  };

  return (
    <div className="animate-in" style={{ padding: '0 40px 60px 40px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Database Karyawan</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 500, marginTop: 4 }}>Manajemen staf produksi, log absensi, dan data profil terpadu.</p>
        </div>
        <button onClick={() => { setEditingEmployee(null); setPhotoPreview(null); setShowAddModal(true); setShowModalPassword(false); }} className="primary-button" style={{ borderRadius: 14, height: 52, padding: '0 32px' }}>
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
             { id: 'all', label: 'Daftar Profile Karyawan' },
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
                          placeholder="Cari nama, NIK, atau jabatan..." 
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
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Login & NIK</th>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                              <th style={{ padding: '20px 40px', fontSize: '11px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Aksi</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredEmployees.map((emp) => (
                             <tr key={emp.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                <td style={{ padding: '24px 40px' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                      {emp.profile_photo_url ? (
                                         <div onClick={() => window.open(emp.profile_photo_url, '_blank')} style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', border: '2px solid #f1f5f9', cursor: 'pointer' }}>
                                           <img src={emp.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                         </div>
                                      ) : (
                                         <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: 16 }}>{emp.full_name?.[0] || 'E'}</div>
                                      )}
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                         <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{emp.full_name}</span>
                                         <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>HP: {emp.phone_number || '-'}</span>
                                      </div>
                                   </div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>
                                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{emp.role}</span>
                                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>Mulai: {emp.join_date ? new Date(emp.join_date).toLocaleDateString() : '-'}</span>
                                   </div>
                                </td>
                                <td style={{ padding: '24px 40px', fontWeight: 900 }}>Rp {Number(emp.base_salary || 0).toLocaleString('id-ID')}</td>
                                <td style={{ padding: '24px 40px' }}>
                                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>NIK: {emp.nik || '-'}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                         <span style={{ fontSize: '12px', fontWeight: 950, color: '#0f172a', letterSpacing: '0.1em' }}>
                                            {showPasswordMap[emp.id] ? emp.password_hash : '••••••••'}
                                         </span>
                                         <button onClick={() => setShowPasswordMap(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))} style={{ background: 'none', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer' }}>
                                            <Info size={14} />
                                         </button>
                                      </div>
                                   </div>
                                </td>
                                <td style={{ padding: '24px 40px' }}>
                                   <span style={{ background: '#f0fdf4', color: '#10b981', fontSize: '10px', fontWeight: 950, padding: '6px 14px', borderRadius: 12 }}>AKTIF</span>
                                </td>
                                <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                                      <button onClick={() => { 
                                          setEditingEmployee(emp); 
                                          setPhotoPreview(emp.profile_photo_url);
                                          setShowAddModal(true); 
                                          setShowModalPassword(false); 
                                      }} style={{ padding: '10px', borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><Edit size={16}/></button>
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
                        {req.photo_proof && (
                          <div onClick={() => window.open(req.photo_proof, '_blank')} style={{ width: 120, height: 120, borderRadius: 20, background: '#f1f5f9', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                             <img src={req.photo_proof} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                    </div>

                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 20 }}>
                         <button onClick={() => handleRequestAction(req.id, 'approved')} style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: 950, fontSize: 13, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.3)' }}>SETUJUI</button>
                         <button onClick={() => handleRequestAction(req.id, 'rejected')} style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 950, fontSize: 13, cursor: 'pointer' }}>TOLAK</button>
                      </div>
                    )}
                 </GlassCard>
               ))}
               {requests.length === 0 && <div style={{ textAlign: 'center', gridColumn: 'span 2', padding: 100, opacity: 0.5 }}>Tidak ada pengajuan izin.</div>}
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
                       
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                          <div onClick={() => log.photo_in && window.open(log.photo_in, '_blank')} style={{ aspectRatio: '1/1', borderRadius: 12, background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                             {log.photo_in ? <img src={log.photo_in} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Camera size={16} color="#e2e8f0" /></div>}
                          </div>
                          <div onClick={() => log.photo_out && window.open(log.photo_out, '_blank')} style={{ aspectRatio: '1/1', borderRadius: 12, background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                             {log.photo_out ? <img src={log.photo_out} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Camera size={16} color="#e2e8f0" /></div>}
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
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: 750, background: 'white', borderRadius: '40px', padding: 56, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
                   <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{editingEmployee ? 'Update Data Staf' : 'Registrasi Staf Baru'}</h3>
                      <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Lengkapi seluruh data identitas dan keamanan staf.</p>
                   </div>
                   <button onClick={() => { setShowAddModal(false); setEditingEmployee(null); setPhotoPreview(null); }} style={{ background: '#f8fafc', border: 'none', width: 44, height: 44, borderRadius: 12, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24}/></button>
                </div>
                
                <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                         <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Foto Profil</label>
                         <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 24, background: '#f8fafc', border: '2px dashed #e2e8f0', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {photoPreview ? (
                               <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                               <Camera size={32} color="#cbd5e1" />
                            )}
                            <input 
                               type="file" 
                               accept="image/*"
                               onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                     setProfilePhoto(file);
                                     setPhotoPreview(URL.createObjectURL(file));
                                  }
                               }}
                               style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                            />
                         </div>
                         <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>Klik untuk upload / ganti foto</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Nama Lengkap (KTP)</label>
                            <input name="name" type="text" className="input-field" defaultValue={editingEmployee?.full_name || ''} placeholder="Masukkan nama..." required style={{ height: 50, fontWeight: 700 }} />
                         </div>
                         
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>NIK (KTP)</label>
                               <input name="nik" type="text" className="input-field" defaultValue={editingEmployee?.nik || ''} placeholder="16 digit..." style={{ height: 50, fontWeight: 700 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Nomor HP/WA</label>
                               <input name="phone" type="text" className="input-field" defaultValue={editingEmployee?.phone_number || ''} placeholder="08..." style={{ height: 50, fontWeight: 700 }} />
                            </div>
                         </div>

                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Mulai Bekerja</label>
                               <input name="join_date" type="date" className="input-field" defaultValue={editingEmployee?.join_date || new Date().toISOString().split('T')[0]} style={{ height: 50, fontWeight: 700 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Gaji Pokok (Bulan)</label>
                               <input name="salary" type="number" className="input-field" defaultValue={editingEmployee?.base_salary || 3000000} required style={{ height: 50, fontWeight: 950, fontSize: 16 }} />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '32px', background: '#f8fafc', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Username</label>
                          <input name="username" type="text" className="input-field" defaultValue={editingEmployee?.username || ''} placeholder="Untuk login..." required style={{ height: 50, fontWeight: 700, backgroundColor: 'white' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Kata Sandi</label>
                             <button type="button" onClick={() => setShowModalPassword(!showModalPassword)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '10px', fontWeight: 900, cursor: 'pointer' }}>{showModalPassword ? 'LOCK' : 'VIEW'}</button>
                          </div>
                          <input name="password" type={showModalPassword ? "text" : "password"} className="input-field" defaultValue={editingEmployee?.password_hash || ''} placeholder="Minimal 6 karakter..." required style={{ height: 50, fontWeight: 700, backgroundColor: 'white' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Jabatan / Role</label>
                          <select name="role" className="input-field" defaultValue={editingEmployee?.role || 'employee'} style={{ height: 50, fontWeight: 700, backgroundColor: 'white' }}>
                             <option value="employee">Produksi</option>
                             <option value="cashier">Kasir POS</option>
                             <option value="driver">Driver / Kurir</option>
                             <option value="admin">Admin Staf</option>
                          </select>
                      </div>
                   </div>

                   <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                      <button type="button" onClick={() => { setShowAddModal(false); setEditingEmployee(null); setPhotoPreview(null); }} style={{ flex: 1, height: 60, borderRadius: 20, background: '#f8fafc', border: 'none', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>Batal</button>
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
