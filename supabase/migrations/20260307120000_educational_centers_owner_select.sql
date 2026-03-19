-- Ensure center owners can always select their own educational_centers row.
-- (Existing "Centers are viewable by everyone" already allows SELECT; this is a fallback.)
BEGIN;
DROP POLICY IF EXISTS "Center owners can select own" ON public.educational_centers;
CREATE POLICY "Center owners can select own"
ON public.educational_centers
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);
COMMIT;
