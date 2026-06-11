-- Connected Student & Admin Result Portals Schema Setup
-- Supabase PostgreSQL Script with Row Level Security (RLS) Disabled for Direct Anon CRUD

-- 1. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- Link to Auth user (optional)
    name TEXT NOT NULL,
    usn_number TEXT UNIQUE NOT NULL, -- University Seat Number (USN)
    college TEXT NOT NULL,           -- Student College name
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Results Table with 5 requested subjects
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

-- 3. Disable Row Level Security (RLS) to allow direct browser anon CRUD from Faculty Console
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.results DISABLE ROW LEVEL SECURITY;

-- 3b. Just in case RLS is enabled, create permissive policies to allow anonymous read/write/update/delete
DROP POLICY IF EXISTS "Allow public read" ON public.students;
DROP POLICY IF EXISTS "Allow public insert" ON public.students;
DROP POLICY IF EXISTS "Allow public update" ON public.students;
DROP POLICY IF EXISTS "Allow public delete" ON public.students;

CREATE POLICY "Allow public read" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.students FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON public.results;
DROP POLICY IF EXISTS "Allow public insert" ON public.results;
DROP POLICY IF EXISTS "Allow public update" ON public.results;
DROP POLICY IF EXISTS "Allow public delete" ON public.results;

CREATE POLICY "Allow public read" ON public.results FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.results FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.results FOR DELETE USING (true);

-- 4. Seed Initial Student Records from your console
INSERT INTO public.students (id, name, usn_number, college)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'BHARATH N', '1RM25CS008', 'RATHINAM INSTITUTE OF TECHNOLOGY'),
  ('f7e6d5c4-b3a2-1a0e-9d8c-7b6a5f4e3d2c', 'KRUSHANTH M', '1RM25CS023', 'RATHINAM INSTITUTE OF TECHNOLOGY')
ON CONFLICT (usn_number) DO NOTHING;

INSERT INTO public.results (student_id, math_score, python_score, ai_score, chemistry_score, ece_score)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 61, 44, 41, 62, 56),
  ('f7e6d5c4-b3a2-1a0e-9d8c-7b6a5f4e3d2c', 99, 99, 99, 99, 98)
ON CONFLICT (student_id) DO NOTHING;
