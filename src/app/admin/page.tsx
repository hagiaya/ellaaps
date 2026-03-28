"use client";

import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  Users, 
  ChefHat, 
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { DashboardCard, GlassCard } from "@/components/DashboardCard";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const stats = [
    { title: 'Total Sales (Month)', value: 'Rp 45.200.000', icon: DollarSign, trend: 'up', trendValue: '12%', color: 'var(--primary)' },
    { title: 'Total Expenses', value: 'Rp 12.800.000', icon: TrendingUp, trend: 'down', trendValue: '5%', color: 'var(--secondary)' },
    { title: 'Ingredients Stock', value: '78%', icon: Package, trend: 'up', trendValue: '2%', color: '#10b981' },
    { title: 'Active Employees', value: '24/28', icon: Users, trend: 'up', trendValue: 'None', color: '#3b82f6' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Financial Overview</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border-glass-border rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
            Last 30 Days <ChevronDown size={14} />
          </button>
          <button className="primary-button text-sm py-2 px-4">Generate Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <DashboardCard key={stat.title} {...stat as any} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Low Stock Alerts */}
        <GlassCard className="lg:col-span-1 flex flex-col h-full bg-red-500/5 border-red-500/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2 text-red-500">
              <Package size={20} /> Low Stock Alerts
            </h3>
            <span className="text-xs font-semibold px-2 py-1 bg-red-500 rounded-full text-white">4 Items</span>
          </div>
          
          <div className="space-y-6 flex-1">
            {[
              { name: 'Terigu Segitiga Biru', amount: '1.2 kg', status: 'Critical' },
              { name: 'Margarin Royal Palmia', amount: '250 gr', status: 'Warning' },
              { name: 'Coklat Bubuk Windmolen', amount: '100 gr', status: 'Critical' },
              { name: 'Gula Halus Rosi', amount: '2 kg', status: 'Warning' }
            ].map((item, i) => (
              <div key={item.name} className="flex items-center justify-between border-b border-glass-border pb-4 last:border-0 last:pb-0">
                <div>
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-500">Current: {item.amount}</p>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${item.status === 'Critical' ? 'bg-red-500 text-white' : 'bg-orange-500/20 text-orange-500'}`}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-8 text-sm font-bold text-primary flex items-center gap-2 hover:translate-x-1 transition-transform">
            View All Stock <ArrowRight size={14} />
          </button>
        </GlassCard>

        {/* Recent Production */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ChefHat size={20} className="text-primary" /> Recent Production Task
            </h3>
            <button className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">See History</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-glass-border">
                  <th className="pb-4 font-semibold">Employee</th>
                  <th className="pb-4 font-semibold">Recipe</th>
                  <th className="pb-4 font-semibold">Weight</th>
                  <th className="pb-4 font-semibold">Output</th>
                  <th className="pb-4 font-semibold">Bonus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-sm">
                {[
                  { name: 'Sarah Ahmed', recipe: 'Nastar Premium', weight: '3.0 kg', output: '12 Toples', bonus: 'Rp 10,000' },
                  { name: 'Rahmat Hidayat', recipe: 'Kastengel Keju', weight: '2.5 kg', output: '8 Toples', bonus: 'Rp 5,000' },
                  { name: 'Anisa Putri', recipe: 'Brownies Fudgy', weight: '5.0 kg', output: '25 Mika', bonus: 'Rp 30,000' },
                  { name: 'Budi Santoso', recipe: 'Nastar Premium', weight: '1.8 kg', output: '7 Toples', bonus: 'Rp 0' },
                ].map((task, i) => (
                  <tr key={i} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 font-semibold">{task.name}</td>
                    <td className="py-4 text-gray-300">{task.recipe}</td>
                    <td className="py-4 text-gray-300">{task.weight}</td>
                    <td className="py-4 font-bold text-primary">{task.output}</td>
                    <td className="py-4">
                      <span className={`font-semibold ${task.bonus === 'Rp 0' ? 'text-gray-500' : 'text-green-400'}`}>+{task.bonus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
