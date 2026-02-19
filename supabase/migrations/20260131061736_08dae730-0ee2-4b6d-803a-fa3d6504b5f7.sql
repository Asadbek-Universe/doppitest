-- Create enum for center status
CREATE TYPE public.center_status AS ENUM ('pending', 'approved', 'rejected', 'active');

-- Add status column to educational_centers
ALTER TABLE public.educational_centers 
ADD COLUMN status public.center_status NOT NULL DEFAULT 'pending';

-- Add rejection reason column
ALTER TABLE public.educational_centers 
ADD COLUMN rejection_reason TEXT;

-- Add approval audit columns
ALTER TABLE public.educational_centers 
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.educational_centers 
ADD COLUMN approved_by UUID REFERENCES auth.users(id);

-- Add tariff_selected flag to center_subscriptions
ALTER TABLE public.center_subscriptions 
ADD COLUMN tariff_selected BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.center_subscriptions 
ADD COLUMN selected_at TIMESTAMP WITH TIME ZONE;

-- Update existing verified centers to 'active' status
UPDATE public.educational_centers 
SET status = 'active' 
WHERE is_verified = true;

-- Update existing non-verified centers with onboarding completed to 'pending'
UPDATE public.educational_centers 
SET status = 'pending' 
WHERE is_verified = false AND onboarding_completed = true;

-- Create function to activate center after tariff selection
CREATE OR REPLACE FUNCTION public.activate_center_after_tariff()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tariff_selected = true AND OLD.tariff_selected = false THEN
    NEW.selected_at = now();
    UPDATE public.educational_centers 
    SET status = 'active' 
    WHERE id = NEW.center_id AND status = 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to activate center
CREATE TRIGGER activate_center_on_tariff_selection
BEFORE UPDATE ON public.center_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.activate_center_after_tariff();

-- Create function to log center status changes
CREATE OR REPLACE FUNCTION public.log_center_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
    VALUES (
      'center_status_changed',
      'educational_center', 
      NEW.id,
      jsonb_build_object(
        'center_name', NEW.name, 
        'old_status', OLD.status,
        'new_status', NEW.status,
        'rejection_reason', NEW.rejection_reason,
        'approved_by', NEW.approved_by
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for status change logging
CREATE TRIGGER log_center_status_changes
AFTER UPDATE ON public.educational_centers
FOR EACH ROW
EXECUTE FUNCTION public.log_center_status_change();

-- Create function to check if center owner can only update non-status fields
CREATE OR REPLACE FUNCTION public.center_owner_can_update(center_row educational_centers, user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN center_row.owner_id = user_uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Create function to get center status by id for RLS
CREATE OR REPLACE FUNCTION public.get_center_status(center_uuid uuid)
RETURNS center_status AS $$
  SELECT status FROM public.educational_centers WHERE id = center_uuid LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;