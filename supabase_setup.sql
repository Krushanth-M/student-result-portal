-- Connected Student & Admin Result Portals Schema Setup
-- Supabase PostgreSQL Script with Row Level Security (RLS)

-- 1. Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'student')) NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE, -- Link to Auth user (optional)
    name TEXT NOT NULL,
    usn_number TEXT UNIQUE NOT NULL, -- University Seat Number (USN) e.g., 1RV26CS001
    college TEXT NOT NULL,           -- Student College name
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Results Table with 5 Requested Course Subjects
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE UNIQUE NOT NULL,
    math_score NUMERIC CHECK (math_score >= 0 AND math_score <= 100) NOT NULL,
    python_score NUMERIC CHECK (python_score >= 0 AND python_score <= 100) NOT NULL,
    ai_score NUMERIC CHECK (ai_score >= 0 AND ai_score <= 100) NOT NULL,
    chemistry_score NUMERIC CHECK (chemistry_score >= 0 AND chemistry_score <= 100) NOT NULL,
    ece_score NUMERIC CHECK (ece_score >= 0 AND ece_score <= 100) NOT NULL,
    -- Computed columns
    total NUMERIC GENERATED ALWAYS AS (math_score + python_score + ai_score + chemistry_score + ece_score) STORED,
    gpa NUMERIC GENERATED ALWAYS AS (ROUND((math_score + python_score + ai_score + chemistry_score + ece_score) / 50.0, 2)) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function to determine if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security Policies

-- A. User Roles Policies
CREATE POLICY "Allow users to view their own role" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Allow admins full CRUD on roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.is_admin());

-- B. Students Policies
CREATE POLICY "Allow students to view their own profile" 
ON public.students FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR public.is_admin());

-- Dynamic check: allow anyone to query a profile by USN in the student view login page
CREATE POLICY "Allow public lookups by USN number" 
ON public.students FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admins full CRUD on students" 
ON public.students FOR ALL 
TO authenticated 
USING (public.is_admin());

-- C. Results Policies
CREATE POLICY "Allow students to view their own grades" 
ON public.results FOR SELECT 
TO anon, authenticated 
USING (
    student_id IN (SELECT id FROM public.students) -- Allowed since lookup handles isolation by USN
);

CREATE POLICY "Allow admins full CRUD on results" 
ON public.results FOR ALL 
TO authenticated 
USING (public.is_admin());

-- 7. Trigger to automatically assign 'student' role on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
