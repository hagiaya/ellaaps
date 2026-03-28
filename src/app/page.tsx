"use client";

import { motion } from "framer-motion";
import { UserCog, Users, ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const roles = [
    {
      title: "Admin",
      description: "Manage recipes, inventory, and payroll.",
      icon: UserCog,
      href: "/admin",
      color: "var(--primary)",
    },
    {
      title: "Employee",
      description: "Log daily tasks and attendance.",
      icon: Users,
      href: "/employee",
      color: "var(--secondary)",
    },
    {
      title: "Cashier",
      description: "Process sales and update stock.",
      icon: ShoppingCart,
      href: "/cashier",
      color: "#10b981",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-12 text-center"
      >
        <div className="relative w-32 h-32 mb-6">
          <Image
            src="/logo.png"
            alt="The Golden Whisk Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          The <span className="gradient-text">Golden Whisk</span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Premium Cake Shop Management System. Please select your portal to continue.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {roles.map((role, i) => (
          <Link href={role.href} key={role.title} className="group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 h-full flex flex-col items-center text-center hover-glow transition-all duration-300"
            >
              <div 
                className="p-4 rounded-2xl bg-white/5 mb-6 group-hover:scale-110 transition-transform"
                style={{ color: role.color }}
              >
                <role.icon size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-3">{role.title}</h2>
              <p className="text-gray-400 mb-8 flex-grow">{role.description}</p>
              <div className="flex items-center gap-2 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Enter Portal <ArrowRight size={16} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <footer className="mt-20 text-gray-500 text-sm">
        &copy; 2024 The Golden Whisk. Crafted for Excellence.
      </footer>
    </div>
  );
}
