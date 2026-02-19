-- Remove the auto-activation trigger that sets center to 'active' when tariff is selected
-- Now admin must manually approve tariff selection

DROP TRIGGER IF EXISTS activate_center_on_tariff ON public.center_subscriptions;

-- Update the function to only set the selected_at timestamp, NOT activate the center
CREATE OR REPLACE FUNCTION public.activate_center_after_tariff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only set the selected_at timestamp when tariff is first selected
  -- Admin must manually approve to set status = 'active'
  IF NEW.tariff_selected = true AND OLD.tariff_selected = false THEN
    NEW.selected_at = now();
    -- NOTE: We no longer auto-activate. Admin must approve tariff.
  END IF;
  RETURN NEW;
END;
$function$;

-- Re-create the trigger with updated function
CREATE TRIGGER activate_center_on_tariff
  BEFORE UPDATE ON public.center_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_center_after_tariff();

-- Add admin notes field for tariff approval
ALTER TABLE public.center_subscriptions 
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL;

-- Add tariff_approved_at and tariff_approved_by for audit trail
ALTER TABLE public.center_subscriptions 
ADD COLUMN IF NOT EXISTS tariff_approved_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.center_subscriptions 
ADD COLUMN IF NOT EXISTS tariff_approved_by UUID DEFAULT NULL;