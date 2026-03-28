"use client";

import { motion } from "framer-motion";
import { Camera, MapPin, CheckCircle, Clock, ChefHat, LogOut, FileText } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { GlassCard } from "@/components/DashboardCard";

export default function EmployeePortal() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [taskStarted, setTaskStarted] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Hello, Sarah Ahmed</h1>
            <p className="text-xs text-gray-400 font-medium">Production Specialist</p>
          </div>
        </div>
        <button className="p-3 bg-red-500/10 text-red-500 rounded-xl">
          <LogOut size={20} />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-4 flex flex-col gap-1 border-primary/20">
          <span className="text-[10px] uppercase font-bold text-gray-400">Today's Bonus</span>
          <span className="text-xl font-bold text-primary">Rp 15.000</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1 border-primary/20">
          <span className="text-[10px] uppercase font-bold text-gray-400">Total Work</span>
          <span className="text-xl font-bold text-white">4.8 kg</span>
        </GlassCard>
      </div>

      {/* Main Action: Attendance */}
      {!checkedIn ? (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="space-y-6"
        >
          <h2 className="text-2xl font-bold tracking-tight">Daily Check-in</h2>
          <GlassCard className="p-8 text-center flex flex-col items-center gap-6 bg-primary/5 border-primary/20">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
              <Camera size={40} />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-black" />
            </div>
            <p className="text-sm text-gray-400 max-w-[200px]">Take a selfie and confirm your location to start working.</p>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <MapPin size={14} className="text-primary" /> JL. KEMANG RAYA NO. 12
            </div>
            <button 
              onClick={() => setCheckedIn(true)}
              className="primary-button w-full justify-center py-4 rounded-2xl text-lg"
            >
              Check-in Now
            </button>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <div className="p-2 bg-green-500 rounded-full">
              <CheckCircle size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-500">Checked-in at 08:24 AM</p>
              <p className="text-[10px] text-green-500/60 font-semibold uppercase">Location Verified ✅</p>
            </div>
          </div>

          {!taskStarted ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">New Task</h2>
              <GlassCard className="p-0 overflow-hidden border-orange-500/20">
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Select Recipe</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Nastar Premium', 'Kastengel Keju', 'Brownies Fudgy', 'Putri Salju'].map((recipe) => (
                        <button key={recipe} className="p-4 rounded-xl border border-glass-border bg-white/5 text-sm font-semibold hover:border-primary hover:text-primary transition-all text-left">
                          {recipe}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Dough Weight (KG)</label>
                    <input type="number" placeholder="0.0" className="w-full text-center text-3xl font-black py-4 bg-black/40 border-glass-border focus:border-primary rounded-2xl" />
                  </div>
                </div>
                <div className="p-6 bg-primary/5 border-t border-glass-border">
                  <button onClick={() => setTaskStarted(true)} className="primary-button w-full justify-center">Start Production</button>
                </div>
              </GlassCard>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">In Production</h2>
                <div className="flex items-center gap-2 text-primary font-bold animate-pulse text-sm">
                  <Clock size={16} /> 00:45:12
                </div>
              </div>
              
              <GlassCard className="p-6 border-primary bg-primary/5">
                <h3 className="text-xl font-black mb-2">NASTAR PREMIUM</h3>
                <p className="text-sm text-gray-400 mb-6">Standard Target: <span className="text-white font-bold">12 Toples</span></p>
                
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase text-gray-500 block">Actual Result Qty</label>
                  <input type="number" placeholder="How many toples?" className="w-full bg-black/40 border-glass-border rounded-xl p-4 text-center font-bold text-2xl" />
                  <button className="primary-button w-full justify-center py-4 rounded-xl text-lg">Mark as Completed</button>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4">
             <button className="flex flex-col items-center gap-3 p-6 glass-card border-none hover:bg-white/5">
                <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                    <FileText size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Payslip</span>
             </button>
             <button className="flex flex-col items-center gap-3 p-6 glass-card border-none hover:bg-white/5">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <ChefHat size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">History</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
