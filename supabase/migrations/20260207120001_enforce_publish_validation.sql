-- Enforce: course cannot be published without at least one lesson
CREATE OR REPLACE FUNCTION public.check_course_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true THEN
    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = NEW.id LIMIT 1) THEN
      NEW.is_published := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_course_publish ON public.courses;
CREATE TRIGGER enforce_course_publish
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  WHEN (OLD.is_published IS DISTINCT FROM NEW.is_published AND NEW.is_published = true)
  EXECUTE FUNCTION public.check_course_publish();

-- Enforce: test cannot be published without at least one question with correct answer
CREATE OR REPLACE FUNCTION public.check_test_publish()
RETURNS TRIGGER AS $$
DECLARE
  q_count int;
  valid_count int;
BEGIN
  IF NEW.is_published = true THEN
    SELECT COUNT(*) INTO q_count FROM public.questions WHERE test_id = NEW.id;
    IF q_count = 0 THEN
      NEW.is_published := false;
    ELSE
      SELECT COUNT(*) INTO valid_count
      FROM public.questions q
      WHERE q.test_id = NEW.id
        AND EXISTS (SELECT 1 FROM public.question_options o WHERE o.question_id = q.id AND o.is_correct = true);
      IF valid_count < q_count THEN
        NEW.is_published := false;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_test_publish ON public.tests;
CREATE TRIGGER enforce_test_publish
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  WHEN (OLD.is_published IS DISTINCT FROM NEW.is_published AND NEW.is_published = true)
  EXECUTE FUNCTION public.check_test_publish();
