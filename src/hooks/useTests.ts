import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  name_uz: string | null;
  icon: string | null;
  color: string | null;
}

export interface Test {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  difficulty: number;
  duration_minutes: number;
  questions_count: number;
  is_official: boolean;
  is_free: boolean;
  is_published: boolean;
  price: number;
  author_name: string;
  author_avatar: string | null;
  completions: number;
  rating: number;
  tags: string[];
  created_at: string;
  center_id: string | null;
  subjects?: Subject | null;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_type: string;
  points: number;
  topic: string | null;
  order_index: number;
  explanation: string | null;
  question_options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_letter: string;
  is_correct: boolean;
  order_index: number;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  test_id: string;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number;
  score: number;
  total_points: number;
  correct_answers: number;
  wrong_answers: number;
  skipped_answers: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface UserAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean | null;
  is_marked_for_review: boolean;
  answered_at: string | null;
}

// Fetch all subjects
export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Subject[];
    },
  });
}

// Fetch all published tests with at least 1 question (for public view)
export function useTests(subjectId?: string, difficulty?: number) {
  return useQuery({
    queryKey: ['tests', subjectId, difficulty],
    queryFn: async () => {
      let query = supabase
        .from('tests')
        .select('*, subjects(*)')
        .eq('is_published', true)
        .gt('questions_count', 0)
        .order('created_at', { ascending: false });
      
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Test[];
    },
  });
}

// Fetch single test with questions
export function useTest(testId: string) {
  return useQuery({
    queryKey: ['test', testId],
    queryFn: async () => {
      const { data: test, error: testError } = await supabase
        .from('tests')
        .select('*, subjects(*)')
        .eq('id', testId)
        .maybeSingle();
      
      if (testError) throw testError;
      if (!test) throw new Error('Test not found');
      
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*, question_options(*)')
        .eq('test_id', testId)
        .order('order_index');
      
      if (questionsError) throw questionsError;
      
      return { test: test as Test, questions: questions as Question[] };
    },
    enabled: !!testId,
  });
}

// Start a test attempt
export function useStartTestAttempt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ testId, userId }: { testId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('test_attempts')
        .insert({
          test_id: testId,
          user_id: userId,
          status: 'in_progress',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as TestAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-attempts'] });
    },
  });
}

// Submit an answer
export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      attemptId,
      questionId,
      optionId,
      isCorrect,
      isMarkedForReview,
    }: {
      attemptId: string;
      questionId: string;
      optionId: string | null;
      isCorrect: boolean | null;
      isMarkedForReview: boolean;
    }) => {
      const { data, error } = await supabase
        .from('user_answers')
        .upsert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_option_id: optionId,
          is_correct: isCorrect,
          is_marked_for_review: isMarkedForReview,
          answered_at: new Date().toISOString(),
        }, {
          onConflict: 'attempt_id,question_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserAnswer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-answers', variables.attemptId] });
    },
  });
}

// Complete test attempt
export function useCompleteTestAttempt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      attemptId,
      score,
      totalPoints,
      correctAnswers,
      wrongAnswers,
      skippedAnswers,
      timeSpentSeconds,
    }: {
      attemptId: string;
      score: number;
      totalPoints: number;
      correctAnswers: number;
      wrongAnswers: number;
      skippedAnswers: number;
      timeSpentSeconds: number;
    }) => {
      const { data, error } = await supabase
        .from('test_attempts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          score,
          total_points: totalPoints,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          skipped_answers: skippedAnswers,
          time_spent_seconds: timeSpentSeconds,
        })
        .eq('id', attemptId)
        .select()
        .single();
      
      if (error) throw error;
      return data as TestAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

// Get user's answers for an attempt
export function useUserAnswers(attemptId: string) {
  return useQuery({
    queryKey: ['user-answers', attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('attempt_id', attemptId);
      
      if (error) throw error;
      return data as UserAnswer[];
    },
    enabled: !!attemptId,
  });
}
