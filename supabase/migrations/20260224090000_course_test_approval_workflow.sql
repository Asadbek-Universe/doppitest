-- Add approval workflow to courses and tests
-- Status values (conceptual): draft, pending_approval, approved, published, rejected, archived

-- Courses: approval tracking
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS submitted_for_approval_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_courses_approval_status ON public.courses(approval_status);

-- Tests: approval tracking
ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS submitted_for_approval_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_tests_approval_status ON public.tests(approval_status);

-- Trigger functions to log approval status changes into activity_logs

CREATE OR REPLACE FUNCTION public.log_course_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
    VALUES (
      'course_status_changed',
      'course',
      NEW.id,
      jsonb_build_object(
        'course_title', NEW.title,
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

DROP TRIGGER IF EXISTS log_course_status_change_trigger ON public.courses;
CREATE TRIGGER log_course_status_change_trigger
  AFTER UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.log_course_status_change();


CREATE OR REPLACE FUNCTION public.log_test_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO public.activity_logs (action_type, entity_type, entity_id, details)
    VALUES (
      'test_status_changed',
      'test',
      NEW.id,
      jsonb_build_object(
        'test_title', NEW.title,
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

DROP TRIGGER IF EXISTS log_test_status_change_trigger ON public.tests;
CREATE TRIGGER log_test_status_change_trigger
  AFTER UPDATE ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_test_status_change();

