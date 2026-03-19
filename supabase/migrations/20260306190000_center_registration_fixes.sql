-- Center registration: allow new users to assign themselves the center role during signup.
-- Without this, user_roles INSERT is only allowed for admins, so center signup failed with RLS.
-- Registration order: 1) auth signUp 2) user_roles insert (role=center) 3) educational_centers insert 4) profiles upsert.
BEGIN;

-- Allow authenticated users to insert their own role row for signup (center or user only, not admin).
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('center', 'user'));

COMMIT;
