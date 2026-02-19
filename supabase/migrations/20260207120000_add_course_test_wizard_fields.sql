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
