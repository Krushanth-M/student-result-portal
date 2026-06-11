"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Trash2, Edit3, X, ChevronDown, RefreshCw, ArrowLeft, Shield, Settings, AlertTriangle
} from "lucide-react";
import { z } from "zod";
import { 
  api, 
  StudentWithResults, 
  ClassInsights, 
  calculateClassInsights, 
  SubjectConfig, 
  DEFAULT_SUBJECTS 
} from "@/lib/student_db";

const studentFormSchema = z.object({
  name: z.string().min(2, "Invalid name"),
  usn_number: z.string().min(1, "USN is required"),
  year: z.coerce.number().min(1).max(4),
  semester: z.coerce.number().min(1).max(2)
});

type StudentFormData = z.infer<typeof studentFormSchema>;

export default function AdminView() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_auth") === "true";
    }
    return false;
  });
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === "5364105") {
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      setPassError("");
    } else {
      setPassError("ACCESS KEY INVALID");
    }
  };

  const [records, setRecords] = useState<StudentWithResults[]>([]);
  const [activeSubjects, setActiveSubjects] = useState<SubjectConfig[]>(DEFAULT_SUBJECTS);
  const [insights, setInsights] = useState<ClassInsights | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  
  const [sortField, setSortField] = useState<string>("usn_number");
  const [sortAscending, setSortAscending] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudentWithResults | null>(null);
  
  // Settings management
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [subjectsSettings, setSubjectsSettings] = useState<SubjectConfig[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  const [formData, setFormData] = useState<Partial<StudentFormData>>({
    name: "",
    usn_number: "",
    year: 1,
    semester: 1
  });
  
  // Dynamic scores state for drawer
  const [drawerScores, setDrawerScores] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const subjectsList = await api.getSubjects();
      setActiveSubjects(subjectsList);
      setSubjectsSettings(subjectsList);
      
      const allRecords = await api.getStudentsWithResults();
      setRecords(allRecords);
      setInsights(calculateClassInsights(allRecords, subjectsList));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        record.usn_number.toLowerCase().includes(query);
        
      const matchesYear = yearFilter === "all" || String(record.year) === yearFilter;
      const matchesSem = semFilter === "all" || String(record.semester) === semFilter;
      
      return matchesSearch && matchesYear && matchesSem;
    })
    .sort((a, b) => {
      let valA: any = a[sortField as keyof StudentWithResults];
      let valB: any = b[sortField as keyof StudentWithResults];
      
      // Handle score sorting
      if (sortField.startsWith("score_")) {
        const subId = sortField.replace("score_", "");
        valA = a.results?.subject_scores[subId] ?? -1;
        valB = b.results?.subject_scores[subId] ?? -1;
      } else if (sortField === "total") {
        const scoresA = activeSubjects.map(s => a.results?.subject_scores[s.id] ?? 0);
        valA = scoresA.reduce((sum, v) => sum + v, 0);
        const scoresB = activeSubjects.map(s => b.results?.subject_scores[s.id] ?? 0);
        valB = scoresB.reduce((sum, v) => sum + v, 0);
      } else if (sortField === "gpa") {
        const scoresA = activeSubjects.map(s => a.results?.subject_scores[s.id] ?? 0);
        valA = scoresA.length > 0 ? (scoresA.reduce((sum, v) => sum + v, 0) / scoresA.length) / 10 : 0;
        const scoresB = activeSubjects.map(s => b.results?.subject_scores[s.id] ?? 0);
        valB = scoresB.length > 0 ? (scoresB.reduce((sum, v) => sum + v, 0) / scoresB.length) / 10 : 0;
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
    setScoreErrors({});
    
    const initialScores: Record<string, string> = {};
    
    if (record) {
      setEditingRecord(record);
      setFormData({
        name: record.name,
        usn_number: record.usn_number,
        year: record.year,
        semester: record.semester
      });
      activeSubjects.forEach(sub => {
        initialScores[sub.id] = String(record.results?.subject_scores[sub.id] ?? 0);
      });
    } else {
      setEditingRecord(null);
      setFormData({
        name: "",
        usn_number: "",
        year: 1,
        semester: 1
      });
      activeSubjects.forEach(sub => {
        initialScores[sub.id] = "0";
      });
    }
    setDrawerScores(initialScores);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setScoreErrors({});
    setIsSaving(true);

    try {
      const validatedData = studentFormSchema.parse(formData);
      
      // Validate scores
      const finalScores: Record<string, number> = {};
      const scoreErrAccumulator: Record<string, string> = {};
      let hasScoreErrors = false;

      activeSubjects.forEach(sub => {
        const rawScore = drawerScores[sub.id] ?? "0";
        const scoreNum = Number(rawScore);
        if (rawScore.trim() === "" || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
          scoreErrAccumulator[sub.id] = "Must be 0-100";
          hasScoreErrors = true;
        } else {
          finalScores[sub.id] = scoreNum;
        }
      });

      if (hasScoreErrors) {
        setScoreErrors(scoreErrAccumulator);
        setIsSaving(false);
        return;
      }
      
      const studentPayload = {
        id: editingRecord?.id,
        name: validatedData.name,
        usn_number: validatedData.usn_number,
        year: validatedData.year,
        semester: validatedData.semester
      };
      
      const response = await api.upsertStudent(studentPayload, finalScores);
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

  const updateDrawerScore = (subId: string, val: string) => {
    setDrawerScores(prev => ({
      ...prev,
      [subId]: val
    }));
  };

  // Subjects settings operations
  const handleAddSubjectConfig = () => {
    const newId = `sub_${Date.now()}`;
    const nextNum = subjectsSettings.length + 1;
    setSubjectsSettings(prev => [
      ...prev,
      { id: newId, code: `10SUB${nextNum}`, name: "NEW SUBJECT" }
    ]);
  };

  const handleUpdateSubjectConfig = (idx: number, key: keyof SubjectConfig, val: string) => {
    setSubjectsSettings(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [key]: val
      };
      return copy;
    });
  };

  const handleRemoveSubjectConfig = (idx: number) => {
    setSubjectsSettings(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveSubjectsSettings = async () => {
    if (subjectsSettings.length === 0) {
      alert("At least one subject is required.");
      return;
    }
    
    // Check for empty names or codes
    if (subjectsSettings.some(s => !s.name.trim() || !s.code.trim())) {
      alert("All subjects must have a code and a name.");
      return;
    }

    setSavingSettings(true);
    try {
      const ok = await api.saveSubjects(subjectsSettings);
      if (ok) {
        setIsSettingsOpen(false);
        loadData();
      } else {
        alert("Failed to save configuration.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="w-full max-w-sm border border-slate-350 bg-white p-8 shadow-xs">
          <div className="text-center mb-8 flex flex-col items-center gap-3">
            <div className="h-10 w-10 bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200">
              <Shield className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-950">
              FACULTY CONSOLE ACCESS
            </span>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <input
                type="password"
                placeholder="ENTER SECURITY KEY"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-slate-850 rounded-none px-4 py-3 text-xs font-mono text-center text-slate-800 outline-none uppercase"
                autoFocus
              />
              {passError && (
                <p className="text-[10px] font-bold text-rose-600 font-mono tracking-wider text-center uppercase">
                  {passError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                PROCEED
              </button>
              <Link
                href="/"
                className="w-full border border-slate-200 hover:border-slate-900 bg-white text-slate-600 hover:text-slate-900 font-black py-3 text-xs uppercase tracking-widest transition-colors text-center block cursor-pointer"
              >
                BACK
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            onClick={() => setIsSettingsOpen(true)}
            className="border border-slate-200 hover:border-slate-900 bg-white text-slate-800 hover:text-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage Subjects
          </button>

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
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {activeSubjects.map((sub, idx) => {
              const value = insights?.avg_subjects[sub.id] ?? 0;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-slate-505 tracking-wide line-clamp-1">{sub.name}</span>
                    <span className="text-xs font-black font-mono text-slate-800">{loading ? "--" : `${value}%`}</span>
                  </div>
                  <div className="h-1 bg-slate-200 w-full mt-1">
                    <div 
                      className="h-full bg-slate-800"
                      style={{ width: loading ? "0" : `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
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

              {/* Year Filter */}
              <div className="relative">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="bg-white border border-slate-200 hover:border-slate-350 rounded-none px-3 py-2 pr-8 text-xs text-slate-705 outline-none appearance-none cursor-pointer"
                >
                  <option value="all">ALL YEARS</option>
                  <option value="1">YEAR 1</option>
                  <option value="2">YEAR 2</option>
                  <option value="3">YEAR 3</option>
                  <option value="4">YEAR 4</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Semester Filter */}
              <div className="relative">
                <select
                  value={semFilter}
                  onChange={(e) => setSemFilter(e.target.value)}
                  className="bg-white border border-slate-200 hover:border-slate-350 rounded-none px-3 py-2 pr-8 text-xs text-slate-705 outline-none appearance-none cursor-pointer"
                >
                  <option value="all">ALL SEMESTERS</option>
                  <option value="1">SEMESTER 1</option>
                  <option value="2">SEMESTER 2</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-505 tracking-wider select-none">
                  <th onClick={() => handleSort("usn_number")} className="px-6 py-4 cursor-pointer hover:text-slate-900">USN</th>
                  <th onClick={() => handleSort("name")} className="px-6 py-4 cursor-pointer hover:text-slate-900">NAME</th>
                  <th onClick={() => handleSort("year")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">YEAR</th>
                  <th onClick={() => handleSort("semester")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">SEM</th>
                  
                  {/* Dynamic Subjects headers */}
                  {activeSubjects.map(sub => (
                    <th 
                      key={sub.id} 
                      onClick={() => handleSort(`score_${sub.id}`)} 
                      className="px-4 py-4 text-center cursor-pointer hover:text-slate-900"
                    >
                      {sub.name}
                    </th>
                  ))}

                  <th onClick={() => handleSort("total")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">TOTAL</th>
                  <th onClick={() => handleSort("gpa")} className="px-4 py-4 text-center cursor-pointer hover:text-slate-900">GPA</th>
                  <th className="px-6 py-4 text-center">STATUS</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8 + activeSubjects.length} className="px-6 py-12 text-center text-slate-400">
                      LOADING...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8 + activeSubjects.length} className="px-6 py-12 text-center text-slate-400 italic">
                      NO RECORDS.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredRecords.map((record) => {
                      const res = record.results;
                      
                      const scores = res ? activeSubjects.map(s => res.subject_scores[s.id]).filter(v => v !== undefined && v !== null) : [];
                      const totalVal = scores.reduce((a, b) => a + b, 0);
                      const avgPct = scores.length > 0 ? totalVal / activeSubjects.length : 0;
                      const gpaVal = avgPct / 10;
                      
                      const backlogs = res ? activeSubjects.map(s => res.subject_scores[s.id] ?? 0).filter(s => s < 40).length : 0;
                      
                      return (
                        <tr key={record.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-6 py-4 font-mono font-bold text-slate-755">{record.usn_number}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-900 uppercase">{record.name}</span>
                              {res && (
                                <div className="h-1 w-24 bg-slate-100 relative mt-0.5 no-print" title={`${avgPct.toFixed(1)}% Average`}>
                                  <div 
                                    className={`h-full ${backlogs > 0 ? "bg-rose-500" : "bg-slate-800"}`} 
                                    style={{ width: `${avgPct}%` }} 
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center font-mono text-slate-500">Y{record.year}</td>
                          <td className="px-4 py-4 text-center font-mono text-slate-500">S{record.semester}</td>
                          
                          {/* Dynamic scores cells */}
                          {activeSubjects.map((sub) => {
                            const score = res?.subject_scores[sub.id];
                            const hasScore = score !== undefined && score !== null;
                            const isFail = hasScore && score < 40;
                            return (
                              <td key={sub.id} className="px-4 py-4 text-center">
                                <span className={`inline-block px-2 py-0.5 font-mono font-bold border ${
                                  !hasScore ? "bg-slate-50 text-slate-400 border-slate-100" :
                                  isFail ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                }`}>
                                  {hasScore ? score : "--"}
                                </span>
                              </td>
                            );
                          })}
                          
                          <td className="px-4 py-4 text-center font-mono font-bold text-slate-700">{res ? totalVal : "--"}</td>
                          <td className="px-4 py-4 text-center font-mono font-black text-slate-900">{res ? gpaVal.toFixed(2) : "--"}</td>
                          
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

      {/* Slide-out Form Drawer (Add/Edit Student) */}
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
                      value="RATHINAM INSTITUTE OF TECHNOLOGY"
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-xs uppercase text-slate-500 font-bold"
                    />
                  </div>

                  {/* Year and Semester Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">YEAR</label>
                      <select
                        value={formData.year || 1}
                        onChange={(e) => updateFormField("year", Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs outline-none cursor-pointer"
                      >
                        <option value={1}>YEAR 1</option>
                        <option value={2}>YEAR 2</option>
                        <option value={3}>YEAR 3</option>
                        <option value={4}>YEAR 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">SEMESTER</label>
                      <select
                        value={formData.semester || 1}
                        onChange={(e) => updateFormField("semester", Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs outline-none cursor-pointer"
                      >
                        <option value={1}>SEMESTER 1</option>
                        <option value={2}>SEMESTER 2</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100 pb-1 block">
                    MARKS
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeSubjects.map((sub) => (
                      <div key={sub.id} className={activeSubjects.length % 2 !== 0 && activeSubjects[activeSubjects.length - 1].id === sub.id ? "sm:col-span-2" : ""}>
                        <label className="block text-[10px] font-bold text-slate-705 mb-1 truncate">{sub.name}</label>
                        <input
                          type="text"
                          value={drawerScores[sub.id] ?? ""}
                          onChange={(e) => updateDrawerScore(sub.id, e.target.value)}
                          className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-3 py-2 text-xs font-mono outline-none"
                        />
                        {scoreErrors[sub.id] && <p className="text-[10px] text-rose-600 mt-1">{scoreErrors[sub.id]}</p>}
                      </div>
                    ))}
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

      {/* Settings Modal (Manage Subjects) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-white border border-slate-300 shadow-2xl p-6 space-y-6 max-h-[85vh] flex flex-col uppercase text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-black tracking-widest text-slate-900">Manage Course Subjects</span>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1.5 border border-slate-200 hover:border-slate-800 text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="bg-amber-50 border border-amber-200 p-3 text-amber-800 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-705 mt-0.5" />
                    <div className="text-[10px] leading-normal font-bold">
                      WARNING: RENAMING A SUBJECT PRESERVES EXISTING SCORES, BUT DELETING A SUBJECT WILL REMOVE THOSE EXAM MARKS FOR ALL REGISTERED STUDENTS.
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-400 tracking-wider">
                        <th className="py-2 pr-4 w-1/4">SUBJECT CODE</th>
                        <th className="py-2 pr-4 w-2/3">SUBJECT NAME</th>
                        <th className="py-2 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjectsSettings.map((sub, idx) => (
                        <tr key={sub.id}>
                          <td className="py-3 pr-4">
                            <input
                              type="text"
                              value={sub.code}
                              onChange={(e) => handleUpdateSubjectConfig(idx, "code", e.target.value.toUpperCase())}
                              className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-2 py-1 text-xs font-mono outline-none"
                              placeholder="E.G. 10MAT21"
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <input
                              type="text"
                              value={sub.name}
                              onChange={(e) => handleUpdateSubjectConfig(idx, "name", e.target.value.toUpperCase())}
                              className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-none px-2 py-1 text-xs outline-none"
                              placeholder="E.G. MATHEMATICS"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleRemoveSubjectConfig(idx)}
                              className="p-1.5 border border-slate-200 hover:border-rose-800 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Subject"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    onClick={handleAddSubjectConfig}
                    className="w-full border border-dashed border-slate-300 hover:border-slate-900 bg-slate-50 hover:bg-white text-slate-650 hover:text-slate-900 font-bold py-2.5 text-center transition-all cursor-pointer"
                  >
                    + Add New Subject
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="border border-slate-200 hover:border-slate-800 px-4 py-2 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSubjectsSettings}
                    disabled={savingSettings}
                    className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-2 font-black tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {savingSettings && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Save Configuration
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
