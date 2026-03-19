-- User onboarding: extra fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weak_subjects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goals text,
  ADD COLUMN IF NOT EXISTS study_time_per_day_minutes integer,
  ADD COLUMN IF NOT EXISTS preparing_for_olympiads boolean DEFAULT false;

-- Center onboarding: extra fields on educational_centers
ALTER TABLE public.educational_centers
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS grades_served text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages_supported text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS teachers_count integer;
