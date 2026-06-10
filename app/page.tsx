"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        
        {/* Student Portal Card */}
        <Link href="/student-view" className="group block">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="border-2 border-slate-200 hover:border-slate-800 bg-white p-12 flex flex-col items-center justify-center text-center gap-6 cursor-pointer transition-all duration-200 h-64 shadow-xs"
          >
            <div className="h-16 w-16 bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200">
              <GraduationCap className="h-8 w-8" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">
              Student Portal
            </span>
          </motion.div>
        </Link>

        {/* Faculty/Admin Card */}
        <Link href="/admin-view" className="group block">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="border-2 border-slate-200 hover:border-slate-800 bg-white p-12 flex flex-col items-center justify-center text-center gap-6 cursor-pointer transition-all duration-200 h-64 shadow-xs"
          >
            <div className="h-16 w-16 bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200">
              <Shield className="h-8 w-8" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">
              Faculty Console
            </span>
          </motion.div>
        </Link>

      </div>
    </div>
  );
}
