"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, MapPin, CheckCircle, Clock, ChefHat, LogOut, 
  FileText, ArrowRight, X, LogIn, Calendar, Umbrella, 
  Home, User, Bell, LayoutGrid, Check, Info, FileImage, Users, Search, ShieldCheck, Lock,
  Wallet, History
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/DashboardCard";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Cloudinary Constants (User provided)
const CLOUDINARY_CLOUD_NAME = "dmjpjmece";
const CLOUDINARY_UPLOAD_PRESET = "ellacakes";

export default function EmployeePortal() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'task' | 'payroll' | 'history'>('attendance');
  const [isMounted, setIsMounted] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ todayEst: 0, collected: 0, base: 0 });


  const fetchEmployees = async () => {
     const { data } = await supabase.from('staff').select('*').order('full_name');
     if (data) setEmployees(data);
  };

  const fetchRecipes = async () => {
     const { data } = await supabase.from('products').select('name').order('name');
     if (data) setRecipes(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const { data, error } = await supabase
       .from('staff')
       .select('*')
       .eq('username', loginForm.username)
       .eq('password_hash', loginForm.password)
       .single();

    if (data) {
       setLoggedInUser(data);
       localStorage.setItem('ELA_STAFF_AUTH', JSON.stringify(data));
       fetchTodayStatus(data.id);
       fetchMonthlyStats(data.id);
    } else {
       alert("Username atau kata sandi salah!");
    }
    setIsLoggingIn(false);
  };

  const fetchMonthlyStats = async (staffId: string) => {
     const today = new Date().toISOString().split('T')[0];
     const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
     
     // 1. Fetch Production for bonus
     const { data: prod } = await supabase.from('production_logs').select('*').eq('staff_id', staffId).gte('date', firstDay);
     // 2. Fetch Attendance for daily fee
     const { data: att } = await supabase.from('attendance_logs').select('*').eq('staff_id', staffId).gte('date', firstDay);
     
     const DAILY_RATE = 75000;
     const TARGET_KG = 2;
     const BONUS_PER_KG = 25000;

     let collected = 0;
     let todayEst = 0;

     if (att) {
        const uniqueDays = new Set(att.map(a => a.date)).size;
        collected += (uniqueDays * DAILY_RATE);
        
        const hasAttendedToday = att.find(a => a.date === today);
        if (hasAttendedToday) todayEst += DAILY_RATE;
     }

     if (prod) {
        prod.forEach(p => {
           const excess = Math.max(0, (Number(p.weight_kg) || 0) - TARGET_KG);
           const bonus = excess * BONUS_PER_KG;
           collected += bonus;
           if (p.date === today) todayEst += bonus;
        });
     }

     setMonthlyStats({ 
        todayEst, 
        collected, 
        base: Number(loggedInUser?.base_salary || 2000000) 
     });
  };

  const fetchTodayStatus = async (staffId: string) => {
     const today = new Date().toISOString().split('T')[0];
     const { data } = await supabase.from('attendance_logs').select('*').eq('staff_id', staffId).eq('date', today).single();
     if (data) {
        if (data.check_in) {
           setCheckInDone(true);
           setPhotoIn(data.photo_in);
        }
        if (data.check_out) {
           setCheckOutDone(true);
           setPhotoOut(data.photo_out);
        }
     }
  };

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar?")) {
       localStorage.removeItem('ELA_STAFF_AUTH');
       setLoggedInUser(null);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchEmployees();
    fetchRecipes();
    const saved = localStorage.getItem('ELA_STAFF_AUTH');
    if (saved) {
       const user = JSON.parse(saved);
       setLoggedInUser(user);
       fetchTodayStatus(user.id);
       fetchMonthlyStats(user.id);
    }
  }, []);

  // Helper: Upload to Cloudinary
  const uploadToCloudinary = async (base64Data: string): Promise<string | null> => {
    try {
       const formData = new FormData();
       formData.append("file", base64Data);
       formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 
       
       const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData
       });
       
       const data = await res.json();
       if (!res.ok) {
          console.error("Cloudinary Error Response:", data);
          return null;
       }
       return data.secure_url || null;
    } catch (e) {
       console.error("Cloudinary connection error:", e);
       return null;
    }
  };
  
  // Attendance State
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkOutDone, setCheckOutDone] = useState(false);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraSession, setCameraSession] = useState<'in' | 'out' | 'leave' | 'friend'>('in');
  const [photoIn, setPhotoIn] = useState<string | null>(null);
  const [photoOut, setPhotoOut] = useState<string | null>(null);
  
  // Leave/Cuti State
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState<'Izin' | 'Sakit' | 'Cuti'>('Izin');
  const [leavePhoto, setLeavePhoto] = useState<string | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Production State
  const [productionList, setProductionList] = useState<any[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [counts, setCounts] = useState({ mika: '', sedang: '', besar: '' });
  const [isSavingProduction, setIsSavingProduction] = useState(false);
  
  // Friend Attendance State
  const [showFriendAttendance, setShowFriendAttendance] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<any>(null);
  const [friendPhoto, setFriendPhoto] = useState<string | null>(null);
  const [isSubmittingFriend, setIsSubmittingFriend] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async (session: 'in' | 'out' | 'leave' | 'friend') => {
    setCameraSession(session);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("Akses kamera gagal."); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/jpeg');
        if (cameraSession === 'in') setPhotoIn(photoData);
        else if (cameraSession === 'out') setPhotoOut(photoData);
        else if (cameraSession === 'friend') setFriendPhoto(photoData);
        else setLeavePhoto(photoData);
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const SHOP_LAT = 0.5369; // Koordinat Jl. Dj. Buloto, Gorontalo
  const SHOP_LON = 123.0592;
  const DISTANCE_LIMIT = 200; // Meter

  const handleAttendance = async (type: 'in' | 'out') => {
     if (isSubmittingAttendance) return;
     const photo = type === 'in' ? photoIn : photoOut;
     if (!photo) return alert("Ambil foto terlebih dahulu!");

     setIsSubmittingAttendance(true);

     // 0. Check Location
     const getLocation = (): Promise<GeolocationPosition> => new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
     });

     try {
        const pos = await getLocation();
        const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, SHOP_LAT, SHOP_LON);
        
        if (dist > DISTANCE_LIMIT) {
           alert(`❌ GAGAL ABSEN!\n\nANDA TIDAK DI LOKASI KERJA!\nJarak Anda: ${Math.round(dist)}m dari toko.\n\nHarap berada di radius 200m dari Jl. Dj. Buloto.`);
           setIsSubmittingAttendance(false);
           return;
        }
     } catch (err: any) {
        let msg = "Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin diberikan.";
        if (err.code === 1) msg = "Izin lokasi ditolak. Harap izinkan akses GPS di pengaturan browser Anda.";
        alert(msg);
        setIsSubmittingAttendance(false);
        return;
     }

     // 1. Upload Cloudinary
     const cloudUrl = await uploadToCloudinary(photo);
     if (!cloudUrl) {
        alert("Gagal mengunggah foto. Periksa koneksi atau api-preset.");
        setIsSubmittingAttendance(false);
        return;
     }

     // 2. Save to Supabase
     const today = new Date().toISOString().split('T')[0];
     const now = new Date().toISOString();
     
     if (type === 'in') {
        const { error } = await supabase.from('attendance_logs').upsert({
           staff_id: loggedInUser.id,
           date: today,
           check_in: now,
           photo_in: cloudUrl
        }, { onConflict: 'staff_id,date' });
        if (!error) {
            setCheckInDone(true);
            fetchMonthlyStats(loggedInUser.id);
        }
     } else {
        const { error } = await supabase.from('attendance_logs').update({
           check_out: now,
           photo_out: cloudUrl
        }).eq('staff_id', loggedInUser.id).eq('date', today);
        if (!error) {
            setCheckOutDone(true);
            fetchMonthlyStats(loggedInUser.id);
        }
     }
     
     setIsSubmittingAttendance(false);
  };

  const handleFriendAttendance = async () => {
     if (!friendPhoto || !selectedFriend) return alert("Pilih teman & ambil foto!");
     setIsSubmittingFriend(true);
     const cloudUrl = await uploadToCloudinary(friendPhoto);
     if (!cloudUrl) return setIsSubmittingFriend(false);

     const today = new Date().toISOString().split('T')[0];
     const now = new Date().toISOString();
     
     if (!friendStatus) {
        // Friend hasn't checked in yet
        const { error } = await supabase.from('attendance_logs').upsert({
           staff_id: selectedFriend.id,
           date: today,
           check_in: now,
           photo_in: cloudUrl
        }, { onConflict: 'staff_id,date' });
        if (!error) alert(`Sukses absen MASUK ${selectedFriend.full_name}!`);
     } else {
        // Friend already in, now help them check out
        const { error } = await supabase.from('attendance_logs').update({
           check_out: now,
           photo_out: cloudUrl
        }).eq('staff_id', selectedFriend.id).eq('date', today);
        if (!error) alert(`Sukses absen PULANG ${selectedFriend.full_name}!`);
     }

     setShowFriendAttendance(false);
     setSelectedFriend(null);
     setFriendStatus(null);
     setFriendSearch('');
     setFriendPhoto(null);
     setIsSubmittingFriend(false);
  };

   const handleLeaveSubmit = async () => {
      if (!leaveReason) return alert("Harap isi alasan pengajuan!");
      if (!leavePhoto) return alert("WAJIB LAMPIRKAN FOTO!\n\nHarap ambil foto bukti (surat dokter/ijin) sebagai lampiran.");
      
      setIsSubmittingLeave(true);
      const cloudUrl = await uploadToCloudinary(leavePhoto);
      if (!cloudUrl) {
         alert("Gagal mengunggah foto. Periksa koneksi.");
         setIsSubmittingLeave(false);
         return;
      }

      const { error } = await supabase.from('leave_requests').insert({
         staff_id: loggedInUser.id,
         type: leaveType,
         reason: leaveReason,
         photo_proof: cloudUrl,
         status: 'pending',
         date: new Date().toISOString().split('T')[0]
      });

      if (!error) {
         setLeaveSubmitted(true);
         alert("Pengajuan Berhasil Dikirim!");
         setTimeout(() => {
           setShowLeaveForm(false);
           setLeaveSubmitted(false);
           setLeaveReason('');
           setLeavePhoto(null);
         }, 2000);
      } else {
         alert("Gagal kirim: " + error.message);
      }
      setIsSubmittingLeave(false);
   };

  const saveProduction = async () => {
    if (!currentRecipe) return;
    if (!counts.mika && !counts.sedang && !counts.besar) return;
    
    setIsSavingProduction(true);
    const { error } = await supabase.from('production_logs').insert({
       staff_id: loggedInUser.id,
       recipe: currentRecipe,
       weight_kg: Number(currentWeight) || 0,
       mika: Number(counts.mika) || 0,
       sedang: Number(counts.sedang) || 0,
       besar: Number(counts.besar) || 0,
       date: new Date().toISOString().split('T')[0]
    });

    if (!error) {
       alert("Laporan produksi tersimpan!");
       setCounts({ mika: '', sedang: '', besar: '' });
       setCurrentRecipe('');
       setCurrentWeight('');
       fetchMonthlyStats(loggedInUser.id);
    }
    setIsSavingProduction(false);
  };

  if (!isMounted) return null;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: '#ffffff', minHeight: '100vh', position: 'relative', boxShadow: '0 0 50px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header App Bar */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#ffffff', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
              <Image src="/logo.png" alt="Logo" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <h1 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: '#0f172a' }}>ElaApp Mobile</h1>
          </div>
          {loggedInUser && (
            <div style={{ display: 'flex', gap: 12 }}>
               <button onClick={() => alert("Notification Center - Coming Soon")} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Bell size={20} /></button>
               <button onClick={() => setShowProfile(true)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><User size={20} /></button>
            </div>
          )}
        </div>

        {/* Content Body Area */}
        <div style={{ flex: 1, padding: '10px 20px 120px 20px', overflowY: 'auto' }}>
           {!loggedInUser ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ width: 80, height: 80, borderRadius: 24, background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                      <Lock size={32} />
                   </div>
                   <h2 style={{ fontSize: '24px', fontWeight: 950, margin: 0 }}>Login Staf El-App</h2>
                   <p style={{ fontSize: '14px', color: '#64748b', marginTop: 8 }}>Akses portal absensi & produksi mandiri.</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>NAMA PENGGUNA (USERNAME)</label>
                      <input type="text" required value={loginForm.username || ''} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="input-field" placeholder="Ketik username..." style={{ height: 56, padding: '0 20px', borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, width: '100%' }} />
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>KATA SANDI</label>
                      <input type="password" required value={loginForm.password || ''} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="input-field" placeholder="******" style={{ height: 56, padding: '0 20px', borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, width: '100%' }} />
                   </div>
                   <button type="submit" disabled={isLoggingIn} style={{ width: '100%', height: 60, background: '#0f172a', color: 'white', border: 'none', borderRadius: 18, fontWeight: 950, fontSize: '15px', marginTop: 12, cursor: 'pointer' }}>
                     {isLoggingIn ? 'MEMVERIFIKASI...' : 'MASUK KE PORTAL'}
                   </button>
                </form>
             </motion.div>
           ) : (
             <AnimatePresence mode="wait">
               {activeTab === 'attendance' && (
                 <motion.div key="att" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderRadius: '24px', color: 'white' }}>
                       <p style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8, marginBottom: 8 }}>STATUS HARI INI</p>
                       <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{checkInDone ? 'Bekerja Aktif' : 'Menunggu Absensi'}</h3>
                       <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', fontWeight: 700 }}><Clock size={14} /> Berjalan / Aktif</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                       <button onClick={() => setShowFriendAttendance(!showFriendAttendance)} style={{ padding: '10px 20px', borderRadius: '20px', border: '2px solid #e2e8f0', background: showFriendAttendance ? '#0f172a' : '#ffffff', color: showFriendAttendance ? '#ffffff' : '#0f172a', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                         <Users size={16} /> {showFriendAttendance ? 'TUTUP ABSEN TEMAN' : 'BANTU ABSEN TEMAN'}
                       </button>
                    </div>

                    {showFriendAttendance ? (
                       <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '32px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div style={{ textAlign: 'center' }}>
                             <h4 style={{ fontSize: '15px', fontWeight: 950, margin: 0 }}>Cari & Pilih Teman</h4>
                             <p style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>Bantu rekan Anda melakukan absensi masuk.</p>
                          </div>
                          <div style={{ position: 'relative' }}>
                             <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                             <input type="text" placeholder="Ketik nama karyawan..." value={friendSearch || ''} onChange={(e) => setFriendSearch(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1px solid #e1e8f0', background: '#ffffff', fontWeight: 700, fontSize: '14px' }} />
                          </div>
                          {friendSearch && !selectedFriend && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                               {employees.filter(e => e.full_name.toLowerCase().includes(friendSearch.toLowerCase()) && e.id !== loggedInUser.id).map(e => (
                                 <button key={e.id} onClick={async () => {
                                     setSelectedFriend(e);
                                     const today = new Date().toISOString().split('T')[0];
                                     const { data } = await supabase.from('attendance_logs').select('*').eq('staff_id', e.id).eq('date', today).single();
                                     setFriendStatus(data);
                                 }} style={{ width: '100%', padding: '16px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', textAlign: 'left', fontWeight: 750, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {e.full_name}<ArrowRight size={14} color="#2563eb" />
                                 </button>
                               ))}
                            </div>
                          )}
                          {selectedFriend && (
                             <div style={{ background: '#ffffff', padding: '24px', borderRadius: '24px', textAlign: 'center', border: '2px solid #2563eb', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                                   <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950 }}>{selectedFriend.full_name.charAt(0)}</div>
                                   <span style={{ fontWeight: 950, fontSize: '16px' }}>{selectedFriend.full_name}</span>
                                </div>
                                <div onClick={() => !isSubmittingFriend && startCamera('friend')} style={{ width: '100%', height: 160, background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                                    {friendPhoto ? <img src={friendPhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Camera size={32} color="#94a3b8" />}
                                </div>
                                <button onClick={handleFriendAttendance} disabled={isSubmittingFriend || (friendStatus && friendStatus.check_out)} style={{ width: '100%', padding: '20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 950, fontSize: '15px', opacity: (friendStatus && friendStatus.check_out) ? 0.6 : 1 }}>
                                  {isSubmittingFriend ? 'PROSES...' : (friendStatus ? (friendStatus.check_out ? 'TEMAN SUDAH PULANG' : 'KONFIRMASI ABSEN PULANG') : 'KONFIRMASI ABSEN MASUK')}
                                </button>
                             </div>
                          )}
                       </div>
                    ) : (
                      <>
                        <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                 <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={16} /></div>
                                 <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>Estimasi Pendapatan</span>
                              </div>
                           </div>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '20px' }}>
                                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', margin: 0 }}>HARI INI (EST.)</p>
                                  <h4 style={{ fontSize: '18px', fontWeight: 950, color: '#10b981', margin: 0 }}>Rp {monthlyStats.todayEst.toLocaleString('id-ID')}</h4>
                              </div>
                              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px' }}>
                                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', margin: 0 }}>TERKUMPUL</p>
                                  <h4 style={{ fontSize: '18px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Rp {monthlyStats.collected.toLocaleString('id-ID')}</h4>
                              </div>
                           </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                           <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <p style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>DATANG</p>
                              <div onClick={() => !checkInDone && !isSubmittingAttendance && startCamera('in')} style={{ width: '100%', aspectRatio: '1/1', height: 100, background: '#ffffff', borderRadius: '16px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                                 {photoIn ? <img src={photoIn} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Camera size={24} color="#94a3b8" />}
                              </div>
                              <button 
                                disabled={checkInDone || isSubmittingAttendance} 
                                onClick={() => handleAttendance('in')} 
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: checkInDone ? '#e2e8f0' : '#2563eb', color: 'white', border: 'none', fontWeight: 900, fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', opacity: (checkInDone || isSubmittingAttendance) ? 0.7 : 1 }}
                              >
                                {isSubmittingAttendance ? 'MEMPROSES...' : (checkInDone ? 'SUDAH ABSEN' : 'KIRIM ABSEN')}
                              </button>
                           </div>
                           <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, opacity: checkInDone ? 1 : 0.4 }}>
                              <p style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>PULANG</p>
                              <div onClick={() => checkInDone && !checkOutDone && !isSubmittingAttendance && startCamera('out')} style={{ width: '100%', aspectRatio: '1/1', height: 100, background: '#ffffff', borderRadius: '16px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: checkInDone ? 'pointer' : 'default' }}>
                                 {photoOut ? <img src={photoOut} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Camera size={24} color="#94a3b8" />}
                              </div>
                              <button onClick={() => handleAttendance('out')} disabled={!checkInDone || checkOutDone || isSubmittingAttendance} style={{ width: '100%', padding: '12px', background: checkOutDone ? '#10b981' : '#e11d48', color: 'white', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>
                                 {isSubmittingAttendance ? '...' : (checkOutDone ? 'TERCATAT' : 'KIRIM ABSEN')}
                              </button>
                           </div>
                        </div>
                        <div onClick={() => setShowLeaveForm(true)} style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                           <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Umbrella size={24} /></div>
                           <div style={{ flex: 1 }}><h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0, color: '#991b1b' }}>Pengajuan Izin / Sakit</h4><p style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, margin: 2 }}>Klik untuk kirim alasan & bukti.</p></div>
                           <ArrowRight size={20} color="#ef4444" />
                        </div>
                      </>
                    )}
                 </motion.div>
               )}

               {activeTab === 'task' && (
                 <motion.div key="task" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '32px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 20 }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                         <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Jenis Produk</label>
                         <select value={currentRecipe || ''} onChange={e => setCurrentRecipe(e.target.value)} style={{ width: '100%', padding: '16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 700 }}>
                            <option value="">-- PILIH PRODUK --</option>
                            {recipes.map(r => (
                               <option key={r.name} value={r.name}>{r.name}</option>
                            ))}
                         </select>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Berat Adonan (KG)</label>
                          <input type="number" step="0.1" placeholder="0.0" value={currentWeight || ''} onChange={e => setCurrentWeight(e.target.value)} style={{ width: '100%', padding: '14px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '18px', fontWeight: 900, textAlign: 'center' }} />
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Hasil Jadi (Unit)</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>MIKA</label><input type="number" placeholder="0" value={counts.mika || ''} onChange={e => setCounts({...counts, mika: e.target.value})} style={{ width: '100%', padding: '12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 900 }} /></div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>SEDANG</label><input type="number" placeholder="0" value={counts.sedang || ''} onChange={e => setCounts({...counts, sedang: e.target.value})} style={{ width: '100%', padding: '12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 900 }} /></div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>BESAR</label><input type="number" placeholder="0" value={counts.besar || ''} onChange={e => setCounts({...counts, besar: e.target.value})} style={{ width: '100%', padding: '12px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 900 }} /></div>
                          </div>
                       </div>
                       <button onClick={saveProduction} disabled={isSavingProduction} style={{ width: '100%', padding: '18px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '18px', fontSize: '14px', fontWeight: 950 }}>
                          {isSavingProduction ? 'MENYIMPAN...' : 'SIMPAN LAPORAN KERJA'}
                       </button>
                    </div>
                 </motion.div>
               )}

               {activeTab === 'payroll' && (
                 <motion.div key="pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                       <p style={{ fontSize: '12px', fontWeight: 750, color: '#64748b', marginBottom: 6 }}>Pendapatan {new Date().toLocaleString('id-ID', { month: 'long' })}</p>
                       <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Rp {(monthlyStats.collected + monthlyStats.base).toLocaleString('id-ID')}</h2>
                    </div>
                 </motion.div>
               )}

               {activeTab === 'history' && (
                  <motion.div key="hist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                     <p style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: 4 }}>RIWAYAT TERAKHIR</p>
                  </motion.div>
               )}
             </AnimatePresence>
           )}
        </div>

        {/* Profile Modal */}
        <AnimatePresence>
           {showProfile && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
                 <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ width: '100%', maxWidth: '480px', background: '#ffffff', borderRadius: '32px 32px 0 0', padding: '40px 32px 64px 32px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', margin: '0 auto' }}>
                    <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 32px auto' }} />
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                       <div style={{ width: 80, height: 80, borderRadius: '24px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 950, margin: '0 auto 16px auto' }}>{loggedInUser?.full_name?.charAt(0) || 'E'}</div>
                       <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>{loggedInUser?.full_name || 'Staff User'}</h3>
                       <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>ID-{loggedInUser?.id || 'ACTIVE'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       <button onClick={() => alert("Ganti PIN - Coming Soon")} style={{ width: '100%', padding: '20px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', fontSize: '14px', fontWeight: 800, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}><ShieldCheck size={18} /> Ganti PIN Keamanan</button>
                       <button onClick={handleLogout} style={{ width: '100%', padding: '20px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '18px', fontSize: '14px', fontWeight: 950, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}><LogOut size={18} /> KELUAR APLIKASI</button>
                       <button onClick={() => setShowProfile(false)} style={{ width: '100%', padding: '20px', background: 'none', border: 'none', fontSize: '14px', fontWeight: 800, color: '#94a3b8', cursor: 'pointer' }}>TUTUP</button>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        {loggedInUser && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '14px 24px 32px 24px', display: 'flex', justifyContent: 'space-between', zIndex: 1000 }}>
             {[ { id: 'attendance', label: 'Absen', icon: MapPin }, { id: 'task', label: 'Produksi', icon: ChefHat }, { id: 'payroll', label: 'Pendapatan', icon: Wallet }, { id: 'history', label: 'Riwayat', icon: History } ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as any)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: activeTab === item.id ? '#2563eb' : '#94a3b8', cursor: 'pointer' }}>
                  <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} /><span style={{ fontSize: '10px', fontWeight: 800 }}>{item.label}</span>
                </button>
              ))}
          </div>
        )}

      </div>

      {/* MODALS & OVERLAYS */}
      <AnimatePresence>
        {showLeaveForm && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ width: '100%', maxWidth: '480px', background: '#ffffff', borderRadius: '32px 32px 0 0', padding: '40px 32px 64px 32px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', margin: '0 auto' }}>
                 {!leaveSubmitted ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                         <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a', margin: 0 }}>Pengajuan Izin</h3>
                         <button onClick={() => setShowLeaveForm(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 12, padding: 8 }}><X size={20} /></button>
                      </div>

                      <div style={{ display: 'flex', gap: 10, background: '#f8fafc', padding: 6, borderRadius: 14 }}>
                         {['Izin', 'Sakit', 'Cuti'].map(type => (
                            <button 
                              key={type} 
                              onClick={() => setLeaveType(type as any)}
                              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: leaveType === type ? '#ffffff' : 'transparent', color: leaveType === type ? '#0f172a' : '#64748b', fontWeight: 900, fontSize: '13px', boxShadow: leaveType === type ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
                            >
                              {type}
                            </button>
                         ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                         <div onClick={() => startCamera('leave')} style={{ width: '100%', height: 160, background: '#f8fafc', borderRadius: 20, border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                             {leavePhoto ? (
                                <img src={leavePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                                <div style={{ textAlign: 'center' }}>
                                   <FileImage size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
                                   <p style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', margin: 0 }}>AMBIL FOTO BUKTI / SURAT</p>
                                </div>
                             )}
                         </div>

                         <textarea 
                           value={leaveReason || ''} 
                           onChange={e => setLeaveReason(e.target.value)} 
                           placeholder="Jelaskan alasan Anda secara detail..." 
                           style={{ width: '100%', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '14px', fontWeight: 700, minHeight: 100, borderLeft: '4px solid #ef4444' }} 
                         />
                      </div>

                      <button 
                        onClick={handleLeaveSubmit} 
                        disabled={isSubmittingLeave || !leavePhoto || !leaveReason} 
                        style={{ width: '100%', padding: '20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '18px', fontSize: '16px', fontWeight: 950, opacity: (isSubmittingLeave || !leavePhoto || !leaveReason) ? 0.6 : 1, transition: 'all 0.2s' }}
                      >
                        {isSubmittingLeave ? 'MENGIRIM PENGAJUAN...' : 'KIRIM PENGAJUAN'}
                      </button>
                   </div>
                 ) : (
                   <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ width: 80, height: 80, borderRadius: '40px', background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}><Check size={40} /></div>
                      <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', margin: '0 0 8px 0' }}>Berhasil Dikirim!</h3>
                      <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 700, marginBottom: 32 }}>Pengajuan Anda sedang menunggu approval admin.</p>
                      <button onClick={() => setShowLeaveForm(false)} style={{ width: '100%', padding: '20px', background: '#f1f5f9', borderRadius: 18, border: 'none', fontWeight: 900, color: '#0f172a' }}>TUTUP</button>
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
             <button onClick={capturePhoto} style={{ padding: '16px 32px', background: '#ffffff', borderRadius: 16 }}>AMBIL FOTO</button>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
}
