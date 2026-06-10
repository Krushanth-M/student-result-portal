"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Trash2, Edit3, X, ChevronDown, ArrowUpDown, RefreshCw, ArrowLeft
} from "lucide-react";
import { z } from "zod";
import { api, StudentWithResults, ClassInsights, calculateClassInsights } from "@/lib/student_db";

const scoreSchema = z.coerce
  .number({ invalid_type_error: "Must be a number" })
  .min(0, "Min 0")
  .max(100, "Max 100");

const studentFormSchema = z.object({
  name: z.string().min(2, "Invalid name"),
  usn_number: z.string().regex(/^[1-9][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/, "Format: e.g. 1RV26CS001"),
  college: z.string().min(3, "Invalid college"),
  math_score: scoreSchema,
  python_score: scoreSchema,
  ai_score: scoreSchema,
  chemistry_score: scoreSchema,
  ece_score: scoreSchema
});

type StudentFormData = z.infer<typeof studentFormSchema>;

export default function AdminView() {
  const [records, setRecords] = useState<StudentWithResults[]>([]);
  const [insights, setInsights] = useState<ClassInsights | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  
  const [sortField, setSortField] = useState<string>("usn_number");
  const [sortAscending, setSortAscending] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudentWithResults | null>(null);
  
  const [formData, setFormData] = useState<Partial<StudentFormData>>({
    name: "",
    usn_number: "",
    college: "RV College of Engineering",
    math_score: 0,
    python_score: 0,
    ai_score: 0,
    chemistry_score: 0,
    ece_score: 0
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allRecords = await api.getStudentsWithResults();
      setRecords(allRecords);
      setInsights(calculateClassInsights(allRecords));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueColleges = Array.from(new Set(records.map(r => r.college)));

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  const filteredRecords = records
    .filter(record => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        record.name.toLowerCase().includes(query) || 
        record.usn_number.toLowerCase().includes(query) ||
        record.college.toLowerCase().includes(query);
        
      const matchesCollege = collegeFilter === "all" || record.college === collegeFilter;
      
      return matchesSearch && matchesCollege;
    })
    .sort((a, b) => {
      let valA: any = a[sortField as keyof StudentWithResults];
      let valB: any = b[sortField as keyof StudentWithResults];
      
      if (["math_score", "python_score", "ai_score", "chemistry_score", "ece_score", "total", "gpa"].includes(sortField)) {
        valA = a.results ? a.results[sortField as keyof typeof a.results] : 0;
        valB = b.results ? b.results[sortField as keyof typeof b.results] : 0;
      }
      
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";
      
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAscending ? valA - valB : valB - valA;
      }
      
      return sortAscending 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Confirm deletion for ${name}?`)) return;
    
    try {
      const res = await api.deleteStudent(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert("Error deleting record");
    }
  };

  const openFormDrawer = (record: StudentWithResults | null = null) => {
    setFormErrors({});
    if (record) {
      setEditingRecord(record);
      setFormData({
        name: record.name,
        usn_number: record.usn_number,
        college: record.college,
        math_score: record.results?.math_score ?? 0,
        python_score: record.results?.python_score ?? 0,
        ai_score: record.results?.ai_score ?? 0,
        chemistry_score: record.results?.chemistry_score ?? 0,
        ece_score: record.results?.ece_score ?? 0
      });
    } else {
      setEditingRecord(null);
      const randId = Math.floor(10 + Math.random() * 89);
      setFormData({
        name: "",
        usn_number: `1RV26CS0${randId}`,
        college: "RV College of Engineering",
        math_score: 0,
        python_score: 0,
        ai_score: 0,
        chemistry_score: 0,
        ece_score: 0
      });
    }
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSaving(true);

    try {
      const validatedData = studentFormSchema.parse(formData);
      
      const studentPayload = {
        id: editingRecord?.id,
        name: validatedData.name,
        usn_number: validatedData.usn_number,
        college: validatedData.college
      };
      
      const resultsPayload = {
        math_score: validatedData.math_score,
        python_score: validatedData.python_score,
        ai_score: validatedData.ai_score,
        chemistry_score: validatedData.chemistry_score,
        ece_score: validatedData.ece_score
      };
      
      const response = await api.upsertStudent(studentPayload, resultsPayload);
      if (response.success) {
        setIsDrawerOpen(false);
        loadData();
      } else {
        alert(response.message);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Partial<Record<keyof StudentFormData, string>> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            errors[e.path[0] as keyof StudentFormData] = e.message;
          }
        });
        setFormErrors(errors);
      } else {
        alert("Database error.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormField = (key: keyof StudentFormData, val: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="w-full min-h-screen relative z-10 bg-[#f8fafc] pb-16 uppercase text-xs">
      
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 border border-slate-200 hover:border-slate-800 text-slate-800 transition-colors" title="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs font-black uppercase tracking-widest text-slate-900">
            Faculty Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openFormDrawer()}
            className="bg-slate-900 hover:bg-slate-950 text-white px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Add Student
          </button>

          <button 
            onClick={loadData}
            className="p-2 border border-slate-200 hover:border-slate-800 bg-white text-slate-800 transition-colors cursor-pointer"
            title="Reload"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-slate-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* Typographic Analytics Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Pass Rate */}
          <div className="border border-slate-300 bg-white p-6 flex flex-col justify-between min-h-[100px] shadow-xs">
            <span className="text-[9px] font-black text-slate-400 tracking-widest block">PASS RATE</span>
            <span className="text-2xl font-black font-mono text-slate-900 block mt-2">{loading ? "--" : `${insights?.pass_rate}%`}</span>
          </div>

          {/* Card 2: Top Performers */}
          <div className="border border-slate-300 bg-white p-6 flex flex-col justify-between min-h-[100px] shadow-xs">
            <span className="text-[9px] font-black text-slate-400 tracking-widest block">TOP PERFORMER</span>
            <div className="mt-2 flex justify-between items-baseline">
              <span className="font-black text-slate-900 line-clamp-1">{loading ? "--" : insights?.highest_name}</span>
              <span className="text-sm font-mono font-bold text-slate-900">{loading ? "--" : `${insights?.highest_pct}%`}</span>
            </div>
          </div>

          {/* Card 3: Backlogs */}
          <div className="border border-slate-300 bg-white p-6 flex flex-col justify-between min-h-[100px] shadow-xs">
            <span className="text-[9px] font-black text-slate-400 tracking-widest block">BACKLOGS</span>
            <span className="text-2xl font-black font-mono text-rose-600 block mt-2">{loading ? "--" : insights?.backlog_count}</span>
          </div>

        </section>

        {/* Card 4: Subject Performance Statistics */}
        <section className="border border-slate-300 bg-white p-6 shadow-xs">
          <span className="text-[9px] font-black text-slate-400 tracking-widest block mb-4">SUBJECT AVERAGES</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { label: "Maths", value: insights?.avg_math ?? 0, color: "bg-slate-800" },
              { label: "Python", value: insights?.avg_python ?? 0, color: "bg-slate-800" },
              { label: "Intro to AI", value: insights?.avg_ai ?? 0, color: "bg-slate-800" },
              { label: "Chemistry", value: insights?.avg_chem ?? 0, color: "bg-slate-800" },
              { label: "ECE", value: insights?.avg_ece ?? 0, color: "bg-slate-800" }
            ].map((sub, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold text-slate-500 tracking-wide">{sub.label}</span>
                  <span className="text-xs font-black font-mono text-slate-800">{loading ? "--" : `${sub.value}%`}</span>
                </div>
                <div className="h-1 bg-slate-200 w-full">
                  <div 
                    className={`h-full ${sub.color}`}
                    style={{ width: loading ? "0" : `${sub.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ledger Table Section */}
        <section className="border border-slate-300 bg-white shadow-xs">
          
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50/30">
            <span className="text-xs font-black tracking-widest text-slate-900">Marks Register</span>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="SEARCH"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none pl-9 pr-4 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="relative">
                <select
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  className="bg-white border border-slate-200 hover:border-slate-350 rounded-none px-3 py-2 pr-8 text-xs text-slate-700 outline-none appearance-none cursor-pointer"
                >
                  <option value="all">ALL COLLEGES</option>
                  {uniqueColleges.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-500 tracking-wider select-none">
                  <th onClick={() => handleSort("usn_number")} className="px-6 py-4 cursor-pointer hover:text-slate-900">USN</th>
                  <th onClick={() => handleSort("name")} className="px-6 py-4 cursor-pointer hover:text-slate-900">NAME</th>
                  <th className="px-6 py-4">COLLEGE</th>
                  <th onClick={() => handleSort("math_score")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">MATH</th>
                  <th onClick={() => handleSort("python_score")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">PYTHON</th>
                  <th onClick={() => handleSort("ai_score")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">AI</th>
                  <th onClick={() => handleSort("chemistry_score")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">CHEM</th>
                  <th onClick={() => handleSort("ece_score")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">ECE</th>
                  <th onClick={() => handleSort("total")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">TOTAL</th>
                  <th onClick={() => handleSort("gpa")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">GPA</th>
                  <th className="px-6 py-4 text-center">STATUS</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                      LOADING...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-400 italic">
                      NO RECORDS.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredRecords.map((record) => {
                      const res = record.results;
                      const isMathFail = (res?.math_score ?? 0) < 40;
                      const isPythonFail = (res?.python_score ?? 0) < 40;
                      const isAiFail = (res?.ai_score ?? 0) < 40;
                      const isChemFail = (res?.chemistry_score ?? 0) < 40;
                      const isEceFail = (res?.ece_score ?? 0) < 40;
                      const backlogs = [isMathFail, isPythonFail, isAiFail, isChemFail, isEceFail].filter(Boolean).length;
                      
                      return (
                        <tr key={record.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-6 py-4 font-mono font-bold text-slate-755">{record.usn_number}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 uppercase">{record.name}</td>
                          <td className="px-6 py-4 text-slate-500 uppercase">{record.college}</td>
                          
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-2 py-0.5 font-mono font-bold border ${
                              isMathFail ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {res?.math_score ?? "--"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-2 py-0.5 font-mono font-bold border ${
                              isPythonFail ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {res?.python_score ?? "--"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-2 py-0.5 font-mono font-bold border ${
                              isAiFail ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {res?.ai_score ?? "--"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-2 py-0.5 font-mono font-bold border ${
                              isChemFail ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {res?.chemistry_score ?? "--"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block px-2 py-0.5 font-mono font-bold border ${
                              isEceFail ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {res?.ece_score ?? "--"}
                            </span>
                          </td>
                          
                          <td className="px-4 py-4 text-center font-mono font-bold text-slate-700">{res?.total ?? "--"}</td>
                          <td className="px-4 py-4 text-center font-mono font-black text-slate-900">{res?.gpa ? res.gpa.toFixed(2) : "--"}</td>
                          
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                              backlogs > 0 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {backlogs > 0 ? "FAIL" : "PASS"}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openFormDrawer(record)}
                                className="p-1 border border-slate-200 hover:border-slate-800 bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id, record.name)}
                                className="p-1 border border-slate-200 hover:border-slate-800 bg-white text-slate-600 hover:text-rose-650 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Slide-out Form Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/20">
                <span className="text-sm font-black uppercase tracking-widest text-slate-900">
                  {editingRecord ? "Modify Student" : "Add Student"}
                </span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 border border-slate-200 hover:border-slate-350 bg-white text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="space-y-4">
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100 pb-1 block">
                    PROFILE
                  </span>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">NAME</label>
                    <input
                      type="text"
                      placeholder="NAME"
                      value={formData.name || ""}
                      onChange={(e) => updateFormField("name", e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs uppercase"
                    />
                    {formErrors.name && <p className="text-[10px] text-rose-600 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">USN</label>
                    <input
                      type="text"
                      placeholder="USN"
                      value={formData.usn_number || ""}
                      onChange={(e) => updateFormField("usn_number", e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs font-mono uppercase"
                    />
                    {formErrors.usn_number && <p className="text-[10px] text-rose-600 mt-1">{formErrors.usn_number}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">COLLEGE</label>
                    <input
                      type="text"
                      placeholder="COLLEGE"
                      value={formData.college || ""}
                      onChange={(e) => updateFormField("college", e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs uppercase"
                    />
                    {formErrors.college && <p className="text-[10px] text-rose-600 mt-1">{formErrors.college}</p>}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100 pb-1 block">
                    MARKS
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">MATHS</label>
                      <input
                        type="text"
                        value={formData.math_score ?? ""}
                        onChange={(e) => updateFormField("math_score", e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs font-mono outline-none"
                      />
                      {formErrors.math_score && <p className="text-[10px] text-rose-600 mt-1">{formErrors.math_score}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">PYTHON</label>
                      <input
                        type="text"
                        value={formData.python_score ?? ""}
                        onChange={(e) => updateFormField("python_score", e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs font-mono outline-none"
                      />
                      {formErrors.python_score && <p className="text-[10px] text-rose-600 mt-1">{formErrors.python_score}</p>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">INTRODUCTION TO AI</label>
                      <input
                        type="text"
                        value={formData.ai_score ?? ""}
                        onChange={(e) => updateFormField("ai_score", e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs font-mono outline-none"
                      />
                      {formErrors.ai_score && <p className="text-[10px] text-rose-600 mt-1">{formErrors.ai_score}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">CHEMISTRY</label>
                      <input
                        type="text"
                        value={formData.chemistry_score ?? ""}
                        onChange={(e) => updateFormField("chemistry_score", e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs font-mono outline-none"
                      />
                      {formErrors.chemistry_score && <p className="text-[10px] text-rose-600 mt-1">{formErrors.chemistry_score}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">ECE</label>
                      <input
                        type="text"
                        value={formData.ece_score ?? ""}
                        onChange={(e) => updateFormField("ece_score", e.target.value)}
                        className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs font-mono outline-none"
                      />
                      {formErrors.ece_score && <p className="text-[10px] text-rose-600 mt-1">{formErrors.ece_score}</p>}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 border border-slate-200 bg-white text-slate-600 py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-slate-900 hover:bg-slate-950 text-white py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSaving && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Save
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
