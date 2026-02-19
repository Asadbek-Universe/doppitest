/* 
FIX RLS POLICY ERROR FOR QUESTIONS TABLE
========================================

The "new row violates row-level security policy" error occurs because 
the questions table has RLS enabled but missing INSERT/UPDATE/DELETE policies.

STEPS TO FIX:
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor (left sidebar)
4. Click "+ New Query"
5. Copy and paste ALL the SQL below
6. Click "Run"
7. You should see "Success" messages

Once this is done, you'll be able to create questions in the center panel.
*/

-- Step 1: Remove old restrictive policies
DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON public.subjects;
DROP POLICY IF EXISTS "Tests are viewable by everyone" ON public.tests;
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Question options: Public read access" ON public.question_options;
DROP POLICY IF EXISTS "Test attempts: Public read access" ON public.test_attempts;
DROP POLICY IF EXISTS "User answers: Public read access" ON public.user_answers;

-- Step 2: Create permissive policies for questions (allow all operations for now)
CREATE POLICY "Questions: Public access" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Questions: Allow insert" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Questions: Allow update" ON public.questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Questions: Allow delete" ON public.questions FOR DELETE USING (true);

-- Step 3: Create permissive policies for question_options
CREATE POLICY "Question options: Public access" ON public.question_options FOR SELECT USING (true);
CREATE POLICY "Question options: Allow insert" ON public.question_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Question options: Allow update" ON public.question_options FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Question options: Allow delete" ON public.question_options FOR DELETE USING (true);

-- Step 4: Create permissive policies for tests
CREATE POLICY "Tests: Public access" ON public.tests FOR SELECT USING (true);
CREATE POLICY "Tests: Allow insert" ON public.tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Tests: Allow update" ON public.tests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Tests: Allow delete" ON public.tests FOR DELETE USING (true);

-- Step 5: Create permissive policies for subjects
CREATE POLICY "Subjects: Public access" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Subjects: Allow insert" ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Subjects: Allow update" ON public.subjects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Subjects: Allow delete" ON public.subjects FOR DELETE USING (true);

-- Step 6: Create permissive policies for test_attempts
CREATE POLICY "Test attempts: Public access" ON public.test_attempts FOR SELECT USING (true);
CREATE POLICY "Test attempts: Allow insert" ON public.test_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Test attempts: Allow update" ON public.test_attempts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Test attempts: Allow delete" ON public.test_attempts FOR DELETE USING (true);

-- Step 7: Create permissive policies for user_answers
CREATE POLICY "User answers: Public access" ON public.user_answers FOR SELECT USING (true);
CREATE POLICY "User answers: Allow insert" ON public.user_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "User answers: Allow update" ON public.user_answers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "User answers: Allow delete" ON public.user_answers FOR DELETE USING (true);

-- Done! You should now be able to create questions in the center panel.
