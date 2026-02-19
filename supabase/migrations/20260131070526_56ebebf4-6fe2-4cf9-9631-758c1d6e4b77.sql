-- Update olympiad status to use new approval workflow
-- Status values: draft, pending_approval, approved, published, rejected, active, completed

-- Add approval tracking columns to olympiads
ALTER TABLE public.olympiads 
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS submitted_for_approval_at timestamp with time zone;

-- Migrate existing olympiads based on is_published status
UPDATE public.olympiads 
SET approval_status = CASE 
  WHEN is_published = true AND is_public = true THEN 'published'
  WHEN is_published = true THEN 'approved'
  ELSE 'draft'
END;

-- Create index for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_olympiads_approval_status ON public.olympiads(approval_status);

-- Add trigger to log olympiad approval status changes
CREATE OR REPLACE FUNCTION public.log_olympiad_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
    VALUES (
      'olympiad_status_changed',
      'olympiad', 
      NEW.id,
      jsonb_build_object(
        'olympiad_title', NEW.title, 
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

-- Create trigger for olympiad status logging
DROP TRIGGER IF EXISTS log_olympiad_status_change_trigger ON public.olympiads;
CREATE TRIGGER log_olympiad_status_change_trigger
  AFTER UPDATE ON public.olympiads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_olympiad_status_change();

-- Update RLS policy for olympiads to enforce visibility based on approval_status
DROP POLICY IF EXISTS "Public olympiads are viewable by everyone" ON public.olympiads;
CREATE POLICY "Public olympiads are viewable based on status" 
ON public.olympiads 
FOR SELECT 
USING (
  -- Published olympiads are visible to everyone
  (approval_status = 'published') OR
  -- Centers can view their own olympiads
  (center_id IN (SELECT id FROM educational_centers WHERE owner_id = auth.uid())) OR
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role)
);