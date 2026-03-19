-- =============================================================================
-- user_roles RLS policies for Supabase (PostgreSQL)
-- Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- =============================================================================
-- Ensures:
-- 1. Authenticated users can INSERT their own role row (for registration).
-- 2. Users can only READ their own roles.
-- 3. Only admins can UPDATE/DELETE or read other users' roles (via has_role).
-- =============================================================================

-- Turn on RLS (idempotent)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Remove existing policies so we can replace them cleanly
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;

-- 1) SELECT: users can only read their own roles
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) SELECT: admins can read all roles
CREATE POLICY "user_roles_select_admin"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) INSERT: authenticated users can insert their own role (for registration)
--    Allowed roles: 'user' and 'center' only (not 'admin')
CREATE POLICY "user_roles_insert_own"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('user', 'center')
);

-- 4) UPDATE/DELETE (and any other operation): only admins
CREATE POLICY "user_roles_admin_all"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
