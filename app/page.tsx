"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 gap-12">
      
      {/* Centered System Header / Logo */}
      <div className="text-center flex flex-col items-center gap-4 mb-4 select-none">
        {/* Abstract geometric academic emblem */}
        <div className="h-16 w-16 border-2 border-slate-900 flex items-center justify-center bg-white relative shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div className="absolute inset-1 border border-slate-200 flex items-center justify-center">
            <span className="font-mono text-xl font-black tracking-tighter text-slate-900">
              AX
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-[0.25em] text-slate-900 leading-none">
            APEX RESULT
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1px] w-6 bg-slate-350" />
            <p className="text-[9px] font-black text-slate-400 tracking-[0.25em] uppercase">
              Official Academic Registry
            </p>
            <span className="h-[1px] w-6 bg-slate-350" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl relative z-10">
        
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
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">
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
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">
              Faculty Console
            </span>
          </motion.div>
        </Link>

      </div>
    </div>
  );
}
