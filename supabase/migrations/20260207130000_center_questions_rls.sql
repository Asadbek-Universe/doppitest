-- Allow centers to add/edit/delete questions for their own tests
-- and to add/edit/delete lessons for their own courses.
-- (RLS previously only had SELECT; INSERT/UPDATE/DELETE were missing)

-- Lessons: centers can manage lessons for courses they own
CREATE POLICY "Centers can insert lessons for their courses"
ON public.lessons
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
      AND c.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Centers can update lessons for their courses"
ON public.lessons
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
      AND c.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Centers can delete lessons for their courses"
ON public.lessons
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
      AND c.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

-- Questions: centers can manage questions for tests they own
CREATE POLICY "Centers can insert questions for their tests"
ON public.questions
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Centers can update questions for their tests"
ON public.questions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Centers can delete questions for their tests"
ON public.questions
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

-- Question options: centers can manage options for questions in their tests
CREATE POLICY "Centers can insert options for their test questions"
ON public.question_options
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = question_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Centers can update options for their test questions"
ON public.question_options
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = question_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Centers can delete options for their test questions"
ON public.question_options
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = question_id
      AND t.center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid())
  )
);
