-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_uz TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tests table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  difficulty INTEGER NOT NULL DEFAULT 2 CHECK (difficulty >= 1 AND difficulty <= 5),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  questions_count INTEGER NOT NULL DEFAULT 10,
  is_official BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT true,
  price INTEGER DEFAULT 0,
  author_name TEXT DEFAULT 'IMTS Team',
  author_avatar TEXT,
  completions INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
  points INTEGER NOT NULL DEFAULT 1,
  topic TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question options table
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_letter CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create user test attempts table
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  skipped_answers INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Create user answers table
CREATE TABLE public.user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  is_marked_for_review BOOLEAN DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Subjects: Public read access
CREATE POLICY "Subjects are viewable by everyone" ON public.subjects FOR SELECT USING (true);

-- Tests: Public read access
CREATE POLICY "Tests are viewable by everyone" ON public.tests FOR SELECT USING (true);

-- Questions: Public read access
CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (true);

-- Question options: Public read access
CREATE POLICY "Question options are viewable by everyone" ON public.question_options FOR SELECT USING (true);

-- Test attempts: Users can manage their own attempts
CREATE POLICY "Users can view their own attempts" ON public.test_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attempts" ON public.test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attempts" ON public.test_attempts FOR UPDATE USING (auth.uid() = user_id);

-- User answers: Users can manage their own answers
CREATE POLICY "Users can view their own answers" ON public.user_answers FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.test_attempts WHERE id = attempt_id AND user_id = auth.uid()));
CREATE POLICY "Users can create their own answers" ON public.user_answers FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.test_attempts WHERE id = attempt_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their own answers" ON public.user_answers FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.test_attempts WHERE id = attempt_id AND user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_tests_subject ON public.tests(subject_id);
CREATE INDEX idx_questions_test ON public.questions(test_id);
CREATE INDEX idx_question_options_question ON public.question_options(question_id);
CREATE INDEX idx_test_attempts_user ON public.test_attempts(user_id);
CREATE INDEX idx_test_attempts_test ON public.test_attempts(test_id);
CREATE INDEX idx_user_answers_attempt ON public.user_answers(attempt_id);

-- Function to update test completions count
CREATE OR REPLACE FUNCTION public.increment_test_completions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.tests SET completions = completions + 1 WHERE id = NEW.test_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_test_completed
  AFTER UPDATE ON public.test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.increment_test_completions();

-- Insert sample subjects
INSERT INTO public.subjects (name, name_uz, icon, color) VALUES
  ('Mathematics', 'Matematika', '📐', '#3B82F6'),
  ('Physics', 'Fizika', '⚡', '#8B5CF6'),
  ('Chemistry', 'Kimyo', '🧪', '#10B981'),
  ('Biology', 'Biologiya', '🧬', '#F59E0B'),
  ('English', 'Ingliz tili', '🌍', '#EC4899'),
  ('History', 'Tarix', '📚', '#6366F1'),
  ('Geography', 'Geografiya', '🗺️', '#14B8A6');

-- Insert sample tests
INSERT INTO public.tests (title, description, subject_id, difficulty, duration_minutes, questions_count, is_official, is_free, author_name, tags) VALUES
  ('Algebra Fundamentals', 'Test your basic algebra skills with equations and expressions', (SELECT id FROM public.subjects WHERE name = 'Mathematics'), 2, 30, 20, true, true, 'IMTS Team', ARRAY['algebra', 'equations', 'beginner']),
  ('Newton Laws of Motion', 'Comprehensive test on classical mechanics and motion', (SELECT id FROM public.subjects WHERE name = 'Physics'), 3, 45, 25, true, true, 'IMTS Team', ARRAY['mechanics', 'newton', 'forces']),
  ('Periodic Table Mastery', 'Test your knowledge of elements and their properties', (SELECT id FROM public.subjects WHERE name = 'Chemistry'), 3, 40, 30, true, true, 'IMTS Team', ARRAY['elements', 'periodic table']),
  ('Cell Biology Basics', 'Learn about cell structure and functions', (SELECT id FROM public.subjects WHERE name = 'Biology'), 2, 25, 15, false, true, 'Dr. Smith', ARRAY['cells', 'biology', 'basics']),
  ('English Grammar Test', 'Test your English grammar knowledge', (SELECT id FROM public.subjects WHERE name = 'English'), 2, 30, 20, true, true, 'IMTS Team', ARRAY['grammar', 'english', 'language']),
  ('World War II History', 'Comprehensive test on WWII events', (SELECT id FROM public.subjects WHERE name = 'History'), 4, 60, 40, true, false, 'IMTS Team', ARRAY['wwii', 'history', 'advanced']);

-- Insert sample questions for Algebra test
INSERT INTO public.questions (test_id, question_text, points, topic, order_index) VALUES
  ((SELECT id FROM public.tests WHERE title = 'Algebra Fundamentals'), 'Solve for x: 2x + 5 = 15', 1, 'Linear Equations', 1),
  ((SELECT id FROM public.tests WHERE title = 'Algebra Fundamentals'), 'What is the value of x in: 3x - 7 = 14?', 1, 'Linear Equations', 2),
  ((SELECT id FROM public.tests WHERE title = 'Algebra Fundamentals'), 'Simplify: 4x + 2x - 3x', 1, 'Expressions', 3),
  ((SELECT id FROM public.tests WHERE title = 'Algebra Fundamentals'), 'If y = 2x + 3, what is y when x = 4?', 2, 'Functions', 4),
  ((SELECT id FROM public.tests WHERE title = 'Algebra Fundamentals'), 'Factor: x² - 9', 2, 'Factoring', 5);

-- Insert options for the questions
INSERT INTO public.question_options (question_id, option_text, option_letter, is_correct, order_index)
SELECT q.id, opt.option_text, opt.option_letter, opt.is_correct, opt.order_index
FROM public.questions q
CROSS JOIN (
  VALUES 
    ('x = 5', 'A', true, 1),
    ('x = 10', 'B', false, 2),
    ('x = 7', 'C', false, 3),
    ('x = 3', 'D', false, 4)
) AS opt(option_text, option_letter, is_correct, order_index)
WHERE q.question_text = 'Solve for x: 2x + 5 = 15';

INSERT INTO public.question_options (question_id, option_text, option_letter, is_correct, order_index)
SELECT q.id, opt.option_text, opt.option_letter, opt.is_correct, opt.order_index
FROM public.questions q
CROSS JOIN (
  VALUES 
    ('x = 7', 'A', true, 1),
    ('x = 21', 'B', false, 2),
    ('x = 3', 'C', false, 3),
    ('x = 5', 'D', false, 4)
) AS opt(option_text, option_letter, is_correct, order_index)
WHERE q.question_text = 'What is the value of x in: 3x - 7 = 14?';

INSERT INTO public.question_options (question_id, option_text, option_letter, is_correct, order_index)
SELECT q.id, opt.option_text, opt.option_letter, opt.is_correct, opt.order_index
FROM public.questions q
CROSS JOIN (
  VALUES 
    ('3x', 'A', true, 1),
    ('9x', 'B', false, 2),
    ('x', 'C', false, 3),
    ('6x', 'D', false, 4)
) AS opt(option_text, option_letter, is_correct, order_index)
WHERE q.question_text = 'Simplify: 4x + 2x - 3x';

INSERT INTO public.question_options (question_id, option_text, option_letter, is_correct, order_index)
SELECT q.id, opt.option_text, opt.option_letter, opt.is_correct, opt.order_index
FROM public.questions q
CROSS JOIN (
  VALUES 
    ('y = 11', 'A', true, 1),
    ('y = 8', 'B', false, 2),
    ('y = 14', 'C', false, 3),
    ('y = 6', 'D', false, 4)
) AS opt(option_text, option_letter, is_correct, order_index)
WHERE q.question_text = 'If y = 2x + 3, what is y when x = 4?';

INSERT INTO public.question_options (question_id, option_text, option_letter, is_correct, order_index)
SELECT q.id, opt.option_text, opt.option_letter, opt.is_correct, opt.order_index
FROM public.questions q
CROSS JOIN (
  VALUES 
    ('(x + 3)(x - 3)', 'A', true, 1),
    ('(x - 3)²', 'B', false, 2),
    ('(x + 9)(x - 1)', 'C', false, 3),
    ('x(x - 9)', 'D', false, 4)
) AS opt(option_text, option_letter, is_correct, order_index)
WHERE q.question_text = 'Factor: x² - 9';