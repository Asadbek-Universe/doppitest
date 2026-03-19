-- Fix "database error saving new user": handle_new_user() must set id and role for current profiles schema.
-- profiles has constraint id = user_id and role NOT NULL. The old trigger only set user_id and display_name,
-- so id defaulted to gen_random_uuid() and the check failed, or role was missing.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_val text;
BEGIN
  display_val := COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, user_id, display_name, name, role)
  VALUES (NEW.id, NEW.id, display_val, display_val, 'user');
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE;
END;
$$;
