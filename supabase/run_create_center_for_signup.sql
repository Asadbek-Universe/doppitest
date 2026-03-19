-- Run this in Supabase Dashboard → SQL Editor if you get "Could not find the function create_center_for_signup in the schema cache".
-- Creates the function so center signup works without RLS permission errors.

CREATE OR REPLACE FUNCTION public.create_center_for_signup(center_email text, center_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  center_id uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO center_id FROM public.educational_centers WHERE owner_id = uid LIMIT 1;
  IF center_id IS NOT NULL THEN
    RETURN center_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'center'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET role = 'center', display_name = COALESCE(NULLIF(trim(center_name), ''), display_name), updated_at = now()
  WHERE user_id = uid;

  INSERT INTO public.educational_centers (owner_id, name, email, status, onboarding_completed)
  VALUES (uid, COALESCE(NULLIF(trim(center_name), ''), 'My Center'), NULLIF(trim(center_email), ''), 'pending', false)
  RETURNING id INTO center_id;

  RETURN center_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_center_for_signup(text, text) TO authenticated;
