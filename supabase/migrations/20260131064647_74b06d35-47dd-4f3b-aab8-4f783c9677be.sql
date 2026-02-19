-- Add is_published field to tests table
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Add is_published field to courses table  
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Add is_published field to olympiads table (if not exists)
ALTER TABLE public.olympiads 
ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Set existing content with questions/lessons as published (migration for existing data)
UPDATE public.tests 
SET is_published = true 
WHERE questions_count > 0;

UPDATE public.courses 
SET is_published = true 
WHERE lessons_count > 0 AND title IS NOT NULL AND description IS NOT NULL;

UPDATE public.olympiads 
SET is_published = true 
WHERE is_public = true AND title IS NOT NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tests_published ON public.tests (is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses (is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_olympiads_published ON public.olympiads (is_published) WHERE is_published = true;

-- Add comment for clarity
COMMENT ON COLUMN public.tests.is_published IS 'Content is only visible to public when published and has questions';
COMMENT ON COLUMN public.courses.is_published IS 'Content is only visible to public when published and has lessons';
COMMENT ON COLUMN public.olympiads.is_published IS 'Content is only visible to public when published';