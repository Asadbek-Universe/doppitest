-- Run this SQL in the Supabase SQL Editor to fix the RLS issue preventing question creation
-- Dashboard: https://app.supabase.com/project/{project-id}/sql/new

-- Disable RLS on questions table to allow questions to be created
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on question_options table
ALTER TABLE public.question_options DISABLE ROW LEVEL SECURITY;

-- Disable RLS on tests table  
ALTER TABLE public.tests DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with permissive policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for questions (everyone can do anything - for dev/demo)
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create questions" ON public.questions;
CREATE POLICY "Anyone can create questions" ON public.questions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update questions" ON public.questions;
CREATE POLICY "Anyone can update questions" ON public.questions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete questions" ON public.questions;
CREATE POLICY "Anyone can delete questions" ON public.questions FOR DELETE USING (true);

-- Add permissive policies for question_options
DROP POLICY IF EXISTS "Options are viewable by everyone" ON public.question_options;
CREATE POLICY "Options are viewable by everyone" ON public.question_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create options" ON public.question_options;
CREATE POLICY "Anyone can create options" ON public.question_options FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update options" ON public.question_options;
CREATE POLICY "Anyone can update options" ON public.question_options FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete options" ON public.question_options;
CREATE POLICY "Anyone can delete options" ON public.question_options FOR DELETE USING (true);

-- Add permissive policies for tests
DROP POLICY IF EXISTS "Tests are viewable by everyone" ON public.tests;
CREATE POLICY "Tests are viewable by everyone" ON public.tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create tests" ON public.tests;
CREATE POLICY "Anyone can create tests" ON public.tests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update tests" ON public.tests;
CREATE POLICY "Anyone can update tests" ON public.tests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete tests" ON public.tests;
CREATE POLICY "Anyone can delete tests" ON public.tests FOR DELETE USING (true);
