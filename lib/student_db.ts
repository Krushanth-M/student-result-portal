/**
 * Student Result Portal - API & Fallback Mock Database Engine (USN-Based)
 * ---------------------------------------------------------------------
 * Handles database operations for students (demographics) and their results.
 * Integrates Supabase and local storage fallbacks. Supports customizable subjects.
 */

import { createClient } from "@supabase/supabase-js";

// 1. Interfaces & Types
export interface Student {
  id: string;
  user_id?: string;
  name: string;
  usn_number: string; // University Seat Number
  college: string;     // College Name
  year: number;        // Year (1, 2, 3, 4)
  semester: number;    // Semester (1, 2)
  created_at?: string;
}

export interface Results {
  id: string;
  student_id: string;
  subject_scores: Record<string, number>; // Dynamic scores mapping of subject_id -> score
  created_at?: string;
}

export interface StudentWithResults extends Student {
  results: Results | null;
}

export interface SubjectConfig {
  id: string;
  code: string;
  name: string;
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
  avg_subjects: Record<string, number>; // Dynamic average per subject_id
}

// 2. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://czavqapcmoeghxpygzfn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YXZxYXBjbW9lZ2h4cHlnemZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODU4MzAsImV4cCI6MjA5Njc2MTgzMH0.TobwXc_bMwZ24KwV_vhmEprhVM70wvooMZssgSHV1p4";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = (() => {
  try {
    return isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
  } catch {
    return null;
  }
})();

// 3. Default subjects config
export const DEFAULT_SUBJECTS: SubjectConfig[] = [
  { id: "sub_1", code: "10MAT21", name: "MATHEMATICS" },
  { id: "sub_2", code: "10CS22", name: "PYTHON PROGRAMMING" },
  { id: "sub_3", code: "10AI23", name: "INTRODUCTION TO AI" },
  { id: "sub_4", code: "10CH24", name: "ENGINEERING CHEMISTRY" },
  { id: "sub_5", code: "10EC25", name: "ELECTRONICS & COMMUNICATION" },
  { id: "sub_6", code: "10COM26", name: "COMMUNICATION SKILLS" },
  { id: "sub_7", code: "10CON27", name: "INDIAN CONSTITUTION" }
];

// 4. Dummy Seed Data
const DUMMY_STUDENTS: Student[] = [
  { id: "s1", name: "BHARATH N", usn_number: "1RM25CS008", college: "Rathinam Institute of Technology", year: 2, semester: 1 },
  { id: "s2", name: "KRUSHANTH M", usn_number: "1RM25CS023", college: "Rathinam Institute of Technology", year: 3, semester: 2 }
];

const DUMMY_RESULTS: Results[] = [
  { id: "r1", student_id: "s1", subject_scores: { "sub_1": 61, "sub_2": 44, "sub_3": 41, "sub_4": 62, "sub_5": 56, "sub_6": 70, "sub_7": 65 } },
  { id: "r2", student_id: "s2", subject_scores: { "sub_1": 99, "sub_2": 99, "sub_3": 99, "sub_4": 99, "sub_5": 98, "sub_6": 99, "sub_7": 97 } }
];

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

const getLocalData = (): { students: Student[]; results: Results[]; subjects: SubjectConfig[] } => {
  if (typeof window === "undefined") {
    return { students: DUMMY_STUDENTS, results: DUMMY_RESULTS, subjects: DEFAULT_SUBJECTS };
  }
  const studentsRaw = localStorage.getItem("sp2_students");
  const resultsRaw = localStorage.getItem("sp2_results");
  const subjectsRaw = localStorage.getItem("sp2_subjects");
  
  if (!studentsRaw || !resultsRaw || !subjectsRaw) {
    localStorage.setItem("sp2_students", JSON.stringify(DUMMY_STUDENTS));
    localStorage.setItem("sp2_results", JSON.stringify(DUMMY_RESULTS));
    localStorage.setItem("sp2_subjects", JSON.stringify(DEFAULT_SUBJECTS));
    return { students: DUMMY_STUDENTS, results: DUMMY_RESULTS, subjects: DEFAULT_SUBJECTS };
  }
  
  return {
    students: JSON.parse(studentsRaw),
    results: JSON.parse(resultsRaw),
    subjects: JSON.parse(subjectsRaw)
  };
};

const saveLocalData = (students: Student[], results: Results[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("sp2_students", JSON.stringify(students));
  localStorage.setItem("sp2_results", JSON.stringify(results));
};

// 5. API Endpoints
export const api = {
  /**
   * Fetch all subjects configuration
   */
  async getSubjects(): Promise<SubjectConfig[]> {
    await delay(300);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("portal_settings")
          .select("value")
          .eq("key", "subjects")
          .maybeSingle();
        if (error) throw error;
        if (data && Array.isArray(data.value)) {
          return data.value as SubjectConfig[];
        }
      } catch (err) {
        console.error("Error loading subjects settings from Supabase:", err);
      }
    } else {
      const { subjects } = getLocalData();
      return subjects;
    }
    return DEFAULT_SUBJECTS;
  },

  /**
   * Save subjects configuration
   */
  async saveSubjects(subjects: SubjectConfig[]): Promise<boolean> {
    await delay(300);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("portal_settings")
          .upsert({ key: "subjects", value: subjects });
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Error saving subjects configuration:", err);
        return false;
      }
    } else {
      if (typeof window !== "undefined") {
        localStorage.setItem("sp2_subjects", JSON.stringify(subjects));
        return true;
      }
      return false;
    }
  },

  /**
   * Fetches all students with results (for Teacher/Admin ledger)
   */
  async getStudentsWithResults(): Promise<StudentWithResults[]> {
    await delay(500);
    
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, user_id, name, usn_number, college, year, semester,
          results (
            id, student_id, subject_scores
          )
        `)
        .order("usn_number");
        
      if (error) throw new Error(error.message);
      
      return (data || []).map((student: any) => {
        const res = Array.isArray(student.results) ? student.results[0] : student.results;
        return {
          id: student.id,
          user_id: student.user_id,
          name: student.name,
          usn_number: student.usn_number,
          college: student.college,
          year: student.year || 1,
          semester: student.semester || 1,
          results: res ? {
            id: res.id,
            student_id: res.student_id,
            subject_scores: res.subject_scores || {}
          } : null
        };
      });
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
          id, user_id, name, usn_number, college, year, semester,
          results (
            id, student_id, subject_scores
          )
        `)
        .eq("usn_number", normalizedUsn)
        .maybeSingle();
        
      if (error) throw new Error(error.message);
      if (!data) return null;
      
      const res = Array.isArray(data.results) ? data.results[0] : data.results;
      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        usn_number: data.usn_number,
        college: data.college,
        year: data.year || 1,
        semester: data.semester || 1,
        results: res ? {
          id: res.id,
          student_id: res.student_id,
          subject_scores: res.subject_scores || {}
        } : null
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
    studentData: Omit<Student, "id" | "college"> & { id?: string; college?: string },
    subjectScores: Record<string, number>
  ): Promise<{ success: boolean; message: string }> {
    await delay(700);
    
    for (const key in subjectScores) {
      const score = subjectScores[key];
      if (score < 0 || score > 100) {
        return { success: false, message: "Validation error: Scores must be between 0 and 100." };
      }
    }
    
    const normalizedUsn = studentData.usn_number.trim().toUpperCase();
    const collegeName = "Rathinam Institute of Technology";
    
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
            college: collegeName,
            year: studentData.year || 1,
            semester: studentData.semester || 1,
            user_id: studentData.user_id
          });
          
        if (studentErr) throw new Error(studentErr.message);
        
        const { error: resultsErr } = await supabase
          .from("results")
          .upsert({
            student_id: studentId,
            subject_scores: subjectScores
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
      
      let updatedStudents = [...students];
      let updatedResults = [...results];
      
      if (isEdit) {
        updatedStudents = updatedStudents.map(s => s.id === studentId ? { 
          ...s, 
          name: studentData.name, 
          usn_number: normalizedUsn, 
          college: collegeName, 
          year: studentData.year || 1, 
          semester: studentData.semester || 1 
        } : s);
        updatedResults = updatedResults.map(r => r.student_id === studentId ? {
          ...r,
          subject_scores: subjectScores
        } : r);
      } else {
        updatedStudents.push({ 
          id: studentId, 
          name: studentData.name, 
          usn_number: normalizedUsn, 
          college: collegeName, 
          year: studentData.year || 1, 
          semester: studentData.semester || 1 
        });
        updatedResults.push({
          id: `r-${Date.now()}`,
          student_id: studentId,
          subject_scores: subjectScores
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
 * Calculates dashboard Bento Grid analytics dynamically based on configured subjects
 */
export function calculateClassInsights(records: StudentWithResults[], activeSubjects: SubjectConfig[]): ClassInsights {
  const total = records.length;
  
  const avg_subjects: Record<string, number> = {};
  activeSubjects.forEach(s => {
    avg_subjects[s.id] = 0;
  });

  if (total === 0) {
    return {
      total: 0, pass_rate: 0, backlog_count: 0,
      highest_pct: 0, highest_name: "N/A", highest_roll: "N/A",
      lowest_pct: 0, lowest_name: "N/A", lowest_roll: "N/A",
      avg_subjects
    };
  }
  
  let passedCount = 0;
  let backlogCount = 0;
  
  let highestPct = -1;
  let highestStudent = { name: "N/A", usn: "N/A" };
  
  let lowestPct = 101;
  let lowestStudent = { name: "N/A", usn: "N/A" };
  
  const subjectSums: Record<string, number> = {};
  activeSubjects.forEach(s => {
    subjectSums[s.id] = 0;
  });
  
  records.forEach(student => {
    const res = student.results;
    if (!res) return;
    
    const scores = activeSubjects.map(s => res.subject_scores[s.id] ?? 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    const pct = activeSubjects.length > 0 ? sum / activeSubjects.length : 0;
    
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
    
    activeSubjects.forEach(s => {
      subjectSums[s.id] += res.subject_scores[s.id] ?? 0;
    });
  });
  
  activeSubjects.forEach(s => {
    avg_subjects[s.id] = Number((subjectSums[s.id] / total).toFixed(1));
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
    avg_subjects
  };
}
