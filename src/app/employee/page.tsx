"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera as CameraIcon, Check as CheckIcon, Clock as ClockIcon, ChevronRight as ChevronRightIcon, User as UserIcon, LogOut as LogOutIcon, Lock as LockIcon,
  MapPin as MapPinIcon, Shield as ShieldIcon, Calendar as CalendarIcon, FileImage as FileImageIcon, 
  X as XIcon, Briefcase as BriefcaseIcon, TrendingUp as TrendingUpIcon, AlertCircle as AlertCircleIcon, Phone as PhoneIcon, 
  FileText as FileTextIcon, History as HistoryIcon, Info as InfoIcon, Bell as BellIcon, Loader2 as LoaderIcon, Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon, Users as UsersIcon, Zap as ZapIcon, Scissors as ScissorsIcon, Scale as ScaleIcon, Wallet as WalletIcon, Umbrella as UmbrellaIcon
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// Premium Glass Component
const GlassCard = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ 
    background: 'rgba(255, 255, 255, 0.8)', 
    backdropFilter: 'blur(20px)', 
    border: '1px solid rgba(255, 255, 255, 0.3)', 
    borderRadius: '24px', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
    ...style 
  }}>
    {children}
  </div>
);

const GlassButton = ({ onClick, children, active, color }: { onClick: () => void, children: React.ReactNode, active?: boolean, color?: string }) => (
  <button 
    onClick={onClick}
    style={{ 
       flex: 1, height: '100%', border: 'none', background: active ? (color || '#0f172a') : 'transparent', 
       color: active ? 'white' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', 
       justifyContent: 'center', gap: 6, borderRadius: '16px', transition: 'all 0.3s' 
    }}
  >
    {children}
  </button>
);

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'payslips' | 'history'>('attendance');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Stats
  const [stats, setStats] = useState({ total_salary: 0, attendance: 0, production_kg: 0 });
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkOutDone, setCheckOutDone] = useState(false);

  // Modals
  const [showProfile, setShowProfile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<'in' | 'out' | 'leave' | 'friend'>('in');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState<'Izin' | 'Sakit' | 'Cuti'>('Izin');
  const [leaveReason, setLeaveReason] = useState('');
  const [leavePhoto, setLeavePhoto] = useState<string | null>(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Bantu Teman
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<any>(null);
  const [friendPhoto, setFriendPhoto] = useState<string | null>(null);
  const [isSubmittingFriendAtt, setIsSubmittingFriendAtt] = useState(false);

  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [productionHistory, setProductionHistory] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  
  const [currentRecipe, setCurrentRecipe] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [isSavingProduction, setIsSavingProduction] = useState(false);
  const [counts, setCounts] = useState({ mika: '', sedang: '', besar: '' });
  const recipes = ["Brownies Sekat", "Bolen Pisang", "Lapis Legit", "Nastat", "Kastengel", "Putri Salju"];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const userJson = localStorage.getItem('ela_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      setLoggedInUser(user);
      fetchAllData(user.id, user);
    }
    const fetchStaffList = async () => {
       const { data } = await supabase.from('staff').select('*').order('full_name');
       if (data) setAllStaff(data);
    };
    fetchStaffList();
  }, []);

  const fetchAllData = async (staffId: string, user: any) => {
    fetchTodayStatus(staffId);
    fetchMonthlyStats(staffId, user);
    fetchPayslips(staffId);
  };

  const fetchPayslips = async (id: string) => {
    const { data } = await supabase.from('payslips').select('*').eq('staff_id', id).order('year', { ascending: false }).order('month', { ascending: false });
    if (data) setPayslips(data);
  };

  const fetchTodayStatus = async (staffId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('attendance_logs').select('*').eq('staff_id', staffId).eq('date', today).single();
    if (data) {
      setCheckInDone(!!data.check_in); setCheckOutDone(!!data.check_out);
    } else {
      setCheckInDone(false); setCheckOutDone(false);
    }
  };

  const fetchMonthlyStats = async (staffId: string, user: any) => {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const { data: att } = await supabase.from('attendance_logs').select('*').eq('staff_id', staffId).gte('date', firstDay);
    const { data: prod } = await supabase.from('production_logs').select('*').eq('staff_id', staffId).gte('date', firstDay);
    const { data: kasbon } = await supabase.from('staff_kasbon').select('*').eq('staff_id', staffId).gte('date', firstDay);
    
    if (att) setAttendanceHistory(att.sort((a,b) => b.date.localeCompare(a.date)));
    if (prod) setProductionHistory(prod.sort((a,b) => b.date.localeCompare(a.date)));

    const BASE = user.base_salary || 2000000;
    const DAILY = Math.floor(BASE / 26);
    let total = (att?.length || 0) * DAILY;
    prod?.forEach(p => total += Math.max(0, (p.weight_kg - 2) * 25000));
    kasbon?.forEach(k => total -= k.amount);

    setStats({ total_salary: total, attendance: att?.length || 0, production_kg: prod?.reduce((acc, p) => acc + (p.weight_kg || 0), 0) || 0 });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoggingIn(true);
    const { data } = await supabase.from('staff').select('*').eq('username', loginForm.username).eq('password_hash', loginForm.password).single();
    if (data) {
      localStorage.setItem('ela_user', JSON.stringify(data)); setLoggedInUser(data); fetchAllData(data.id, data);
    } else alert("Error Login!");
    setIsLoggingIn(false);
  };

  const handleLogout = () => { if (confirm("Logout?")) { localStorage.removeItem('ela_user'); setLoggedInUser(null); } };

  const startCamera = async (type: 'in' | 'out' | 'leave' | 'friend') => {
    setCameraType(type); setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("Akses kamera ditolak."); setShowCamera(false); }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0); const photo = canvasRef.current.toDataURL('image/jpeg');
      if (cameraType === 'leave') setLeavePhoto(photo); else if (cameraType === 'friend') setFriendPhoto(photo); else handleAttendance(photo);
      if (videoRef.current.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setShowCamera(false);
    }
  };

  const uploadToCloudinary = async (base64: string) => {
    try {
      const fd = new FormData(); fd.append("file", base64); fd.append("upload_preset", "ellacakes");
      const res = await fetch(`https://api.cloudinary.com/v1_1/dmjpjmece/image/upload`, { method: "POST", body: fd });
      const data = await res.json(); return data.secure_url;
    } catch { return null; }
  };

  const handleAttendance = async (photo: string) => {
    setIsSubmitting(true); const url = await uploadToCloudinary(photo);
    if (!url) return setIsSubmitting(false);
    const today = new Date().toISOString().split('T')[0]; const now = new Date().toISOString();
    if (cameraType === 'in') await supabase.from('attendance_logs').insert({ staff_id: loggedInUser.id, date: today, check_in: now, photo_in: url });
    else await supabase.from('attendance_logs').update({ check_out: now, photo_out: url }).eq('staff_id', loggedInUser.id).eq('date', today);
    fetchTodayStatus(loggedInUser.id); setIsSubmitting(false);
  };

  const handleFriendAttendance = async () => {
    if (!friendPhoto || !selectedFriend) return;
    setIsSubmittingFriendAtt(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej));
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - (-0.5053), 2) + Math.pow(pos.coords.longitude - 123.0631, 2)) * 111320;
      if (dist > 200) return alert("Anda di luar radius toko!");
      const url = await uploadToCloudinary(friendPhoto);
      const today = new Date().toISOString().split('T')[0]; const now = new Date().toISOString();
      if (!friendStatus) await supabase.from('attendance_logs').insert({ staff_id: selectedFriend.id, date: today, check_in: now, photo_in: url });
      else await supabase.from('attendance_logs').update({ check_out: now, photo_out: url }).eq('staff_id', selectedFriend.id).eq('date', today);
      alert("Selesai!"); setShowFriendModal(false); setSelectedFriend(null); setFriendPhoto(null);
    } catch { alert("Gagal!"); } finally { setIsSubmittingFriendAtt(false); }
  };

  if (!isMounted) return null;

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: '#f8fafc', minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        
        {/* APP BAR */}
        <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(248, 250, 252, 0.8)', backdropFilter:'blur(20px)', zIndex: 100 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
             <div style={{ width:40, height:40, borderRadius:12, background:'#2563eb', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}><ZapIcon size={22} /></div>
             <h1 style={{ fontSize:18, fontWeight:900, margin:0 }}>ElaApp</h1>
          </div>
          {loggedInUser && <button onClick={()=>setShowProfile(true)} style={{ background:'none', border:'none', color:'#64748b' }}><UserIcon size={24} /></button>}
        </div>

        <div style={{ flex: 1, padding: '10px 24px 140px 24px', overflowY: 'auto' }}>
          {!loggedInUser ? (
             <div style={{ height:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <GlassCard style={{ width:'100%', padding:40, textAlign:'center' }}>
                   <div style={{ width:72, height:72, background:'#0f172a', color:'white', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}><LockIcon size={32} /></div>
                   <h2 style={{ fontSize:26, fontWeight:950, marginBottom:10 }}>Login Staf</h2>
                   <p style={{ color:'#64748b', marginBottom:40 }}>Verifikasi untuk akses fitur absensi.</p>
                   <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:20, textAlign:'left' }}>
                      <div>
                         <label style={{ fontSize:11, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', marginLeft:4, marginBottom:8, display:'block' }}>Username</label>
                         <input type="text" placeholder="Masukkan username" value={loginForm.username} onChange={e=>setLoginForm({...loginForm, username:e.target.value})} style={{ width:'100%', height:60, padding:'0 20px', borderRadius:18, border:'1.5px solid #e2e8f0', background:'#f1f5f9', fontWeight:700, fontSize:15 }} />
                      </div>
                      <div style={{ marginBottom:10 }}>
                         <label style={{ fontSize:11, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', marginLeft:4, marginBottom:8, display:'block' }}>Password</label>
                         <input type="password" placeholder="******" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password:e.target.value})} style={{ width:'100%', height:60, padding:'0 20px', borderRadius:18, border:'1.5px solid #e2e8f0', background:'#f1f5f9', fontWeight:700, fontSize:15 }} />
                      </div>
                      <button type="submit" disabled={isLoggingIn} style={{ height:64, borderRadius:20, background:'#2563eb', color:'white', fontWeight:950, border:'none', fontSize:16, boxShadow:'0 10px 25px rgba(37, 99, 235, 0.4)' }}>{isLoggingIn ? 'MEMVERIFIKASI...' : 'MASUK SEKARANG'}</button>
                   </form>
                </GlassCard>
             </div>
          ) : (
             <AnimatePresence mode="wait">
               {activeTab === 'attendance' && (
                  <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} style={{ display:'flex', flexDirection:'column', gap: 28 }}>
                     <GlassCard style={{ padding: 28, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', border:'none' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                           <div>
                              <p style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>ESTIMASI SALIS GAJI</p>
                              <h3 style={{ fontSize: 32, fontWeight: 950, margin: 0 }}>Rp {stats.total_salary.toLocaleString('id-ID')}</h3>
                           </div>
                           <TrendingUpIcon size={24} style={{ opacity:0.6 }} />
                        </div>
                        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                           <div style={{ flex:1, padding:'16px 12px', background:'rgba(255,255,255,0.12)', borderRadius:16, backdropFilter:'blur(10px)' }}><p style={{fontSize:9, margin:0, fontWeight:900, opacity:0.7, textTransform:'uppercase'}}>Hadir</p><b style={{fontSize:18, fontWeight:1000}}>{stats.attendance} <span style={{fontSize:10, fontWeight:600}}>Hari</span></b></div>
                           <div style={{ flex:1, padding:'16px 12px', background:'rgba(255,255,255,0.12)', borderRadius:16, backdropFilter:'blur(10px)' }}><p style={{fontSize:9, margin:0, fontWeight:900, opacity:0.7, textTransform:'uppercase'}}>Produksi</p><b style={{fontSize:18, fontWeight:1000}}>{stats.production_kg.toFixed(1)} <span style={{fontSize:10, fontWeight:600}}>Kg</span></b></div>
                        </div>
                     </GlassCard>

                     <div style={{ display:'flex', gap: 16 }}>
                        {!checkInDone ? (
                           <button onClick={()=>startCamera('in')} style={{ flex:1, height:160, borderRadius:28, background:'#ffffff', border:'none', boxShadow:'0 10px 25px rgba(0,0,0,0.03)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                              <div style={{ width:60, height:60, borderRadius:20, background:'#f0fdf4', color:'#10b981', display:'flex', alignItems:'center', justifyContent:'center' }}><ClockIcon size={28}/></div>
                              <span style={{ fontSize:14, fontWeight:1000 }}>MASUK</span>
                           </button>
                        ) : !checkOutDone ? (
                           <button onClick={()=>startCamera('out')} style={{ flex:1, height:160, borderRadius:28, background:'#ffffff', border:'none', boxShadow:'0 10px 25px rgba(0,0,0,0.03)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                              <div style={{ width:60, height:60, borderRadius:20, background:'#fef2f2', color:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center' }}><LogOutIcon size={28}/></div>
                              <span style={{ fontSize:14, fontWeight:1000 }}>PULANG</span>
                           </button>
                        ) : (
                           <div style={{ flex:1, height:160, borderRadius:28, background:'#ecfdf5', border:'1px solid #10b981', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                              <div style={{ width:60, height:60, borderRadius:20, background:'#ffffff', color:'#10b981', display:'flex', alignItems:'center', justifyContent:'center' }}><CheckIcon size={28}/></div>
                              <span style={{ fontSize:14, fontWeight:1000, color:'#10b981' }}>SELESAI</span>
                           </div>
                        )}
                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
                           <button onClick={()=>setShowLeaveForm(true)} style={{ flex:1, borderRadius:24, background:'#ffffff', border:'none', boxShadow:'0 10px 25px rgba(0,0,0,0.03)', display:'flex', alignItems:'center', gap:16, padding:'0 20px' }}>
                              <div style={{ width:44, height:44, borderRadius:12, background:'#eff6ff', color:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center' }}><CalendarIcon size={20}/></div>
                              <span style={{ fontSize:12, fontWeight:950 }}>IJIN / CUTI</span>
                           </button>
                           <button onClick={()=>setShowFriendModal(true)} style={{ flex:1, borderRadius:24, background:'#ffffff', border:'none', boxShadow:'0 10px 25px rgba(0,0,0,0.03)', display:'flex', alignItems:'center', gap:16, padding:'0 20px' }}>
                              <div style={{ width:44, height:44, borderRadius:12, background:'#fdf4ff', color:'#d946ef', display:'flex', alignItems:'center', justifyContent:'center' }}><UsersIcon size={20}/></div>
                              <span style={{ fontSize:12, fontWeight:950 }}>BANTU TEMAN</span>
                           </button>
                        </div>
                     </div>

                     <GlassCard style={{ padding:28 }}>
                        <h4 style={{ margin:'0 0 24px 0', fontSize:15, fontWeight:1000, display:'flex', alignItems:'center', gap:10 }}><BriefcaseIcon size={18} color="#2563eb" /> INPUT PRODUKSI</h4>
                        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                           <select value={currentRecipe} onChange={e=>setCurrentRecipe(e.target.value)} style={{ height:60, padding:'0 20px', borderRadius:18, border:'1px solid #e2e8f0', background:'#f8fafc', fontWeight:700, fontSize:14 }}>
                              <option value="">Pilih Resep Kue...</option>
                              {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                           <input type="number" placeholder="Total Berat Adonan (Kg)" value={currentWeight} onChange={e=>setCurrentWeight(e.target.value)} style={{ height:60, padding:'0 20px', borderRadius:18, border:'1px solid #e2e8f0', background:'#f8fafc', fontWeight:700, fontSize:14 }} />
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                              <div style={{ textAlign:'center' }}><label style={{fontSize:9, fontWeight:900, color:'#94a3b8', display:'block', marginBottom:8}}>MIKA</label><input value={counts.mika} onChange={e=>setCounts({...counts, mika:e.target.value})} style={{ width:'100%', height:56, borderRadius:14, border:'1px solid #e2e8f0', textAlign:'center', fontWeight:800 }} /></div>
                              <div style={{ textAlign:'center' }}><label style={{fontSize:9, fontWeight:900, color:'#94a3b8', display:'block', marginBottom:8}}>SEDANG</label><input value={counts.sedang} onChange={e=>setCounts({...counts, sedang:e.target.value})} style={{ width:'100%', height:56, borderRadius:14, border:'1px solid #e2e8f0', textAlign:'center', fontWeight:800 }} /></div>
                              <div style={{ textAlign:'center' }}><label style={{fontSize:9, fontWeight:900, color:'#94a3b8', display:'block', marginBottom:8}}>BESAR</label><input value={counts.besar} onChange={e=>setCounts({...counts, besar:e.target.value})} style={{ width:'100%', height:56, borderRadius:14, border:'1px solid #e2e8f0', textAlign:'center', fontWeight:800 }} /></div>
                           </div>
                           <button onClick={saveProduction} disabled={isSavingProduction} style={{ height:64, borderRadius:20, background:'#0f172a', color:'white', fontWeight:950, border:'none', fontSize:15, marginTop:8 }}>{isSavingProduction ? 'MENYIMPAN...' : 'SIMPAN LAPORAN'}</button>
                        </div>
                     </GlassCard>
                  </motion.div>
               )}

               {activeTab === 'payslips' && (
                  <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} style={{ display:'flex', flexDirection:'column', gap: 24 }}>
                     <h2 style={{ fontSize: 24, fontWeight: 950, margin: 0 }}>Riwayat Slip Gaji</h2>
                     {payslips.map(ps => (
                        <GlassCard key={ps.id} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', gap: 16 }}>
                                 <div style={{ width: 52, height: 52, borderRadius: 16, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><WalletIcon size={24}/></div>
                                 <div>
                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 950 }}>Gaji {new Date(ps.year, ps.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h4>
                                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{new Date(ps.created_at).toLocaleDateString()}</span>
                                 </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <p style={{ margin: 0, fontWeight: 1000, fontSize: 18, color: '#10b981' }}>Rp {ps.total_net_salary.toLocaleString('id-ID')}</p>
                                 <span style={{ fontSize: 10, fontWeight: 900, color: '#10b981', textTransform:'uppercase' }}>Paid</span>
                              </div>
                           </div>
                           <div style={{ padding:20, background:'#f8fafc', borderRadius:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              <div style={{ fontSize:12, color:'#64748b' }}>Harian: <b style={{color:'#0f172a'}}>Rp {ps.attendance_bonus?.toLocaleString('id-ID')}</b></div>
                              <div style={{ fontSize:12, color:'#64748b' }}>Produksi: <b style={{color:'#0f172a'}}>Rp {ps.production_bonus?.toLocaleString('id-ID')}</b></div>
                           </div>
                           {ps.payment_proof_url && <button onClick={() => window.open(ps.payment_proof_url, '_blank')} style={{ height:52, borderRadius:16, background:'#f1f5f9', border:'none', fontWeight:900, color:'#0f172a', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}><FileImageIcon size={18}/> LIHAT BUKTI TRANSFER</button>}
                        </GlassCard>
                     ))}
                  </motion.div>
               )}

               {activeTab === 'history' && (
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} style={{ display:'flex', flexDirection:'column', gap: 32 }}>
                     <div>
                        <h4 style={{ margin:'0 0 20px 0', fontSize:16, fontWeight:1000, color:'#2563eb' }}>LOG ABSENSI</h4>
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                           {attendanceHistory.map(h => (
                              <GlassCard key={h.id} style={{ padding:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                 <div>
                                    <p style={{ margin:0, fontWeight:950, fontSize:14 }}>{new Date(h.date).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'short' })}</p>
                                    <p style={{ margin:'4px 0 0 0', fontSize:12, color:'#64748b', fontWeight:600 }}>{h.check_in ? new Date(h.check_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'} s/d {h.check_out ? new Date(h.check_out).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Aktif'}</p>
                                 </div>
                                 <div style={{ padding:'8px 16px', borderRadius:10, background:h.check_out ? '#f0fdf4':'#fffbeb', color:h.check_out?'#10b981':'#f59e0b', fontSize:11, fontWeight:900 }}>{h.check_out ? 'SELESAI':'KERJA'}</div>
                              </GlassCard>
                           ))}
                        </div>
                     </div>
                     <div>
                        <h4 style={{ margin:'0 0 20px 0', fontSize:16, fontWeight:1000, color:'#d946ef' }}>LOG PRODUKSI</h4>
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                           {productionHistory.map(p => (
                              <GlassCard key={p.id} style={{ padding:20 }}>
                                 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                                    <b style={{ fontSize:15 }}>{p.recipe}</b>
                                    <span style={{ fontSize:16, fontWeight:1000, color:'#2563eb' }}>{p.weight_kg} Kg</span>
                                 </div>
                                 <div style={{ display:'flex', gap:12, fontSize:12, color:'#64748b', fontWeight:600 }}>
                                    <span>Mika: {p.mika}</span>
                                    <span>Sedang: {p.sedang}</span>
                                    <span>Besar: {p.besar}</span>
                                 </div>
                              </GlassCard>
                           ))}
                        </div>
                     </div>
                  </motion.div>
               )}
             </AnimatePresence>
          )}
        </div>

        {/* BOTTOM NAVIGATION */}
        {loggedInUser && (
           <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 64px)', maxWidth:416, height:84, background:'#0f172a', borderRadius:28, display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 10px', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex:1000 }}>
              <GlassButton onClick={()=>setActiveTab('attendance')} active={activeTab==='attendance'}><ZapIcon size={22} /><span>Home</span></GlassButton>
              <GlassButton onClick={()=>setActiveTab('payslips')} active={activeTab==='payslips'}><WalletIcon size={22} /><span>Gaji</span></GlassButton>
              <GlassButton onClick={()=>setActiveTab('history')} active={activeTab==='history'}><HistoryIcon size={22} /><span>Log</span></GlassButton>
           </div>
        )}

        {/* MODALS & OVERLAYS */}
        <AnimatePresence>
           {showProfile && (
              <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(5px)', zIndex:2000, display:'flex', justifyContent:'flex-end' }}>
                 <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }} style={{ width:'320px', height:'100%', background:'white', padding:40, display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40 }}>
                       <h3 style={{ margin:0, fontWeight:950 }}>Akun Saya</h3>
                       <button onClick={()=>setShowProfile(false)} style={{ background:'#f1f5f9', border:'none', width:40, height:40, borderRadius:12 }}><XIcon size={20}/></button>
                    </div>
                    <div style={{ textAlign:'center', marginBottom:40 }}>
                       <div style={{ width:110, height:110, borderRadius:40, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', overflow:'hidden', border:'4px solid #f1f5f9' }}>
                          {loggedInUser?.profile_photo_url ? <img src={loggedInUser.profile_photo_url} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <UserIcon size={48} color="#cbd5e1" />}
                       </div>
                       <h4 style={{ margin:'0 0 4px 0', fontSize:20, fontWeight:1000 }}>{loggedInUser?.full_name}</h4>
                       <p style={{ color:'#94a3b8', fontWeight:700, textTransform:'uppercase', fontSize:11, letterSpacing:1 }}>{loggedInUser?.role}</p>
                    </div>
                    <div style={{ padding:24, background:'#f8fafc', borderRadius:24, marginBottom:20 }}>
                       <p style={{ fontSize:11, fontWeight:900, color:'#94a3b8', marginBottom:16 }}>INFORMASI STAF</p>
                       <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span>ID Staf</span><b style={{fontWeight:800}}>{loggedInUser?.id}</b></div>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span>Bergabung</span><b style={{fontWeight:800}}>{new Date(loggedInUser?.joining_date).toLocaleDateString()}</b></div>
                       </div>
                    </div>
                    <button onClick={handleLogout} style={{ marginTop:'auto', height:64, borderRadius:20, background:'#fef2f2', color:'#ef4444', fontWeight:1000, border:'none', fontSize:14 }}>LOGOUT DARI SISTEM</button>
                 </motion.div>
              </div>
           )}

           {showLeaveForm && (
              <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(5px)', zIndex:2000, display:'flex', alignItems:'flex-end' }}>
                 <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }} style={{ width:'100%', maxWidth:480, height:'92%', background:'white', borderRadius:'36px 36px 0 0', padding:32, overflowY:'auto' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:32 }}>
                       <h3 style={{ fontWeight:1000 }}>Form Ijin & Cuti</h3>
                       <button onClick={()=>setShowLeaveForm(false)} style={{ background:'#f1f5f9', border:'none', width:44, height:44, borderRadius:14 }}><XIcon size={20}/></button>
                    </div>
                    {!leaveSubmitted ? (
                       <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                          <div style={{ display:'flex', gap:10, padding:6, background:'#f1f5f9', borderRadius:18 }}>
                             {['Izin','Sakit','Cuti'].map(t => <button key={t} onClick={()=>setLeaveType(t as any)} style={{ flex:1, height:44, borderRadius:14, border:'none', background:leaveType===t?'#0f172a':'transparent', color:leaveType===t?'white':'#64748b', fontWeight:950, fontSize:12 }}>{t}</button>)}
                          </div>
                          <div onClick={()=>startCamera('leave')} style={{ height:200, border:'2px dashed #e2e8f0', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'#f8fafc' }}>
                             {leavePhoto ? <img src={leavePhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{textAlign:'center'}}><CameraIcon size={32} color="#cbd5e1" /><p style={{fontSize:11, fontWeight:800, color:'#94a3b8', marginTop:12}}>AMBIL FOTO BUKTI</p></div>}
                          </div>
                          <textarea placeholder="Berikan alasan detail di sini..." value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} style={{ height:140, padding:20, borderRadius:20, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontWeight:700, fontSize:14 }} />
                          <button onClick={handleLeaveSubmit} disabled={isSubmittingLeave} style={{ height:64, borderRadius:22, background:'#0f172a', color:'white', fontWeight:1000, fontSize:15, marginTop:10 }}>{isSubmittingLeave?'MENGIRIM...':'KIRIM SEKARANG'}</button>
                       </div>
                    ) : (
                       <div style={{ textAlign:'center', padding:60 }}>
                          <div style={{ width:80, height:80, borderRadius:'50%', background:'#f0fdf4', color:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}><CheckIcon size={40} /></div>
                          <h3 style={{ fontWeight:1000 }}>Terkirim!</h3>
                          <p style={{ color:'#64748b' }}>Pengajuan Anda sedang diproses.</p>
                       </div>
                    )}
                 </motion.div>
              </div>
           )}

           {showFriendModal && (
              <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(5px)', zIndex:2000, display:'flex', alignItems:'flex-end' }}>
                 <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }} style={{ width:'100%', maxWidth:480, height:'92%', background:'white', borderRadius:'36px 36px 0 0', padding:32, display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:28 }}>
                       <h3 style={{ fontWeight:1000 }}>Bantu Absen Teman</h3>
                       <button onClick={()=>setShowFriendModal(false)} style={{ background:'#f1f5f9', border:'none', width:44, height:44, borderRadius:14 }}><XIcon size={20}/></button>
                    </div>
                    
                    {!selectedFriend ? (
                       <>
                          <div style={{ position:'relative', marginBottom:20 }}>
                             <SearchIcon size={20} style={{ position:'absolute', left:20, top:20, color:'#94a3b8' }} />
                             <input placeholder="Cari nama teman..." value={friendSearch} onChange={e=>setFriendSearch(e.target.value)} style={{ width:'100%', height:60, padding:'0 20px 0 54px', borderRadius:18, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontWeight:700 }} />
                          </div>
                          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
                             {allStaff.filter(s => s.full_name.toLowerCase().includes(friendSearch.toLowerCase()) && s.id !== loggedInUser.id).map(s => (
                                <button key={s.id} onClick={()=>setSelectedFriend(s)} style={{ padding:20, borderRadius:18, border:'1px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                   <b style={{fontWeight:800}}>{s.full_name}</b>
                                   <ChevronRightIcon size={18} color="#94a3b8" />
                                </button>
                             ))}
                          </div>
                       </>
                    ) : (
                       <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                          <div style={{ padding:20, background:'#f8fafc', borderRadius:20, display:'flex', justifyContent:'space-between' }}>
                             <div><p style={{fontSize:10, color:'#94a3b8', fontWeight:800, margin:0}}>KARYAWAN TERPILIH</p><b style={{fontSize:18, fontWeight:1000}}>{selectedFriend.full_name}</b></div>
                             <button onClick={()=>setSelectedFriend(null)} style={{ background:'none', border:'none', color:'#2563eb', fontWeight:900, fontSize:12 }}>GANTI</button>
                          </div>
                          <div onClick={()=>startCamera('friend')} style={{ height:240, border:'2px dashed #e2e8f0', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'#f8fafc' }}>
                             {friendPhoto ? <img src={friendPhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{textAlign:'center'}}><CameraIcon size={32} color="#cbd5e1" /><p style={{fontSize:11, fontWeight:800, color:'#94a3b8', marginTop:12}}>AMBIL FOTO TEMAN</p></div>}
                          </div>
                          <button onClick={handleFriendAttendance} disabled={isSubmittingFriendAtt} style={{ height:64, borderRadius:22, background:'#2563eb', color:'white', fontWeight:1000, fontSize:15, marginTop:10 }}>{isSubmittingFriendAtt?'MENGIRIM...':'KONFIRMASI ABSEN'}</button>
                       </div>
                    )}
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {showCamera && (
          <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
            <video ref={videoRef} autoPlay playsInline style={{ flex: 1, objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 40px' }}>
              <button onClick={() => setShowCamera(false)} style={{ width:60, height:60, borderRadius:20, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(10px)', color:'white', border:'none' }}><XIcon size={24} /></button>
              <button onClick={capturePhoto} style={{ width:84, height:84, background:'#ffffff', borderRadius:'50%', border:'8px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><CameraIcon size={32} color="#2563eb" /></button>
              <div style={{width:60}}></div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
      </div>
    </div>
  );
}
