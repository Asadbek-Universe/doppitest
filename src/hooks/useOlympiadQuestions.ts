import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type OlympiadQuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'image_based';

export interface OlympiadQuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface OlympiadQuestionRow {
  id: string;
  olympiad_id: string;
  question_type: OlympiadQuestionType;
  question_text: string;
  image_url: string | null;
  options: OlympiadQuestionOption[] | unknown;
  correct_answer: string | string[] | unknown;
  points: number;
  topic: string | null;
  difficulty: string | null;
  explanation: string | null;
  section: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

const QUESTION_TYPES: { value: OlympiadQuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short answer' },
  { value: 'image_based', label: 'Image-based' },
];

export function getQuestionTypeLabel(type: OlympiadQuestionType): string {
  return QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function useOlympiadQuestions(olympiadId: string | null) {
  return useQuery({
    queryKey: ['olympiad-questions', olympiadId],
    queryFn: async (): Promise<OlympiadQuestionRow[]> => {
      if (!olympiadId) return [];
      const { data, error } = await supabase
        .from('olympiad_questions')
        .select('*')
        .eq('olympiad_id', olympiadId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data ?? []) as OlympiadQuestionRow[];
    },
    enabled: !!olympiadId,
  });
}

export function useCreateOlympiadQuestion(olympiadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      question_type: OlympiadQuestionType;
      question_text: string;
      image_url?: string | null;
      options?: OlympiadQuestionOption[] | unknown;
      correct_answer?: unknown;
      points?: number;
      topic?: string | null;
      difficulty?: string | null;
      explanation?: string | null;
      section?: string | null;
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from('olympiad_questions')
        .insert({
          olympiad_id: olympiadId,
          question_type: payload.question_type,
          question_text: payload.question_text,
          image_url: payload.image_url ?? null,
          options: payload.options ?? [],
          correct_answer: payload.correct_answer ?? null,
          points: payload.points ?? 1,
          topic: payload.topic ?? null,
          difficulty: payload.difficulty ?? null,
          explanation: payload.explanation ?? null,
          section: payload.section ?? null,
          order_index: payload.order_index ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as OlympiadQuestionRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['olympiad-questions', olympiadId] });
      toast.success('Question added');
    },
    onError: () => toast.error('Failed to add question'),
  });
}

export function useUpdateOlympiadQuestion(olympiadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<OlympiadQuestionRow> & { id: string }) => {
      const { error } = await supabase
        .from('olympiad_questions')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['olympiad-questions', olympiadId] });
      toast.success('Question updated');
    },
    onError: () => toast.error('Failed to update question'),
  });
}

export function useDeleteOlympiadQuestion(olympiadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.from('olympiad_questions').delete().eq('id', questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['olympiad-questions', olympiadId] });
      toast.success('Question removed');
    },
    onError: () => toast.error('Failed to remove question'),
  });
}

export function useReorderOlympiadQuestions(olympiadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('olympiad_questions').update({ order_index: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['olympiad-questions', olympiadId] });
      toast.success('Order updated');
    },
    onError: () => toast.error('Failed to reorder'),
  });
}
