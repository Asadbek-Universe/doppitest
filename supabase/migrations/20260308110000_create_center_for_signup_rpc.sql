-- Allow center creation during signup via RPC (bypasses RLS); ensures user_roles + profiles + educational_centers in one place.

-- Signature (center_email, center_name) matches schema cache / client call order
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

  -- If they already have a center, return it
  SELECT id INTO center_id FROM public.educational_centers WHERE owner_id = uid LIMIT 1;
  IF center_id IS NOT NULL THEN
    RETURN center_id;
  END IF;

  -- Ensure center role exists (in case trigger didn't run or metadata wasn't set)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'center'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Ensure profile has center role
  UPDATE public.profiles
  SET role = 'center', display_name = COALESCE(NULLIF(trim(center_name), ''), display_name), updated_at = now()
  WHERE user_id = uid;

  -- Create the center (name is NOT NULL; fallback to placeholder if empty)
  INSERT INTO public.educational_centers (owner_id, name, email, status, onboarding_completed)
  VALUES (uid, COALESCE(NULLIF(trim(center_name), ''), 'My Center'), NULLIF(trim(center_email), ''), 'pending', false)
  RETURNING id INTO center_id;

  RETURN center_id;
END;
$$;

-- Grant execute to authenticated users (they can only create a center for themselves; logic is inside the function)
GRANT EXECUTE ON FUNCTION public.create_center_for_signup(text, text) TO authenticated;
