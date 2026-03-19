-- Run this in Supabase Dashboard → SQL Editor if center signup fails (e.g. "Not authenticated" or center not created).
-- Makes the trigger create the center from signup metadata so it works with email confirmation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_val text;
  app_role_val public.app_role;
  cname text;
  cemail text;
BEGIN
  display_val := COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1));

  app_role_val := CASE
    WHEN (NEW.raw_user_meta_data ->> 'app_role') = 'center' THEN 'center'::public.app_role
    ELSE 'user'::public.app_role
  END;

  IF app_role_val = 'center' AND NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'center_name', '')), '') IS NOT NULL THEN
    display_val := trim(NEW.raw_user_meta_data ->> 'center_name');
  END IF;

  INSERT INTO public.profiles (id, user_id, display_name, name, role)
  VALUES (NEW.id, NEW.id, display_val, display_val, app_role_val::text);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, app_role_val);

  IF app_role_val = 'center' THEN
    cname := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'center_name', '')), '');
    cemail := NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'center_email', '')), '');
    INSERT INTO public.educational_centers (owner_id, name, email, status, onboarding_completed)
    VALUES (NEW.id, COALESCE(cname, 'My Center'), cemail, 'pending', false);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE;
END;
$$;
