import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuestionBookmark {
  id: string;
  user_id: string;
  question_id: string;
  test_id: string;
  created_at: string;
}

// Fetch all bookmarks for a specific test
export function useTestQuestionBookmarks(testId: string, userId?: string) {
  return useQuery({
    queryKey: ["question-bookmarks", testId, userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("question_bookmarks")
        .select("*")
        .eq("test_id", testId)
        .eq("user_id", userId);

      if (error) throw error;
      return data as QuestionBookmark[];
    },
    enabled: !!testId && !!userId,
  });
}

// Check if a specific question is bookmarked
export function useIsQuestionBookmarked(params: {
  questionId: string;
  userId?: string;
}) {
  const { questionId, userId } = params;

  return useQuery({
    queryKey: ["question-bookmark", questionId, userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from("question_bookmarks")
        .select("id")
        .eq("question_id", questionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!questionId && !!userId,
  });
}

// Toggle bookmark for a question
export function useToggleQuestionBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      questionId: string;
      testId: string;
      userId: string;
    }) => {
      const { questionId, testId, userId } = params;

      // Check if already bookmarked
      const { data: existing, error: existingError } = await supabase
        .from("question_bookmarks")
        .select("id")
        .eq("question_id", questionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        // Remove bookmark
        const { error: delError } = await supabase
          .from("question_bookmarks")
          .delete()
          .eq("id", existing.id);
        if (delError) throw delError;
        return { bookmarked: false as const };
      }

      // Add bookmark
      const { error: insError } = await supabase
        .from("question_bookmarks")
        .insert({
          user_id: userId,
          question_id: questionId,
          test_id: testId,
        });
      if (insError) throw insError;
      return { bookmarked: true as const };
    },
    onSuccess: (_, vars) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["question-bookmark", vars.questionId, vars.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["question-bookmarks", vars.testId, vars.userId],
      });
    },
  });
}

// Bulk check bookmarked questions for a test (for restoring state)
export function useBookmarkedQuestionIds(testId: string, userId?: string) {
  return useQuery({
    queryKey: ["bookmarked-question-ids", testId, userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();

      const { data, error } = await supabase
        .from("question_bookmarks")
        .select("question_id")
        .eq("test_id", testId)
        .eq("user_id", userId);

      if (error) throw error;
      return new Set(data.map((b) => b.question_id));
    },
    enabled: !!testId && !!userId,
  });
}
