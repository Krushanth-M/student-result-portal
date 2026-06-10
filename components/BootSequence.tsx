"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
}

const premiumEase = [0.16, 1, 0.3, 1];

const systemLogs = [
  "Initializing core quant reasoning engine...",
  "AST safety sandbox verification: [ OK ]",
  "API orchestrator model config: [ DEEPSEEK ]",
  "Sentiment mining agent connection: [ OK ]",
  "yfinance data feed active: [ STABLE ]",
  "Securing user workspace tunnel: [ SECURE ]"
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [fade, setFade] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // 1. Diagnostics verbose logs interval
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < systemLogs.length) {
        setLogs(prev => [...prev, systemLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 400);

    // 2. Wait for progress bar animation (2.8s), then dissolve
    const timer = setTimeout(() => {
      setFade(true);
      const exitTimer = setTimeout(onComplete, 800);
      return () => clearTimeout(exitTimer);
    }, 2800);

    return () => {
      clearInterval(logInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: fade ? 0 : 1 }}
      transition={{ duration: 0.8, ease: premiumEase }}
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 w-screen h-screen select-none"
    >
      <div className="flex flex-col items-center">
        {/* Faint, thin Hexagon with Caret Emblem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: premiumEase }}
          className="relative w-24 h-24 flex items-center justify-center"
        >
          <svg className="absolute w-24 h-24 text-[#ff9e00]/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
            <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
          </svg>
          <span className="text-[#ff9e00] text-3xl font-extralight tracking-tighter select-none font-mono glow-text-amber">^</span>
        </motion.div>

        {/* Sleek horizontal progress line (fills up in 2.8s) */}
        <div className="w-48 h-[1px] bg-zinc-950/80 mt-10 overflow-hidden relative border-t border-zinc-900">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2.8, ease: premiumEase }}
            className="h-full w-full bg-white"
          />
        </div>

        {/* Verbose logs printout below */}
        <div className="mt-8 h-28 w-60 font-mono text-[9px] text-[#ff9e00]/60 text-left space-y-1.5 overflow-hidden select-none">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center space-x-2 opacity-90 transition-opacity duration-300">
              <span className="text-[#84cc16] shrink-0 font-sans">✔</span>
              <span className="truncate">{log}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
