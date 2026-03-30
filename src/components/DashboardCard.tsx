"use client";

import { motion } from "framer-motion";
import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export const GlassCard = ({ children, className = "", delay = 0, style = {} }: GlassCardProps) => {
  return (
    <div
      className={`glass-card ${className}`}
      style={{ ...style, opacity: 1 }}
    >
      {children}
    </div>
  );
};

export const DashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: "up" | "down"; 
  trendValue?: string;
  color?: string;
}) => {
  return (
    <GlassCard className="flex flex-col gap-3" style={{ padding: '24px' }}>
      <div className="flex justify-between items-start">
        <div style={{ 
          width: 44, 
          height: 44, 
          borderRadius: 12, 
          backgroundColor: (color || '#2563eb') + '10', 
          color: color || '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
           {Icon && <Icon size={22} />}
        </div>
        {trend && (
          <span style={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: trend === 'up' ? '#10b981' : '#ef4444', 
            background: trend === 'up' ? '#f0fdf4' : '#fef2f2', 
            padding: '4px 10px', 
            borderRadius: 8 
          }}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </GlassCard>
  );
};
