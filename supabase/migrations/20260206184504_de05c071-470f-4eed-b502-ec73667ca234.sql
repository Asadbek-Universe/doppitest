-- Add blocked_at and last_activity_at columns to profiles for admin management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create function to update last activity timestamp
CREATE OR REPLACE FUNCTION public.update_user_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_activity_at = NOW() 
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update last activity on test attempts
CREATE TRIGGER update_last_activity_on_test_attempt
AFTER INSERT ON public.test_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_user_last_activity();

-- Trigger to update last activity on course enrollments
CREATE TRIGGER update_last_activity_on_enrollment
AFTER INSERT ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_user_last_activity();

-- Add RLS policy for admins to update profiles (block/unblock users)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to delete profiles (soft delete via blocking)
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update centers
CREATE POLICY "Admins can update any center"
ON public.educational_centers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to delete centers
CREATE POLICY "Admins can delete any center"
ON public.educational_centers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update center subscriptions
CREATE POLICY "Admins can update any subscription"
ON public.center_subscriptions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));