-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor → New query
-- Apply in order: 1) wizard fields, 2) publish validation, 3) RLS
-- ============================================================

-- 1) Course/Test wizard fields
-- Course: level and language for wizard/listing
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level text CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Test: total marks, attempts limit, passing score, randomization
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS total_marks integer,
  ADD COLUMN IF NOT EXISTS max_attempts integer,
  ADD COLUMN IF NOT EXISTS passing_score_percent integer CHECK (passing_score_percent IS NULL OR (passing_score_percent >= 0 AND passing_score_percent <= 100)),
  ADD COLUMN IF NOT EXISTS shuffle_questions boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.courses.level IS 'Course level: beginner, intermediate, advanced';
COMMENT ON COLUMN public.courses.language IS 'Content language code (e.g. en, uz)';
COMMENT ON COLUMN public.tests.total_marks IS 'Sum of question points; used for scoring';
COMMENT ON COLUMN public.tests.max_attempts IS 'Max attempts per user (null = unlimited)';
COMMENT ON COLUMN public.tests.passing_score_percent IS 'Required % to pass (0-100)';
COMMENT ON COLUMN public.tests.shuffle_questions IS 'Randomize question order for each attempt';

-- 2) Publish validation (course needs lessons; test needs questions with correct answer)
CREATE OR REPLACE FUNCTION public.check_course_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true THEN
    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = NEW.id LIMIT 1) THEN
      NEW.is_published := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_course_publish ON public.courses;
CREATE TRIGGER enforce_course_publish
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  WHEN (OLD.is_published IS DISTINCT FROM NEW.is_published AND NEW.is_published = true)
  EXECUTE FUNCTION public.check_course_publish();

CREATE OR REPLACE FUNCTION public.check_test_publish()
RETURNS TRIGGER AS $$
DECLARE
  q_count int;
  valid_count int;
BEGIN
  IF NEW.is_published = true THEN
    SELECT COUNT(*) INTO q_count FROM public.questions WHERE test_id = NEW.id;
    IF q_count = 0 THEN
      NEW.is_published := false;
    ELSE
      SELECT COUNT(*) INTO valid_count
      FROM public.questions q
      WHERE q.test_id = NEW.id
        AND EXISTS (SELECT 1 FROM public.question_options o WHERE o.question_id = q.id AND o.is_correct = true);
      IF valid_count < q_count THEN
        NEW.is_published := false;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_test_publish ON public.tests;
CREATE TRIGGER enforce_test_publish
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  WHEN (OLD.is_published IS DISTINCT FROM NEW.is_published AND NEW.is_published = true)
  EXECUTE FUNCTION public.check_test_publish();

-- Lessons
DROP POLICY IF EXISTS "Centers can insert lessons for their courses" ON public.lessons;
CREATE POLICY "Centers can insert lessons for their courses"
ON public.lessons FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
      AND c.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Centers can update lessons for their courses" ON public.lessons;
CREATE POLICY "Centers can update lessons for their courses"
ON public.lessons FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
      AND c.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Centers can delete lessons for their courses" ON public.lessons;
CREATE POLICY "Centers can delete lessons for their courses"
ON public.lessons FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
      AND c.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

-- Questions
DROP POLICY IF EXISTS "Centers can insert questions for their tests" ON public.questions;
CREATE POLICY "Centers can insert questions for their tests"
ON public.questions FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Centers can update questions for their tests" ON public.questions;
CREATE POLICY "Centers can update questions for their tests"
ON public.questions FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Centers can delete questions for their tests" ON public.questions;
CREATE POLICY "Centers can delete questions for their tests"
ON public.questions FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

-- Question options
DROP POLICY IF EXISTS "Centers can insert options for their test questions" ON public.question_options;
CREATE POLICY "Centers can insert options for their test questions"
ON public.question_options FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = question_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Centers can update options for their test questions" ON public.question_options;
CREATE POLICY "Centers can update options for their test questions"
ON public.question_options FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = question_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Centers can delete options for their test questions" ON public.question_options;
CREATE POLICY "Centers can delete options for their test questions"
ON public.question_options FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = question_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);
