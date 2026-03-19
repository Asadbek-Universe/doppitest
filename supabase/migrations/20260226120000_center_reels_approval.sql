-- Add approval workflow to center_reels (short videos)
-- Status values (conceptual): draft, pending_approval, approved, published, rejected, archived

ALTER TABLE public.center_reels
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS submitted_for_approval_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_center_reels_approval_status ON public.center_reels(approval_status);

CREATE OR REPLACE FUNCTION public.log_reel_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
    VALUES (
      'reel_status_changed',
      'reel',
      NEW.id,
      jsonb_build_object(
        'reel_title', NEW.title,
        'old_status', OLD.approval_status,
        'new_status', NEW.approval_status,
        'rejection_reason', NEW.rejection_reason,
        'approved_by', NEW.approved_by
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS log_reel_status_change_trigger ON public.center_reels;
CREATE TRIGGER log_reel_status_change_trigger
  AFTER UPDATE ON public.center_reels
  FOR EACH ROW
  EXECUTE FUNCTION public.log_reel_status_change();
