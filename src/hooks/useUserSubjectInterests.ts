import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SubjectInterest {
  subject_id: string;
  subject_name: string;
  subject_icon: string | null;
  subject_color: string | null;
  interaction_count: number;
}

export const useUserSubjectInterests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-subject-interests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get subjects from completed tests
      const { data: testAttempts } = await supabase
        .from("test_attempts")
        .select(`
          test_id,
          tests!inner(subject_id, subjects(id, name, icon, color))
        `)
        .eq("user_id", user.id)
        .eq("status", "completed");

      // Get subjects from enrolled courses
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select(`
          course_id,
          courses!inner(subject_id, subjects(id, name, icon, color))
        `)
        .eq("user_id", user.id);

      // Aggregate subject interactions
      const subjectMap = new Map<string, SubjectInterest>();

      testAttempts?.forEach((attempt) => {
        const test = attempt.tests as any;
        if (test?.subjects?.id) {
          const existing = subjectMap.get(test.subjects.id);
          if (existing) {
            existing.interaction_count += 1;
          } else {
            subjectMap.set(test.subjects.id, {
              subject_id: test.subjects.id,
              subject_name: test.subjects.name,
              subject_icon: test.subjects.icon,
              subject_color: test.subjects.color,
              interaction_count: 1,
            });
          }
        }
      });

      enrollments?.forEach((enrollment) => {
        const course = enrollment.courses as any;
        if (course?.subjects?.id) {
          const existing = subjectMap.get(course.subjects.id);
          if (existing) {
            existing.interaction_count += 2; // Weight enrollments higher
          } else {
            subjectMap.set(course.subjects.id, {
              subject_id: course.subjects.id,
              subject_name: course.subjects.name,
              subject_icon: course.subjects.icon,
              subject_color: course.subjects.color,
              interaction_count: 2,
            });
          }
        }
      });

      // Sort by interaction count (most active first)
      return Array.from(subjectMap.values()).sort(
        (a, b) => b.interaction_count - a.interaction_count
      );
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
