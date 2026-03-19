-- Admin sub-roles for fine-grained RBAC

DO $$
BEGIN
  CREATE TYPE public.admin_role AS ENUM (
    'super_admin',
    'moderator',
    'content_reviewer',
    'finance_admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS admin_role public.admin_role;

-- Default existing admins to super_admin
UPDATE public.user_roles
SET admin_role = 'super_admin'
WHERE role = 'admin' AND admin_role IS NULL;
