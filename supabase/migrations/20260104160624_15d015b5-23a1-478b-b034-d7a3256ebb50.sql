-- Create activity logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert logs (for triggers)
CREATE POLICY "System can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Create function to log user role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'role_assigned', 'user_role', NEW.id, 
      jsonb_build_object('role', NEW.role));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (OLD.user_id, 'role_removed', 'user_role', OLD.id,
      jsonb_build_object('role', OLD.role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role changes
CREATE TRIGGER on_role_change
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- Create function to log center verification changes
CREATE OR REPLACE FUNCTION public.log_center_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
    VALUES (
      CASE WHEN NEW.is_verified THEN 'center_verified' ELSE 'center_unverified' END,
      'educational_center', 
      NEW.id,
      jsonb_build_object('center_name', NEW.name, 'is_verified', NEW.is_verified)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for center verification
CREATE TRIGGER on_center_verification
AFTER UPDATE ON public.educational_centers
FOR EACH ROW EXECUTE FUNCTION public.log_center_verification();

-- Create function to log new course creation
CREATE OR REPLACE FUNCTION public.log_course_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
  VALUES ('course_created', 'course', NEW.id,
    jsonb_build_object('title', NEW.title, 'center_id', NEW.center_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for course creation
CREATE TRIGGER on_course_creation
AFTER INSERT ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.log_course_creation();

-- Create function to log new test creation
CREATE OR REPLACE FUNCTION public.log_test_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
  VALUES ('test_created', 'test', NEW.id,
    jsonb_build_object('title', NEW.title, 'center_id', NEW.center_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for test creation
CREATE TRIGGER on_test_creation
AFTER INSERT ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.log_test_creation();

-- Create function to log new user registration (profile creation)
CREATE OR REPLACE FUNCTION public.log_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action_type, entity_type, entity_id, details)
  VALUES (NEW.user_id, 'user_registered', 'profile', NEW.id,
    jsonb_build_object('display_name', NEW.display_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for user registration
CREATE TRIGGER on_user_registration
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_user_registration();