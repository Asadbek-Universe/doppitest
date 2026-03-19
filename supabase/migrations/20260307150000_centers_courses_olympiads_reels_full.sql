-- Centers / Courses / Olympiads / Reels – schema enhancements for production-ready system
-- Status flow: draft → pending_approval → approved/rejected; published = live for users

-- 1) Course modules (Course → Modules → Lessons)
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL;

COMMENT ON TABLE public.course_modules IS 'Course sections/modules; lessons can optionally belong to a module.';

-- 2) center_reels: add grade for filtering (e.g. grade level)
ALTER TABLE public.center_reels
  ADD COLUMN IF NOT EXISTS grades text[] DEFAULT '{}';

-- 3) educational_centers: ensure location (address) and contact fields exist
ALTER TABLE public.educational_centers
  ADD COLUMN IF NOT EXISTS address text;

-- 4) course_enrollments: optional center_id for center-scoped queries (denormalized from courses)
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.educational_centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_enrollments_center_id ON public.course_enrollments(center_id);

-- Trigger: set course_enrollments.center_id from course on insert
CREATE OR REPLACE FUNCTION public.sync_course_enrollment_center_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.center_id IS NULL AND NEW.course_id IS NOT NULL THEN
    SELECT center_id INTO NEW.center_id FROM public.courses WHERE id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_course_enrollment_center_id ON public.course_enrollments;
CREATE TRIGGER sync_course_enrollment_center_id
  BEFORE INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_course_enrollment_center_id();

-- Backfill center_id for existing rows
UPDATE public.course_enrollments e
SET center_id = c.center_id
FROM public.courses c
WHERE e.course_id = c.id AND e.center_id IS NULL;

-- 4b) Center status: add 'suspended' if not present (pending / approved / rejected / suspended / active)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'center_status' AND e.enumlabel = 'suspended') THEN
    ALTER TYPE public.center_status ADD VALUE 'suspended';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 5) RLS for course_modules (center can manage their own via course ownership)
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Center can manage own course modules" ON public.course_modules;
CREATE POLICY "Center can manage own course modules"
ON public.course_modules
FOR ALL
TO authenticated
USING (
  course_id IN (SELECT id FROM public.courses WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  course_id IN (SELECT id FROM public.courses WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Anyone can read published course modules" ON public.course_modules;
CREATE POLICY "Anyone can read published course modules"
ON public.course_modules
FOR SELECT
USING (
  course_id IN (SELECT id FROM public.courses WHERE is_published = true AND approval_status = 'published')
  OR course_id IN (SELECT id FROM public.courses WHERE center_id IN (SELECT id FROM public.educational_centers WHERE owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
