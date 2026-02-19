
-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id),
  instructor_name TEXT NOT NULL DEFAULT 'IMTS Team',
  instructor_avatar TEXT,
  instructor_bio TEXT,
  thumbnail_url TEXT,
  rating NUMERIC DEFAULT 0,
  students_count INTEGER DEFAULT 0,
  lessons_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  price INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  learning_outcomes TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL DEFAULT 'Introduction',
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Create lesson progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  watched_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

-- Create course reviews table
CREATE TABLE public.course_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create user notes table for courses
CREATE TABLE public.course_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  timestamp_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;

-- Courses and lessons are viewable by everyone
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Reviews are viewable by everyone" ON public.course_reviews FOR SELECT USING (true);

-- User-specific policies for enrollments
CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own enrollments" ON public.course_enrollments FOR UPDATE USING (auth.uid() = user_id);

-- User-specific policies for lesson progress
CREATE POLICY "Users can view their own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- User-specific policies for reviews
CREATE POLICY "Users can create their own reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.course_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.course_reviews FOR DELETE USING (auth.uid() = user_id);

-- User-specific policies for notes
CREATE POLICY "Users can view their own notes" ON public.course_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.course_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.course_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.course_notes FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);

-- Insert sample courses
INSERT INTO public.courses (title, description, subject_id, instructor_name, instructor_bio, rating, students_count, lessons_count, duration_minutes, learning_outcomes, requirements, tags) VALUES
('Chemistry Essentials', 'Fundamental chemistry principles including atomic structure, chemical bonding, and reaction mechanisms', (SELECT id FROM subjects WHERE name = 'Chemistry'), 'Dr. Sarah Chen', 'Chemistry specialist with 15 years of teaching experience and research background in organic synthesis', 4.8, 2300, 12, 180, ARRAY['Master fundamental concepts', 'Build practical projects', 'Develop problem-solving skills', 'Apply knowledge in real scenarios'], ARRAY['Basic computer skills', 'Motivation to learn'], ARRAY['Chemistry', 'Education', 'Online Learning']),
('Physics Fundamentals', 'Complete physics course covering mechanics, thermodynamics, and electromagnetism', (SELECT id FROM subjects WHERE name = 'Physics'), 'Prof. John Smith', 'Physics professor with 20 years of experience teaching at university level', 4.6, 1800, 15, 240, ARRAY['Understand core physics concepts', 'Solve complex physics problems', 'Apply physics in real-world scenarios'], ARRAY['Basic math knowledge', 'Curiosity about how things work'], ARRAY['Physics', 'Science', 'Engineering']),
('Advanced Mathematics', 'Master calculus, linear algebra, and differential equations', (SELECT id FROM subjects WHERE name = 'Mathematics'), 'Dr. Emily Watson', 'Mathematics PhD with specialization in applied mathematics and data science', 4.9, 3200, 20, 360, ARRAY['Master calculus fundamentals', 'Understand linear algebra', 'Solve differential equations', 'Apply math in programming'], ARRAY['Algebra basics', 'Pre-calculus knowledge'], ARRAY['Mathematics', 'Calculus', 'Algebra']);

-- Insert sample lessons
INSERT INTO public.lessons (course_id, section_title, title, description, duration_minutes, order_index, is_free) VALUES
((SELECT id FROM courses WHERE title = 'Chemistry Essentials'), 'Introduction', 'Atomic Structure Theory', 'Exploring electron configuration and periodic table relationships', 20, 1, true),
((SELECT id FROM courses WHERE title = 'Chemistry Essentials'), 'Introduction', 'Chemical Bonding Basics', 'Understanding ionic and covalent bonds', 25, 2, true),
((SELECT id FROM courses WHERE title = 'Chemistry Essentials'), 'Core Concepts', 'Molecular Geometry', 'VSEPR theory and molecular shapes', 30, 3, false),
((SELECT id FROM courses WHERE title = 'Chemistry Essentials'), 'Core Concepts', 'Reaction Mechanisms', 'Understanding how chemical reactions occur', 35, 4, false),
((SELECT id FROM courses WHERE title = 'Physics Fundamentals'), 'Mechanics', 'Newton Laws of Motion', 'Understanding the three laws of motion', 30, 1, true),
((SELECT id FROM courses WHERE title = 'Physics Fundamentals'), 'Mechanics', 'Work, Energy and Power', 'Conservation of energy and power calculations', 35, 2, false),
((SELECT id FROM courses WHERE title = 'Physics Fundamentals'), 'Thermodynamics', 'Laws of Thermodynamics', 'Understanding heat and energy transfer', 40, 3, false),
((SELECT id FROM courses WHERE title = 'Advanced Mathematics'), 'Calculus', 'Limits and Continuity', 'Foundation of calculus concepts', 25, 1, true),
((SELECT id FROM courses WHERE title = 'Advanced Mathematics'), 'Calculus', 'Derivatives', 'Understanding rate of change', 30, 2, true),
((SELECT id FROM courses WHERE title = 'Advanced Mathematics'), 'Linear Algebra', 'Vectors and Matrices', 'Matrix operations and transformations', 35, 3, false);
