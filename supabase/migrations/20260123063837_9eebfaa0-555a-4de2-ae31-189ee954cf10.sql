-- Tighten permissive INSERT policies flagged by linter

-- activity_logs: disallow direct client inserts (rows should be written via SECURITY DEFINER triggers/functions)
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
DO $$ BEGIN
  CREATE POLICY "No direct inserts to activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- center_analytics: disallow direct client inserts (rows should be written by backend processes)
DROP POLICY IF EXISTS "System can insert analytics" ON public.center_analytics;
DO $$ BEGIN
  CREATE POLICY "No direct inserts to center analytics"
  ON public.center_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
