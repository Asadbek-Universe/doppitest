import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProfileLearningStats {
  coursesCompleted: number;
  averageTestScore: number;
  bestTestScore: number;
  totalStudyTimeMinutes: number;
  testSuccessRate: number;
}

export function useProfileLearningStats() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile-learning-stats", user?.id],
    queryFn: async (): Promise<ProfileLearningStats> => {
      if (!user?.id) {
        return {
          coursesCompleted: 0,
          averageTestScore: 0,
          bestTestScore: 0,
          totalStudyTimeMinutes: 0,
          testSuccessRate: 0,
        };
      }

      const [enrollmentsRes, attemptsRes] = await Promise.all([
        supabase
          .from("course_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("completed_at", "is", null),
        supabase
          .from("test_attempts")
          .select("score, total_points, time_spent_seconds")
          .eq("user_id", user.id)
          .eq("status", "completed"),
      ]);

      const coursesCompleted = enrollmentsRes.count ?? 0;
      const attempts = attemptsRes.data ?? [];

      let averageTestScore = 0;
      let bestTestScore = 0;
      let totalStudyTimeMinutes = 0;
      let passedCount = 0;

      if (attempts.length > 0) {
        const percentages = attempts.map((a) =>
          a.total_points ? Math.round(((a.score ?? 0) / a.total_points) * 100) : 0
        );
        averageTestScore = Math.round(
          percentages.reduce((s, p) => s + p, 0) / percentages.length
        );
        bestTestScore = Math.max(...percentages);
        totalStudyTimeMinutes = Math.round(
          attempts.reduce((acc, a) => acc + (a.time_spent_seconds ?? 0), 0) / 60
        );
        passedCount = percentages.filter((p) => p >= 60).length;
      }

      const testSuccessRate =
        attempts.length > 0 ? Math.round((passedCount / attempts.length) * 100) : 0;

      return {
        coursesCompleted,
        averageTestScore,
        bestTestScore,
        totalStudyTimeMinutes,
        testSuccessRate,
      };
    },
    enabled: !!user?.id,
  });

  return {
    data: data ?? null,
    isLoading,
  };
}
