"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, RefreshCw, X } from "lucide-react";
import { api, StudentWithResults, SubjectConfig, DEFAULT_SUBJECTS } from "@/lib/student_db";

export default function StudentView() {
  const [usnInput, setUsnInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentWithResults | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeSubjects, setActiveSubjects] = useState<SubjectConfig[]>(DEFAULT_SUBJECTS);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const list = await api.getSubjects();
        setActiveSubjects(list);
      } catch (err) {
        console.error("Error loading subjects settings in StudentView:", err);
      }
    };
    fetchSubjects();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!usnInput.trim()) {
      setErrorMsg("ENTER USN");
      setLoading(false);
      return;
    }

    try {
      const result = await api.getStudentByUSN(usnInput);
      if (result) {
        setStudentData(result);
      } else {
        setErrorMsg(`USN NOT FOUND`);
      }
    } catch (err) {
      setErrorMsg("ERROR");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setStudentData(null);
    setUsnInput("");
    setErrorMsg("");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const res = studentData?.results;
  
  const scores = res ? activeSubjects.map(sub => res.subject_scores[sub.id] ?? 0) : [];
  const totalVal = scores.reduce((sum, score) => sum + score, 0);
  
  const percentage = activeSubjects.length > 0 ? (totalVal / activeSubjects.length).toFixed(2) : "0.00";
  const gpa = activeSubjects.length > 0 ? (totalVal / activeSubjects.length / 10).toFixed(2) : "0.00";
  
  const backlogs = scores.filter(s => s < 40).length;

  const getGrade = (score: number) => {
    if (score >= 90) return "S";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    if (score >= 40) return "E";
    return "F";
  };

  const subjects = res ? activeSubjects.map(sub => ({
    code: sub.code,
    name: sub.name,
    score: res.subject_scores[sub.id] ?? 0
  })) : [];

  return (
    <div className="w-full min-h-screen flex flex-col justify-between relative z-10 bg-[#f8fafc] text-xs">
      
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 border border-slate-200 hover:border-slate-800 text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs font-black uppercase tracking-widest text-slate-900">STUDENT PORTAL</span>
        </div>
        
        {studentData && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 border border-slate-900 bg-slate-900 text-white hover:bg-white hover:text-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              PRINT
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 border border-slate-200 hover:border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              EXIT
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          
          {/* Query Form */}
          {!studentData ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm border border-slate-300 bg-white p-8 shadow-xs"
            >
              <div className="text-center mb-8">
                <span className="text-xs font-black uppercase tracking-widest text-slate-950">RESULT QUERY</span>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="USN"
                      value={usnInput}
                      onChange={(e) => setUsnInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-slate-850 rounded-none pl-4 pr-10 py-3 text-xs font-mono text-slate-800 outline-none uppercase"
                    />
                    {usnInput && (
                      <button
                        type="button"
                        onClick={() => setUsnInput("")}
                        className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-850 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errorMsg && (
                    <p className="text-[10px] font-bold text-rose-600 font-mono tracking-wider text-center uppercase">
                      {errorMsg}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-950 disabled:opacity-50 text-white font-black py-3 text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    "SEARCH"
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            
            // Statement of Marks Transcript Page
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-3xl space-y-6 print-container"
            >
              
              {/* PRINT ONLY: University Header Block */}
              <div className="print-only border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-black">STATEMENT OF MARKS</h2>
                    <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">EXAMINATIONS BRANCH</p>
                  </div>
                  <div className="text-right text-[8px] font-mono text-slate-650 uppercase">
                    <p>USN: {studentData.usn_number}</p>
                    <p>DATE: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Profile details */}
              <div className="border border-slate-300 bg-white p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-xs uppercase">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block tracking-wider">NAME</span>
                    <span className="font-black text-slate-900 block mt-1">{studentData.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block tracking-wider">USN</span>
                    <span className="font-mono font-bold text-slate-900 block mt-1">{studentData.usn_number}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-slate-400 block tracking-wider">COLLEGE</span>
                    <span className="font-black text-slate-900 block mt-1">{studentData.college}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block tracking-wider">YEAR</span>
                      <span className="font-mono font-bold text-slate-900 block mt-1">{studentData.year}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block tracking-wider">SEM</span>
                      <span className="font-mono font-bold text-slate-900 block mt-1">{studentData.semester}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Academic Ledger Table */}
              <div className="border border-slate-300 bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs uppercase">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 text-[9px] font-bold text-slate-500 tracking-wider">
                      <th className="px-6 py-4">CODE</th>
                      <th className="px-6 py-4">SUBJECT</th>
                      <th className="px-6 py-4 text-center">MAX</th>
                      <th className="px-6 py-4 text-center">MIN</th>
                      <th className="px-6 py-4 text-center">OBTAINED</th>
                      <th className="px-6 py-4 text-center">GRADE</th>
                      <th className="px-6 py-4 text-center">RESULT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {subjects.map((sub, idx) => {
                      const isFail = sub.score < 40;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4.5 font-mono font-bold text-slate-500">{sub.code}</td>
                          <td className="px-6 py-4.5 font-bold text-slate-800">{sub.name}</td>
                          <td className="px-6 py-4.5 text-center font-mono text-slate-600">100</td>
                          <td className="px-6 py-4.5 text-center font-mono text-slate-600">40</td>
                          <td className="px-6 py-4.5 text-center font-mono font-bold text-slate-900">{sub.score}</td>
                          <td className="px-6 py-4.5 text-center font-mono font-extrabold text-slate-900">{getGrade(sub.score)}</td>
                          <td className="px-6 py-4.5 text-center">
                            <span className={`inline-block px-2 py-0.5 font-mono font-bold text-[9px] border ${
                              isFail 
                                ? "bg-rose-50 text-rose-600 border-rose-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {isFail ? "F" : "P"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Subject-Wise Analysis SVG Bar Chart */}
              <div className="border border-slate-300 bg-white p-6 shadow-xs space-y-6 no-print">
                <span className="text-[9px] font-black text-slate-400 tracking-widest block">SUBJECT-WISE PERFORMANCE ANALYSIS</span>
                
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[640px]">
                    <svg viewBox="0 0 800 260" className="w-full h-auto select-none">
                      {/* Grid Lines & Y-Axis Labels */}
                      {[100, 75, 50, 25, 0].map((level, idx) => {
                        const y = 25 + 180 * (1 - level / 100);
                        return (
                          <g key={idx}>
                            <line 
                              x1="45" 
                              y1={y} 
                              x2="780" 
                              y2={y} 
                              stroke="#e2e8f0" 
                              strokeDasharray="4 4" 
                              strokeWidth="1" 
                            />
                            <text 
                              x="35" 
                              y={y + 3} 
                              textAnchor="end" 
                              className="font-mono text-[9px] font-black fill-slate-405"
                            >
                              {level}
                            </text>
                          </g>
                        );
                      })}

                      {/* Bars & Labels */}
                      {subjects.map((sub, idx) => {
                        const numSubjects = subjects.length || 1;
                        const colWidth = 735 / numSubjects;
                        const barWidth = Math.min(colWidth * 0.45, 40); // Max width of 40px for clean layout
                        const x = 45 + (idx * colWidth) + (colWidth - barWidth) / 2;
                        
                        const score = sub.score;
                        const isFail = score < 40;
                        const barHeight = 180 * (score / 100);
                        const y = 25 + (180 - barHeight);

                        return (
                          <g key={idx} className="group">
                            {score > 0 ? (
                              <>
                                {/* Bar rect */}
                                <rect 
                                  x={x} 
                                  y={y} 
                                  width={barWidth} 
                                  height={barHeight} 
                                  fill={isFail ? "#f43f5e" : "#0f172a"}
                                  className="transition-all duration-300 hover:opacity-90"
                                />
                                
                                {/* Score value text above bar */}
                                <text 
                                  x={x + barWidth / 2} 
                                  y={y - 8} 
                                  textAnchor="middle" 
                                  className="font-mono text-[10px] font-black fill-slate-900"
                                >
                                  {score}
                                </text>
                              </>
                            ) : (
                              <>
                                {/* Empty/Zero Score Placeholder Box */}
                                <rect 
                                  x={x} 
                                  y={25} 
                                  width={barWidth} 
                                  height={180} 
                                  fill="none" 
                                  stroke="#e2e8f0" 
                                  strokeDasharray="3 3" 
                                  strokeWidth="1" 
                                />
                                
                                {/* Placeholder text */}
                                <text 
                                  x={x + barWidth / 2} 
                                  y={205 - 8} 
                                  textAnchor="middle" 
                                  className="font-mono text-[9px] font-black fill-slate-300"
                                >
                                  --
                                </text>
                              </>
                            )}

                            {/* X-Axis Subject Code Label */}
                            <text 
                              x={x + barWidth / 2} 
                              y={225} 
                              textAnchor="middle" 
                              className="font-mono text-[9px] font-black fill-slate-800"
                            >
                              {sub.code}
                            </text>

                            {/* Truncated Subject Name */}
                            <text 
                              x={x + barWidth / 2} 
                              y={238} 
                              textAnchor="middle" 
                              className="text-[8px] font-bold fill-slate-450 tracking-wider"
                            >
                              {sub.name.length > 15 ? `${sub.name.slice(0, 13)}...` : sub.name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-6">
                <div className="border border-slate-300 bg-white p-6 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">PERCENTAGE</span>
                  <span className="text-2xl font-black font-mono text-slate-900 block mt-2">{percentage}%</span>
                </div>
                <div className="border border-slate-300 bg-white p-6 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">GPA</span>
                  <span className="text-2xl font-black font-mono text-slate-900 block mt-2">{gpa} / 10.0</span>
                </div>
                <div className="border border-slate-300 bg-white p-6 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">RESULT STATUS</span>
                  <span className={`inline-block w-fit mt-2 border px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    backlogs > 0 
                      ? "bg-rose-50 text-rose-700 border-rose-200" 
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {backlogs > 0 ? "FAIL" : "PASS"}
                  </span>
                </div>
              </div>

              {/* PRINT ONLY: Signatures Block */}
              <div className="print-only mt-12 pt-8 border-t border-slate-300">
                <div className="flex justify-between items-center text-[9px] uppercase font-mono text-slate-700">
                  <div>
                    <p className="font-bold">Verified by:</p>
                    <div className="h-12 w-40 border-b border-slate-400 mt-2 border-dashed" />
                    <p className="mt-1">Examinations Branch Clerk</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Registrar (Evaluation):</p>
                    <div className="h-12 w-40 border-b border-slate-400 mt-2 border-dashed ml-auto" />
                    <p className="mt-1">Office Seal & Stamp</p>
                  </div>
                </div>
              </div>

              {/* Web actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 no-print">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-800 text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  CLOSE
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  PRINT TRANSCRIPT
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
