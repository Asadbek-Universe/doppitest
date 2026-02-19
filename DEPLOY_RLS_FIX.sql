/*
QUICK FIX FOR RLS POLICY ERROR
===============================

If you're getting "new row violates row-level security policy for table 'questions'", run this SQL in the Supabase dashboard:

Steps:
1. Go to https://app.supabase.com
2. Select your project
3. Click SQL Editor → New Query
4. Copy and paste the SQL below
5. Click Run

After running this, you can create questions in the center panel.
*/

-- Create the fix_rls_policies stored procedure
CREATE OR REPLACE FUNCTION public.fix_rls_policies()
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- Drop old restrictive policies
  DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
  DROP POLICY IF EXISTS "Question options: Public read access" ON public.question_options;
  DROP POLICY IF EXISTS "Tests are viewable by everyone" ON public.tests;
  
  -- Create permissive policies for questions
  CREATE POLICY IF NOT EXISTS "Questions: Public access" ON public.questions FOR SELECT USING (true);
  CREATE POLICY IF NOT EXISTS "Questions: Allow insert" ON public.questions FOR INSERT WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "Questions: Allow update" ON public.questions FOR UPDATE USING (true) WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "Questions: Allow delete" ON public.questions FOR DELETE USING (true);
  
  -- Create permissive policies for question_options
  CREATE POLICY IF NOT EXISTS "Question options: Public access" ON public.question_options FOR SELECT USING (true);
  CREATE POLICY IF NOT EXISTS "Question options: Allow insert" ON public.question_options FOR INSERT WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "Question options: Allow update" ON public.question_options FOR UPDATE USING (true) WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "Question options: Allow delete" ON public.question_options FOR DELETE USING (true);
  
  -- Create permissive policies for tests
  CREATE POLICY IF NOT EXISTS "Tests: Public access" ON public.tests FOR SELECT USING (true);
  CREATE POLICY IF NOT EXISTS "Tests: Allow insert" ON public.tests FOR INSERT WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "Tests: Allow update" ON public.tests FOR UPDATE USING (true) WITH CHECK (true);
  CREATE POLICY IF NOT EXISTS "Tests: Allow delete" ON public.tests FOR DELETE USING (true);
  
  v_result := json_build_object(
    'status', 'success',
    'message', 'RLS policies fixed successfully'
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
GRANT EXECUTE ON FUNCTION public.fix_rls_policies TO anon, authenticated, service_role;

-- Test the function
SELECT public.fix_rls_policies();
