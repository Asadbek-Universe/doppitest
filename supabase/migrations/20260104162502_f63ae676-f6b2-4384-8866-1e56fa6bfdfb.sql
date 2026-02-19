-- Add policies for admins to manage subjects
CREATE POLICY "Admins can insert subjects"
ON public.subjects
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update subjects"
ON public.subjects
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subjects"
ON public.subjects
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));