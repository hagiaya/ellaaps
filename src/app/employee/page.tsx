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

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'payslips' | 'history'>('attendance');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Dashboard Stats
  const [stats, setStats] = useState({ total_salary: 0, attendance: 0, production_kg: 0 });
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkOutDone, setCheckOutDone] = useState(false);

  // Modals & Flows
  const [showProfile, setShowProfile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<'in' | 'out' | 'leave' | 'friend'>('in');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState<'Izin' | 'Sakit' | 'Cuti'>('Izin');
  const [leaveReason, setLeaveReason] = useState('');
  const [leavePhoto, setLeavePhoto] = useState<string | null>(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Data History
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [productionHistory, setProductionHistory] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  
  // Production Entry
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
      setAttendanceToday(data);
      setCheckInDone(!!data.check_in);
      setCheckOutDone(!!data.check_out);
    }
  };

  const fetchMonthlyStats = async (staffId: string, user: any) => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    const { data: att } = await supabase.from('attendance_logs').select('*').eq('staff_id', staffId).gte('date', firstDay);
    const { data: prod } = await supabase.from('production_logs').select('*').eq('staff_id', staffId).gte('date', firstDay);
    const { data: kasbon } = await supabase.from('staff_kasbon').select('*').eq('staff_id', staffId).gte('date', firstDay);
    
    if (att) setAttendanceHistory(att.sort((a,b) => b.date.localeCompare(a.date)));
    if (prod) setProductionHistory(prod.sort((a,b) => b.date.localeCompare(a.date)));

    const BASE_SALARY = user.base_salary || 2000000;
    const DAILY_RATE = Math.floor(BASE_SALARY / 26);
    const TARGET_KG = 2; 
    const BONUS_RATE = 25000; 

    let totalCollected = 0;
    if (att) totalCollected += att.length * DAILY_RATE;
    if (prod) {
      prod.forEach(p => {
        const excess = Math.max(0, (Number(p.weight_kg) || 0) - TARGET_KG);
        totalCollected += Math.floor(excess * BONUS_RATE);
      });
    }
    if (kasbon) {
      kasbon.forEach(k => {
        totalCollected -= Number(k.amount);
      });
    }

    setStats({
      total_salary: totalCollected,
      attendance: att?.length || 0,
      production_kg: prod?.reduce((acc, p) => acc + (Number(p.weight_kg) || 0), 0) || 0
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const { data, error } = await supabase.from('staff').select('*').eq('username', loginForm.username).eq('password_hash', loginForm.password).single();
    if (data) {
      localStorage.setItem('ela_user', JSON.stringify(data));
      setLoggedInUser(data);
      fetchAllData(data.id, data);
    } else {
      alert("Username atau Password Salah!");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    if (confirm("Logout dari aplikasi?")) {
      localStorage.removeItem('ela_user');
      setLoggedInUser(null);
      setShowProfile(false);
    }
  };

  const startCamera = async (type: 'in' | 'out' | 'leave' | 'friend') => {
    setCameraType(type);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Gagal mengakses kamera.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const photo = canvasRef.current.toDataURL('image/jpeg');
      
      if (cameraType === 'leave') setLeavePhoto(photo);
      else setCapturedPhoto(photo);
      
      if (videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
      if (cameraType === 'in' || cameraType === 'out') handleAttendance(photo);
    }
  };

  const uploadToCloudinary = async (base64: string) => {
    try {
      const formData = new FormData();
      formData.append("file", base64);
      formData.append("upload_preset", "ellacakes");
      const res = await fetch(`https://api.cloudinary.com/v1_1/dmjpjmece/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      return null;
    }
  };

  const handleAttendance = async (photo: string) => {
    setIsSubmitting(true);
    const photoUrl = await uploadToCloudinary(photo);
    if (!photoUrl) {
      alert("Gagal upload foto.");
      setIsSubmitting(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    if (cameraType === 'in') {
      await supabase.from('attendance_logs').insert({ staff_id: loggedInUser.id, date: today, check_in: now, photo_in: photoUrl });
    } else {
      await supabase.from('attendance_logs').update({ check_out: now, photo_out: photoUrl }).eq('staff_id', loggedInUser.id).eq('date', today);
    }
    fetchTodayStatus(loggedInUser.id);
    setIsSubmitting(false);
  };

  const handleLeaveSubmit = async () => {
    if (!leaveReason || !leavePhoto) return;
    setIsSubmittingLeave(true);
    const photoUrl = await uploadToCloudinary(leavePhoto);
    if (photoUrl) {
      await supabase.from('leave_requests').insert({ staff_id: loggedInUser.id, type: leaveType, reason: leaveReason, photo_proof: photoUrl, date: new Date().toISOString().split('T')[0], status: 'pending' });
      setLeaveSubmitted(true);
      setTimeout(() => { setShowLeaveForm(false); setLeaveSubmitted(false); setLeaveReason(''); setLeavePhoto(null); }, 2000);
    }
    setIsSubmittingLeave(false);
  };

  const saveProduction = async () => {
    if (!currentRecipe || (!counts.mika && !counts.sedang && !counts.besar)) return;
    setIsSavingProduction(true);
    try {
      await supabase.from('production_logs').insert({ staff_id: loggedInUser.id, recipe: currentRecipe, weight_kg: Number(currentWeight) || 0, mika: Number(counts.mika) || 0, sedang: Number(counts.sedang) || 0, besar: Number(counts.besar) || 0, date: new Date().toISOString().split('T')[0] });
      alert("Produksi tersimpan!");
      setCounts({ mika: '', sedang: '', besar: '' }); setCurrentRecipe(''); setCurrentWeight('');
      fetchMonthlyStats(loggedInUser.id, loggedInUser);
    } catch (err: any) { alert(err.message); }
    setIsSavingProduction(false);
  };

  if (!isMounted) return null;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: '#ffffff', minHeight: '100vh', position: 'relative', boxShadow: '0 0 50px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#ffffff', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
              <ZapIcon size={20} color="white" />
            </div>
            <h1 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: '#0f172a' }}>ElaApp Mobile</h1>
          </div>
          {loggedInUser && <button onClick={() => setShowProfile(true)} style={{ background: 'none', border: 'none', color: '#64748b' }}><UserIcon size={20} /></button>}
        </div>

        <div style={{ flex: 1, padding: '10px 20px 120px 20px', overflowY: 'auto' }}>
          {!loggedInUser ? (
             <div style={{ padding:'40px', textAlign:'center' }}>
                <div style={{ width:64, height:64, background:'#000', color:'white', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}><LockIcon size={30} /></div>
                <h2 style={{ fontSize:'24px', fontWeight:950, marginBottom:8 }}>Portal Pegawai</h2>
                <p style={{ color:'#64748b', marginBottom:32 }}>Silakan masuk untuk akses absensi & gaji.</p>
                <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16, textAlign:'left' }}>
                   <div>
                      <label style={{ fontSize:10, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', marginBottom:8, display:'block' }}>Username</label>
                      <input type="text" placeholder="username..." value={loginForm.username} onChange={e=>setLoginForm({...loginForm, username:e.target.value})} style={{ width:'100%', height:52, padding:'0 16px', borderRadius:14, border:'1px solid #e2e8f0', fontWeight:700 }} />
                   </div>
                   <div style={{ marginBottom:16 }}>
                      <label style={{ fontSize:10, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', marginBottom:8, display:'block' }}>Password</label>
                      <input type="password" placeholder="******" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password:e.target.value})} style={{ width:'100%', height:52, padding:'0 16px', borderRadius:14, border:'1px solid #e2e8f0', fontWeight:700 }} />
                   </div>
                   <button type="submit" disabled={isLoggingIn} style={{ height:56, borderRadius:16, background:'#000', color:'white', fontWeight:950, border:'none', fontSize:14 }}>{isLoggingIn ? 'MEMVERIFIKASI...' : 'MASUK SEKARANG'}</button>
                </form>
             </div>
          ) : (
             <div style={{ display:'flex', flexDirection:'column', gap: 24 }}>
               {activeTab === 'attendance' && (
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', gap: 24 }}>
                     <div style={{ padding: '24px', background: '#2563eb', borderRadius: '24px', color: 'white' }}>
                        <p style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8, marginBottom: 8 }}>ESTIMASI GAJI BULAN INI</p>
                        <h3 style={{ fontSize: '28px', fontWeight: 950, margin: 0 }}>Rp {stats.total_salary.toLocaleString('id-ID')}</h3>
                        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                           <div style={{ flex:1, padding:12, background:'rgba(255,255,255,0.1)', borderRadius:12 }}><p style={{fontSize:9, margin:0, opacity:0.8}}>HADIR</p><b style={{fontSize:14}}>{stats.attendance} Hari</b></div>
                           <div style={{ flex:1, padding:12, background:'rgba(255,255,255,0.1)', borderRadius:12 }}><p style={{fontSize:9, margin:0, opacity:0.8}}>PRODUKSI</p><b style={{fontSize:14}}>{stats.production_kg.toFixed(1)} Kg</b></div>
                        </div>
                     </div>

                     <div style={{ display:'flex', gap: 12 }}>
                        {!checkInDone ? (
                           <button onClick={()=>startCamera('in')} style={{ flex:1, height:140, borderRadius:24, background:'#ffffff', border:'2px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                              <div style={{ width:48, height:48, borderRadius:'50%', background:'#f0fdf4', color:'#10b981', display:'flex', alignItems:'center', justifyContent:'center' }}><ClockIcon size={24}/></div>
                              <span style={{ fontSize:13, fontWeight:900 }}>MASUK</span>
                           </button>
                        ) : !checkOutDone ? (
                           <button onClick={()=>startCamera('out')} style={{ flex:1, height:140, borderRadius:24, background:'#ffffff', border:'2px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                              <div style={{ width:48, height:48, borderRadius:'50%', background:'#fef2f2', color:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center' }}><LogOutIcon size={24}/></div>
                              <span style={{ fontSize:13, fontWeight:900 }}>PULANG</span>
                           </button>
                        ) : (
                           <div style={{ flex:1, height:140, borderRadius:24, background:'#f0fdf4', border:'2px solid #10b981', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                              <div style={{ width:48, height:48, borderRadius:'50%', background:'#ffffff', color:'#10b981', display:'flex', alignItems:'center', justifyContent:'center' }}><CheckIcon size={24}/></div>
                              <span style={{ fontSize:13, fontWeight:900, color:'#10b981' }}>SELESAI</span>
                           </div>
                        )}
                        <button onClick={() => setShowLeaveForm(true)} style={{ flex:1, height:140, borderRadius:24, background:'#ffffff', border:'2px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                           <div style={{ width:48, height:48, borderRadius:'50%', background:'#f8fafc', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center' }}><CalendarIcon size={24}/></div>
                           <span style={{ fontSize:13, fontWeight:900 }}>IJIN / SAKIT</span>
                        </button>
                     </div>

                     <div style={{ background:'white', borderRadius:24, padding:24, border:'1px solid #e2e8f0' }}>
                        <h4 style={{ margin:'0 0 20px 0', fontSize:14, fontWeight:900 }}>LAPOR HASIL PRODUKSI</h4>
                        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <select value={currentRecipe} onChange={e=>setCurrentRecipe(e.target.value)} style={{ height:52, padding:'0 16px', borderRadius:14, border:'1px solid #e2e8f0', fontWeight:700 }}>
                              <option value="">-- Pilih Resep --</option>
                              {recipes.map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                           <input type="number" placeholder="Total Berat (Kg)" value={currentWeight} onChange={e=>setCurrentWeight(e.target.value)} style={{ height:52, padding:'0 16px', borderRadius:14, border:'1px solid #e2e8f0', fontWeight:700 }} />
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                              <input placeholder="Mika" value={counts.mika} onChange={e=>setCounts({...counts, mika:e.target.value})} style={{ height:52, padding:'0 10px', borderRadius:14, border:'1px solid #e2e8f0', textAlign:'center', fontWeight:700 }} />
                              <input placeholder="Sedang" value={counts.sedang} onChange={e=>setCounts({...counts, sedang:e.target.value})} style={{ height:52, padding:'0 10px', borderRadius:14, border:'1px solid #e2e8f0', textAlign:'center', fontWeight:700 }} />
                              <input placeholder="Besar" value={counts.besar} onChange={e=>setCounts({...counts, besar:e.target.value})} style={{ height:52, padding:'0 10px', borderRadius:14, border:'1px solid #e2e8f0', textAlign:'center', fontWeight:700 }} />
                           </div>
                           <button onClick={saveProduction} disabled={isSavingProduction} style={{ height:56, borderRadius:16, background:'#0f172a', color:'white', fontWeight:950, border:'none' }}>{isSavingProduction ? 'MENYIMPAN...' : 'SIMPAN PRODUKSI'}</button>
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'payslips' && (
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', gap: 20 }}>
                     <h2 style={{ fontSize: 20, fontWeight: 950, margin: 0 }}>Slip Gaji</h2>
                     {payslips.map(ps => (
                        <div key={ps.id} style={{ padding: 24, background: 'white', borderRadius: 24, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', gap: 12 }}>
                                 <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><WalletIcon size={20}/></div>
                                 <div>
                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900 }}>Gaji {new Date(ps.year, ps.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h4>
                                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(ps.created_at).toLocaleDateString()}</span>
                                 </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <p style={{ margin: 0, fontWeight: 950, fontSize: 16, color: '#10b981' }}>Rp {ps.total_net_salary.toLocaleString('id-ID')}</p>
                                 <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981' }}>TREANSIFERED</span>
                              </div>
                           </div>
                           {ps.payment_proof_url && <button onClick={() => window.open(ps.payment_proof_url, '_blank')} style={{ height:48, borderRadius:12, background:'#f1f5f9', border:'none', fontWeight:900, fontSize:12 }}><FileTextIcon size={16}/> LIHAT BUKTI</button>}
                        </div>
                     ))}
                     {payslips.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Belum ada data.</div>}
                  </motion.div>
               )}

               {activeTab === 'history' && (
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', gap: 24 }}>
                     <div>
                        <h4 style={{ margin:'0 0 16px 0', fontSize:14, fontWeight:900 }}>RIWAYAT ABSENSI</h4>
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                           {attendanceHistory.map(h => (
                              <div key={h.id} style={{ padding:16, background:'white', borderRadius:16, border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                 <div>
                                    <p style={{ margin:0, fontWeight:900, fontSize:13 }}>{new Date(h.date).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' })}</p>
                                    <p style={{ margin:0, fontSize:11, color:'#64748b' }}>{h.check_in ? new Date(h.check_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'} - {h.check_out ? new Date(h.check_out).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Belum Pulang'}</p>
                                 </div>
                                 <div style={{ width:32, height:32, borderRadius:8, background:h.check_out ? '#f0fdf4':'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    {h.check_out ? <CheckIcon size={16} color="#10b981"/> : <ClockIcon size={16} color="#f59e0b"/>}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div>
                        <h4 style={{ margin:'0 0 16px 0', fontSize:14, fontWeight:900 }}>RIWAYAT PRODUKSI</h4>
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                           {productionHistory.map(p => (
                              <div key={p.id} style={{ padding:16, background:'white', borderRadius:16, border:'1px solid #e2e8f0' }}>
                                 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                                    <b style={{ fontSize:14 }}>{p.recipe}</b>
                                    <span style={{ fontSize:14, fontWeight:950, color:'#2563eb' }}>{p.weight_kg} Kg</span>
                                 </div>
                                 <div style={{ display:'flex', gap:12, fontSize:11, color:'#64748b' }}>
                                    <span>Mika: {p.mika}</span>
                                    <span>Sedang: {p.sedang}</span>
                                    <span>Besar: {p.besar}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </motion.div>
               )}
             </div>
          )}
        </div>

        {/* Bottom Nav */}
        {loggedInUser && (
           <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 48px)', maxWidth: 432, height: 72, background: '#0f172a', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 1000 }}>
              {[
                { id:'attendance', label:'Dashboard', icon: ZapIcon },
                { id:'payslips', label:'Slip Gaji', icon: WalletIcon },
                { id:'history', label:'Riwayat', icon: HistoryIcon }
              ].map(item => (
                 <button key={item.id} onClick={()=>setActiveTab(item.id as any)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', color: activeTab === item.id ? '#ffffff':'#64748b' }}>
                    <item.icon size={22} /><span style={{ fontSize: 10, fontWeight: 900 }}>{item.label}</span>
                 </button>
              ))}
           </div>
        )}

        {/* Overlays */}
        <AnimatePresence>
           {showProfile && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', justifyContent:'flex-end' }}>
                 <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }} style={{ width:'320px', height:'100%', background:'white', padding:40, display:'flex', flexDirection:'column', gap:32 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                       <h3 style={{ margin:0 }}>Akun Saya</h3>
                       <button onClick={()=>setShowProfile(false)} style={{ background:'none', border:'none' }}><XIcon size={24}/></button>
                    </div>
                    <div style={{ textAlign:'center' }}>
                       <div style={{ width:100, height:100, borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                          {loggedInUser?.profile_photo_url ? <img src={loggedInUser.profile_photo_url} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : <UserIcon size={48}/>}
                       </div>
                       <h4 style={{ margin:0 }}>{loggedInUser?.full_name}</h4>
                       <p style={{ color:'#94a3b8' }}>{loggedInUser?.role?.toUpperCase()}</p>
                    </div>
                    <button onClick={handleLogout} style={{ marginTop:'auto', height:56, borderRadius:16, border:'1px solid #ef4444', color:'#ef4444', fontWeight:900, background:'none' }}>LOGOUT AKUN</button>
                 </motion.div>
              </div>
           )}

           {showLeaveForm && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'flex-end' }}>
                 <motion.div initial={{ y:'100%' }} animate={{ y:0 }} style={{ width:'100%', maxWidth:480, height:'90%', background:'white', borderRadius:'32px 32px 0 0', padding:32, overflowY:'auto' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:32 }}>
                       <h3>Ijin / Sakit / Cuti</h3>
                       <button onClick={()=>setShowLeaveForm(false)} style={{ background:'none', border:'none' }}><XIcon size={24}/></button>
                    </div>
                    {!leaveSubmitted ? (
                       <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                          <div style={{ display:'flex', gap:10 }}>
                             {['Izin','Sakit','Cuti'].map(t => <button key={t} onClick={()=>setLeaveType(t as any)} style={{ flex:1, height:48, borderRadius:12, border:leaveType===t?'2px solid #0f172a':'1px solid #e2e8f0', background:leaveType===t?'#0f172a':'white', color:leaveType===t?'white':'#64748b', fontWeight:900 }}>{t}</button>)}
                          </div>
                          <div onClick={()=>startCamera('leave')} style={{ height:180, border:'2px dashed #e2e8f0', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                             {leavePhoto ? <img src={leavePhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : 'FOTO BUKTI / SURAT'}
                          </div>
                          <textarea placeholder="Alasan detail..." value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} style={{ height:120, padding:16, borderRadius:16, border:'1px solid #e2e8f0', fontWeight:700 }} />
                          <button onClick={handleLeaveSubmit} disabled={isSubmittingLeave} style={{ height:60, borderRadius:18, background:'#0f172a', color:'white', fontWeight:950 }}>{isSubmittingLeave?'MENGIRIM...':'KIRIM PENGAJUAN'}</button>
                       </div>
                    ) : (
                       <div style={{ textAlign:'center', padding:40 }}>
                          <CheckIcon size={48} color="#10b981" />
                          <h3>Terkirim!</h3>
                       </div>
                    )}
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {showCamera && (
          <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
            <video ref={videoRef} autoPlay playsInline style={{ flex: 1, objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => setShowCamera(false)} style={{ padding: '16px 24px', color: 'white' }}>BATAL</button>
              <button onClick={capturePhoto} style={{ padding: '16px 48px', background: '#ffffff', borderRadius: 50, border:'none' }}><CameraIcon size={32}/></button>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
      </div>
    </div>
  );
}
