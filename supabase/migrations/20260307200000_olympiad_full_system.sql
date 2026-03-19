-- Olympiad full system: extended config, questions, attempts, status flow
-- Status: draft | submitted | approved | scheduled | active | completed | archived
-- Centers cannot publish without admin approval.

-- 1) Extend olympiads with advanced configuration
ALTER TABLE public.olympiads
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS difficulty_level text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS registration_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS auto_submit_when_time_ends boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_back_navigation boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS shuffle_questions boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS shuffle_options boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_results_immediately boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_correct_after_submit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS anti_cheat_disable_copy_paste boolean DEFAULT true;

-- 2) Olympiad questions (per-olympiad, not tied to tests)
CREATE TABLE IF NOT EXISTS public.olympiad_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  olympiad_id uuid NOT NULL REFERENCES public.olympiads(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_answer', 'image_based')),
  question_text text NOT NULL,
  image_url text,
  options jsonb DEFAULT '[]',
  correct_answer jsonb,
  points integer NOT NULL DEFAULT 1,
  topic text,
  difficulty text,
  explanation text,
  section text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_olympiad_questions_olympiad ON public.olympiad_questions(olympiad_id);

-- 3) Olympiad attempts (one per user per olympiad; stores score, time, status)
CREATE TABLE IF NOT EXISTS public.olympiad_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  olympiad_id uuid NOT NULL REFERENCES public.olympiads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  time_spent_seconds integer,
  score numeric,
  total_points numeric,
  correct_count integer,
  wrong_count integer,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'auto_submitted')),
  answers_snapshot jsonb,
  UNIQUE(olympiad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_olympiad_attempts_olympiad ON public.olympiad_attempts(olympiad_id);
CREATE INDEX IF NOT EXISTS idx_olympiad_attempts_user ON public.olympiad_attempts(user_id);

-- 4) RLS for olympiad_questions
ALTER TABLE public.olympiad_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Center and admin manage olympiad questions" ON public.olympiad_questions;
CREATE POLICY "Center and admin manage olympiad questions"
ON public.olympiad_questions FOR ALL
TO authenticated
USING (
  olympiad_id IN (SELECT id FROM public.olympiads WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  olympiad_id IN (SELECT id FROM public.olympiads WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users read published olympiad questions" ON public.olympiad_questions;
CREATE POLICY "Users read published olympiad questions"
ON public.olympiad_questions FOR SELECT
TO authenticated
USING (
  olympiad_id IN (SELECT id FROM public.olympiads WHERE is_published = true AND approval_status = 'published')
  OR olympiad_id IN (SELECT id FROM public.olympiads WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 5) RLS for olympiad_attempts
ALTER TABLE public.olympiad_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own olympiad attempts" ON public.olympiad_attempts;
CREATE POLICY "Users manage own olympiad attempts"
ON public.olympiad_attempts FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Center and admin read olympiad attempts" ON public.olympiad_attempts;
CREATE POLICY "Center and admin read olympiad attempts"
ON public.olympiad_attempts FOR SELECT
TO authenticated
USING (
  olympiad_id IN (SELECT id FROM public.olympiads WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

COMMENT ON TABLE public.olympiad_questions IS 'Questions belonging to an olympiad; types: single_choice, multiple_choice, true_false, short_answer, image_based';
COMMENT ON TABLE public.olympiad_attempts IS 'One attempt per user per olympiad; stores score, time, status for leaderboard and analytics';
