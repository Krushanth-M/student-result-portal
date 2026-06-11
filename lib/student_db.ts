/**
 * Student Result Portal - API & Fallback Mock Database Engine (USN-Based)
 * ---------------------------------------------------------------------
 * Handles database operations for students (demographics) and their results (5 courses:
 * Math, Python, AI, Chemistry, ECE). Integrates Supabase and local storage fallbacks.
 */

import { createClient } from "@supabase/supabase-js";

// 1. Interfaces & Types
export interface Student {
  id: string;
  user_id?: string;
  name: string;
  usn_number: string; // University Seat Number (e.g. 1RV26CS001)
  college: string;     // College Name
  created_at?: string;
}

export interface Results {
  id: string;
  student_id: string;
  math_score: number;
  python_score: number;
  ai_score: number;
  chemistry_score: number;
  ece_score: number;
  total?: number;
  gpa?: number;
  created_at?: string;
}

export interface StudentWithResults extends Student {
  results: Results | null;
}

export interface ClassInsights {
  total: number;
  pass_rate: number;
  backlog_count: number;
  highest_pct: number;
  highest_name: string;
  highest_roll: string;
  lowest_pct: number;
  lowest_name: string;
  lowest_roll: string;
  avg_math: number;
  avg_python: number;
  avg_ai: number;
  avg_chem: number;
  avg_ece: number;
}

// 2. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = (() => {
  try {
    return isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
  } catch {
    return null;
  }
})();

// 3. Dummy Seed Data (Maths, Python, AI, Chemistry, ECE)
const DUMMY_STUDENTS: Student[] = [
  { id: "s1", name: "Hermione Granger", usn_number: "1RV26CS001", college: "RV College of Engineering" },
  { id: "s2", name: "Harry Potter", usn_number: "1RV26CS002", college: "RV College of Engineering" },
  { id: "s3", name: "Ron Weasley", usn_number: "1RV26CS003", college: "RV College of Engineering" },
  { id: "s4", name: "Emma Watson", usn_number: "1BM26EC042", college: "BMS College of Engineering" },
  { id: "s5", name: "Daniel Radcliffe", usn_number: "1PE26AI014", college: "PES University" }
];

const DUMMY_RESULTS: Results[] = [
  { id: "r1", student_id: "s1", math_score: 98, python_score: 100, ai_score: 99, chemistry_score: 95, ece_score: 96, total: 488, gpa: 9.76 },
  { id: "r2", student_id: "s2", math_score: 72, python_score: 85, ai_score: 80, chemistry_score: 68, ece_score: 75, total: 380, gpa: 7.60 },
  { id: "r3", student_id: "s3", math_score: 35, python_score: 42, ai_score: 55, chemistry_score: 38, ece_score: 50, total: 220, gpa: 4.40 }, // Backlog (2: Math, Chem)
  { id: "r4", student_id: "s4", math_score: 85, python_score: 92, ai_score: 88, chemistry_score: 78, ece_score: 90, total: 433, gpa: 8.66 },
  { id: "r5", student_id: "s5", math_score: 90, python_score: 88, ai_score: 92, chemistry_score: 84, ece_score: 86, total: 440, gpa: 8.80 }
];

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

const getLocalData = (): { students: Student[]; results: Results[] } => {
  if (typeof window === "undefined") {
    return { students: DUMMY_STUDENTS, results: DUMMY_RESULTS };
  }
  const studentsRaw = localStorage.getItem("sp2_students");
  const resultsRaw = localStorage.getItem("sp2_results");
  
  if (!studentsRaw || !resultsRaw) {
    localStorage.setItem("sp2_students", JSON.stringify(DUMMY_STUDENTS));
    localStorage.setItem("sp2_results", JSON.stringify(DUMMY_RESULTS));
    return { students: DUMMY_STUDENTS, results: DUMMY_RESULTS };
  }
  
  return {
    students: JSON.parse(studentsRaw),
    results: JSON.parse(resultsRaw)
  };
};

const saveLocalData = (students: Student[], results: Results[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("sp2_students", JSON.stringify(students));
  localStorage.setItem("sp2_results", JSON.stringify(results));
};

// 4. API Endpoints
export const api = {
  /**
   * Fetches all students with results (for Teacher/Admin ledger)
   */
  async getStudentsWithResults(): Promise<StudentWithResults[]> {
    await delay(500);
    
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, user_id, name, usn_number, college,
          results (
            id, student_id, math_score, python_score, ai_score, chemistry_score, ece_score, total, gpa
          )
        `)
        .order("usn_number");
        
      if (error) throw new Error(error.message);
      
      return (data || []).map((student: any) => ({
        id: student.id,
        user_id: student.user_id,
        name: student.name,
        usn_number: student.usn_number,
        college: student.college,
        results: Array.isArray(student.results) ? student.results[0] || null : student.results || null
      }));
    } else {
      const { students, results } = getLocalData();
      return students.map(student => {
        const res = results.find(r => r.student_id === student.id) || null;
        return {
          ...student,
          results: res
        };
      }).sort((a, b) => a.usn_number.localeCompare(b.usn_number));
    }
  },

  /**
   * Look up a single student by USN (for Student login query)
   */
  async getStudentByUSN(usn: string): Promise<StudentWithResults | null> {
    await delay(600);
    const normalizedUsn = usn.trim().toUpperCase();
    
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, user_id, name, usn_number, college,
          results (
            id, student_id, math_score, python_score, ai_score, chemistry_score, ece_score, total, gpa
          )
        `)
        .eq("usn_number", normalizedUsn)
        .maybeSingle();
        
      if (error) throw new Error(error.message);
      if (!data) return null;
      
      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        usn_number: data.usn_number,
        college: data.college,
        results: Array.isArray(data.results) ? data.results[0] || null : data.results || null
      };
    } else {
      const { students, results } = getLocalData();
      const student = students.find(s => s.usn_number.toUpperCase() === normalizedUsn);
      if (!student) return null;
      
      const res = results.find(r => r.student_id === student.id) || null;
      return {
        ...student,
        results: res
      };
    }
  },

  /**
   * Save (Upsert) student details and core subject marks
   */
  async upsertStudent(
    studentData: Omit<Student, "id"> & { id?: string },
    resultsData: Omit<Results, "id" | "student_id" | "total" | "gpa">
  ): Promise<{ success: boolean; message: string }> {
    await delay(700);
    
    const scores = [
      resultsData.math_score, 
      resultsData.python_score, 
      resultsData.ai_score, 
      resultsData.chemistry_score, 
      resultsData.ece_score
    ];
    if (scores.some(s => s < 0 || s > 100)) {
      return { success: false, message: "Validation error: Scores must be between 0 and 100." };
    }
    
    const normalizedUsn = studentData.usn_number.trim().toUpperCase();
    
    if (isSupabaseConfigured && supabase) {
      const studentId = studentData.id || crypto.randomUUID();
      const isEdit = !!studentData.id;
      
      try {
        // Enforce unique USN checks excluding current student
        const { data: existing } = await supabase
          .from("students")
          .select("id")
          .eq("usn_number", normalizedUsn)
          .neq("id", studentId)
          .maybeSingle();
          
        if (existing) {
          return { success: false, message: `USN Number '${normalizedUsn}' is already allocated to another student.` };
        }

        const { error: studentErr } = await supabase
          .from("students")
          .upsert({
            id: studentId,
            name: studentData.name,
            usn_number: normalizedUsn,
            college: studentData.college,
            user_id: studentData.user_id
          });
          
        if (studentErr) throw new Error(studentErr.message);
        
        const { error: resultsErr } = await supabase
          .from("results")
          .upsert({
            student_id: studentId,
            math_score: resultsData.math_score,
            python_score: resultsData.python_score,
            ai_score: resultsData.ai_score,
            chemistry_score: resultsData.chemistry_score,
            ece_score: resultsData.ece_score
          });
          
        if (resultsErr) throw new Error(resultsErr.message);
        
        return { success: true, message: isEdit ? "Student details updated!" : "Student profile enrolled!" };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    } else {
      const { students, results } = getLocalData();
      const isEdit = !!studentData.id;
      const studentId = studentData.id || `s-${Date.now()}`;
      
      const existing = students.find(s => s.usn_number.toUpperCase() === normalizedUsn);
      if (existing && (!isEdit || existing.id !== studentId)) {
        return { success: false, message: `USN Number '${normalizedUsn}' already exists in database.` };
      }
      
      const sum = scores.reduce((a, b) => a + b, 0);
      const computedGpa = Number((sum / 50.0).toFixed(2));
      
      let updatedStudents = [...students];
      let updatedResults = [...results];
      
      if (isEdit) {
        updatedStudents = updatedStudents.map(s => s.id === studentId ? { ...s, ...studentData, usn_number: normalizedUsn, id: studentId } : s);
        updatedResults = updatedResults.map(r => r.student_id === studentId ? {
          ...r,
          math_score: resultsData.math_score,
          python_score: resultsData.python_score,
          ai_score: resultsData.ai_score,
          chemistry_score: resultsData.chemistry_score,
          ece_score: resultsData.ece_score,
          total: sum,
          gpa: computedGpa
        } : r);
      } else {
        updatedStudents.push({ ...studentData, usn_number: normalizedUsn, id: studentId });
        updatedResults.push({
          id: `r-${Date.now()}`,
          student_id: studentId,
          math_score: resultsData.math_score,
          python_score: resultsData.python_score,
          ai_score: resultsData.ai_score,
          chemistry_score: resultsData.chemistry_score,
          ece_score: resultsData.ece_score,
          total: sum,
          gpa: computedGpa
        });
      }
      
      saveLocalData(updatedStudents, updatedResults);
      return { success: true, message: isEdit ? "Student details updated locally!" : "Student profile enrolled locally!" };
    }
  },

  /**
   * Delete student and results
   */
  async deleteStudent(studentId: string): Promise<{ success: boolean; message: string }> {
    await delay(450);
    
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);
        
      if (error) return { success: false, message: error.message };
      return { success: true, message: "Student record dropped successfully!" };
    } else {
      const { students, results } = getLocalData();
      const updatedStudents = students.filter(s => s.id !== studentId);
      const updatedResults = results.filter(r => r.student_id !== studentId);
      
      saveLocalData(updatedStudents, updatedResults);
      return { success: true, message: "Student record dropped locally!" };
    }
  }
};

/**
 * Calculates dashboard Bento Grid analytics for MATHS, PYTHON, AI, CHEMISTRY, ECE
 */
export function calculateClassInsights(records: StudentWithResults[]): ClassInsights {
  const total = records.length;
  if (total === 0) {
    return {
      total: 0, pass_rate: 0, backlog_count: 0,
      highest_pct: 0, highest_name: "N/A", highest_roll: "N/A",
      lowest_pct: 0, lowest_name: "N/A", lowest_roll: "N/A",
      avg_math: 0, avg_python: 0, avg_ai: 0, avg_chem: 0, avg_ece: 0
    };
  }
  
  let passedCount = 0;
  let backlogCount = 0;
  
  let highestPct = -1;
  let highestStudent = { name: "N/A", usn: "N/A" };
  
  let lowestPct = 101;
  let lowestStudent = { name: "N/A", usn: "N/A" };
  
  let sumMath = 0;
  let sumPython = 0;
  let sumAi = 0;
  let sumChem = 0;
  let sumEce = 0;
  
  records.forEach(student => {
    const res = student.results;
    if (!res) return;
    
    const scores = [res.math_score, res.python_score, res.ai_score, res.chemistry_score, res.ece_score];
    const pct = res.total ? res.total / 5 : 0;
    
    // Student backlog count (score < 40 is a backlog)
    const studentBacklogs = scores.filter(s => s < 40).length;
    if (studentBacklogs > 0) {
      backlogCount++;
    } else {
      passedCount++;
    }
    
    if (pct > highestPct) {
      highestPct = pct;
      highestStudent = { name: student.name, usn: student.usn_number };
    }
    if (pct < lowestPct) {
      lowestPct = pct;
      lowestStudent = { name: student.name, usn: student.usn_number };
    }
    
    sumMath += res.math_score;
    sumPython += res.python_score;
    sumAi += res.ai_score;
    sumChem += res.chemistry_score;
    sumEce += res.ece_score;
  });
  
  return {
    total,
    pass_rate: Number(((passedCount / total) * 100).toFixed(1)),
    backlog_count: backlogCount,
    highest_pct: Number((highestPct === -1 ? 0 : highestPct).toFixed(2)),
    highest_name: highestStudent.name,
    highest_roll: highestStudent.usn,
    lowest_pct: Number((lowestPct === 101 ? 0 : lowestPct).toFixed(2)),
    lowest_name: lowestStudent.name,
    lowest_roll: lowestStudent.usn,
    avg_math: Number((sumMath / total).toFixed(1)),
    avg_python: Number((sumPython / total).toFixed(1)),
    avg_ai: Number((sumAi / total).toFixed(1)),
    avg_chem: Number((sumChem / total).toFixed(1)),
    avg_ece: Number((sumEce / total).toFixed(1))
  };
}
