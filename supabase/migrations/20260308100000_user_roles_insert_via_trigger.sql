-- Fix RLS: insert user_roles from handle_new_user (SECURITY DEFINER) so signup works
-- when session is not yet available (e.g. email confirmation). Role comes from signUp options.data.app_role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_val text;
  app_role_val public.app_role;
BEGIN
  display_val := COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1));

  -- Only allow 'user' or 'center' from metadata; default 'user'
  app_role_val := CASE
    WHEN (NEW.raw_user_meta_data ->> 'app_role') = 'center' THEN 'center'::public.app_role
    ELSE 'user'::public.app_role
  END;

  INSERT INTO public.profiles (id, user_id, display_name, name, role)
  VALUES (NEW.id, NEW.id, display_val, display_val, app_role_val::text);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, app_role_val);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE;
END;
$$;
