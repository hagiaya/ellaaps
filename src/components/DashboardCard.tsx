"use client";

import { motion } from "framer-motion";
import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const GlassCard = ({ children, className = "", delay = 0 }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`glass-card p-6 ${className}`}
    >
      {children}
    </motion.div>
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
  icon: any; 
  trend?: "up" | "down"; 
  trendValue?: string;
  color?: string;
}) => {
  return (
    <GlassCard className="flex flex-col gap-4 border-l-4" style={{ borderLeftColor: color || "var(--primary)" }}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className="w-5 h-5" style={{ color: color || "var(--primary)" }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend && (
          <div className={`flex items-center text-xs font-semibold ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
