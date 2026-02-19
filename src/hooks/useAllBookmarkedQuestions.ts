import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BookmarkedQuestion {
  id: string;
  question_id: string;
  test_id: string;
  created_at: string;
  question: {
    id: string;
    question_text: string;
    points: number;
    topic: string | null;
    explanation: string | null;
    question_options: {
      id: string;
      option_text: string;
      option_letter: string;
      is_correct: boolean;
    }[];
  } | null;
  test: {
    id: string;
    title: string;
    difficulty: number;
  } | null;
}

export function useAllBookmarkedQuestions(userId?: string) {
  return useQuery({
    queryKey: ["all-bookmarked-questions", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("question_bookmarks")
        .select(`
          id,
          question_id,
          test_id,
          created_at,
          questions:question_id (
            id,
            question_text,
            points,
            topic,
            explanation,
            question_options (
              id,
              option_text,
              option_letter,
              is_correct
            )
          ),
          tests:test_id (
            id,
            title,
            difficulty
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to flatten the structure
      return (data || []).map((item: any) => ({
        id: item.id,
        question_id: item.question_id,
        test_id: item.test_id,
        created_at: item.created_at,
        question: item.questions,
        test: item.tests,
      })) as BookmarkedQuestion[];
    },
    enabled: !!userId,
  });
}
