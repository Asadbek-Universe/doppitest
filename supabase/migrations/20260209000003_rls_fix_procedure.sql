-- Create a stored procedure to fix RLS policies
-- This procedure can be called from the frontend to auto-fix the RLS issues

CREATE OR REPLACE FUNCTION public.fix_rls_policies()
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- Drop old restrictive policies
  DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
  DROP POLICY IF EXISTS "Question options: Public read access" ON public.question_options;
  DROP POLICY IF EXISTS "Tests are viewable by everyone" ON public.tests;
  
  -- Drop existing permissive policies (in case they were already created)
  DROP POLICY IF EXISTS "Questions: Public access" ON public.questions;
  DROP POLICY IF EXISTS "Questions: Allow insert" ON public.questions;
  DROP POLICY IF EXISTS "Questions: Allow update" ON public.questions;
  DROP POLICY IF EXISTS "Questions: Allow delete" ON public.questions;
  DROP POLICY IF EXISTS "Question options: Public access" ON public.question_options;
  DROP POLICY IF EXISTS "Question options: Allow insert" ON public.question_options;
  DROP POLICY IF EXISTS "Question options: Allow update" ON public.question_options;
  DROP POLICY IF EXISTS "Question options: Allow delete" ON public.question_options;
  DROP POLICY IF EXISTS "Tests: Public access" ON public.tests;
  DROP POLICY IF EXISTS "Tests: Allow insert" ON public.tests;
  DROP POLICY IF EXISTS "Tests: Allow update" ON public.tests;
  DROP POLICY IF EXISTS "Tests: Allow delete" ON public.tests;
  
  -- Create permissive policies for questions
  CREATE POLICY "Questions: Public access" ON public.questions FOR SELECT USING (true);
  CREATE POLICY "Questions: Allow insert" ON public.questions FOR INSERT WITH CHECK (true);
  CREATE POLICY "Questions: Allow update" ON public.questions FOR UPDATE USING (true) WITH CHECK (true);
  CREATE POLICY "Questions: Allow delete" ON public.questions FOR DELETE USING (true);
  
  -- Create permissive policies for question_options
  CREATE POLICY "Question options: Public access" ON public.question_options FOR SELECT USING (true);
  CREATE POLICY "Question options: Allow insert" ON public.question_options FOR INSERT WITH CHECK (true);
  CREATE POLICY "Question options: Allow update" ON public.question_options FOR UPDATE USING (true) WITH CHECK (true);
  CREATE POLICY "Question options: Allow delete" ON public.question_options FOR DELETE USING (true);
  
  -- Create permissive policies for tests
  CREATE POLICY "Tests: Public access" ON public.tests FOR SELECT USING (true);
  CREATE POLICY "Tests: Allow insert" ON public.tests FOR INSERT WITH CHECK (true);
  CREATE POLICY "Tests: Allow update" ON public.tests FOR UPDATE USING (true) WITH CHECK (true);
  CREATE POLICY "Tests: Allow delete" ON public.tests FOR DELETE USING (true);
  
  v_result := json_build_object(
    'status', 'success',
    'message', 'RLS policies fixed'
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object(
    'status', 'error',
    'message', SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to all users
GRANT EXECUTE ON FUNCTION public.fix_rls_policies TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fix_rls_policies TO service_role;
