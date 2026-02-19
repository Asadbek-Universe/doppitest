import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserGoal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  subject_id: string | null;
  is_completed: boolean;
}

export const useGoalCompletion = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch active goals
  const { data: activeGoals = [] } = useQuery({
    queryKey: ["active-goals", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", userId!)
        .eq("is_completed", false);

      if (error) throw error;
      return data as UserGoal[];
    },
    enabled: !!userId,
  });

  // Mark goal as complete mutation
  const completeGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("user_goals")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-goals"] });
      queryClient.invalidateQueries({ queryKey: ["active-goals"] });
    },
  });

  // Check and update goals after test completion
  const checkGoalCompletion = async (testSubjectId?: string | null) => {
    if (!userId || activeGoals.length === 0) return;

    // Fetch latest attempts to calculate current values
    const { data: attempts, error } = await supabase
      .from("test_attempts")
      .select("*, tests(subject_id)")
      .eq("user_id", userId)
      .eq("status", "completed");

    if (error || !attempts) return;

    const completedGoals: { goal: UserGoal; currentValue: number }[] = [];

    for (const goal of activeGoals) {
      // Filter attempts based on goal's subject
      const filteredAttempts = goal.subject_id
        ? attempts.filter((a: any) => a.tests?.subject_id === goal.subject_id)
        : attempts;

      let currentValue = 0;

      if (goal.goal_type === "score") {
        if (filteredAttempts.length > 0) {
          const totalScore = filteredAttempts.reduce((sum: number, a: any) => {
            const percentage = a.total_points > 0 
              ? Math.round((a.score / a.total_points) * 100) 
              : 0;
            return sum + percentage;
          }, 0);
          currentValue = Math.round(totalScore / filteredAttempts.length);
        }
      } else if (goal.goal_type === "tests_completed") {
        currentValue = filteredAttempts.length;
      }

      // Update current_value in database
      await supabase
        .from("user_goals")
        .update({ current_value: currentValue })
        .eq("id", goal.id);

      // Check if goal is now complete
      if (currentValue >= goal.target_value && !goal.is_completed) {
        completedGoals.push({ goal, currentValue });
      }
    }

    // Mark completed goals and show notifications
    for (const { goal, currentValue } of completedGoals) {
      await completeGoalMutation.mutateAsync(goal.id);
      
      const goalLabel = goal.goal_type === "score" 
        ? "Average Score" 
        : goal.goal_type === "tests_completed" 
        ? "Tests Completed" 
        : goal.goal_type;

      toast.success("🎉 Goal Achieved!", {
        description: `You've reached your ${goalLabel} target of ${goal.target_value}${goal.goal_type === "score" ? "%" : ""}!`,
        duration: 6000,
      });
    }

    return completedGoals.length;
  };

  return {
    activeGoals,
    checkGoalCompletion,
  };
};
