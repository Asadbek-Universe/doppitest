-- Allow admins to audit user activity across user-owned tables

-- saved_items
DO $$ BEGIN
  CREATE POLICY "Admins can view all saved items"
  ON public.saved_items
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- test_attempts
DO $$ BEGIN
  CREATE POLICY "Admins can view all test attempts"
  ON public.test_attempts
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- course_enrollments
DO $$ BEGIN
  CREATE POLICY "Admins can view all course enrollments"
  ON public.course_enrollments
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- lesson_progress
DO $$ BEGIN
  CREATE POLICY "Admins can view all lesson progress"
  ON public.lesson_progress
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
