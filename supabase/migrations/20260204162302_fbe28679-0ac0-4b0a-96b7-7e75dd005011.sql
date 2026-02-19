-- Create question_bookmarks table for persistent bookmark storage
CREATE TABLE public.question_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookmarks
CREATE POLICY "Users can view their own question bookmarks"
ON public.question_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- Only users with 'user' role can add bookmarks (not center/admin)
CREATE POLICY "Users can add question bookmarks"
ON public.question_bookmarks
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'user'::app_role)
);

-- Only users with 'user' role can remove their bookmarks
CREATE POLICY "Users can remove their own question bookmarks"
ON public.question_bookmarks
FOR DELETE
USING (
  auth.uid() = user_id
  AND has_role(auth.uid(), 'user'::app_role)
);

-- Admins can view all bookmarks (read-only for analytics)
CREATE POLICY "Admins can view all question bookmarks"
ON public.question_bookmarks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Centers can view bookmarks for questions in their tests (read-only)
CREATE POLICY "Centers can view bookmarks for their test questions"
ON public.question_bookmarks
FOR SELECT
USING (
  test_id IN (
    SELECT t.id FROM tests t
    WHERE t.center_id IN (
      SELECT ec.id FROM educational_centers ec
      WHERE ec.owner_id = auth.uid()
    )
  )
);

-- Create index for fast lookups
CREATE INDEX idx_question_bookmarks_user_test ON public.question_bookmarks(user_id, test_id);
CREATE INDEX idx_question_bookmarks_user_question ON public.question_bookmarks(user_id, question_id);