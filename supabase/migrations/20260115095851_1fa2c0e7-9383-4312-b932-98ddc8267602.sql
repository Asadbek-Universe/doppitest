-- Add indexes for faster sorting queries on featured content

-- Index for sorting tests by completions (featured tests)
CREATE INDEX IF NOT EXISTS idx_tests_completions ON public.tests (completions DESC NULLS LAST);

-- Index for sorting courses by students_count (featured courses)
CREATE INDEX IF NOT EXISTS idx_courses_students_count ON public.courses (students_count DESC NULLS LAST);

-- Index for sorting reels by views_count (featured reels)
CREATE INDEX IF NOT EXISTS idx_center_reels_views_count ON public.center_reels (views_count DESC NULLS LAST);

-- Index for sorting centers by followers_count (featured centers)
CREATE INDEX IF NOT EXISTS idx_educational_centers_followers_count ON public.educational_centers (followers_count DESC NULLS LAST);