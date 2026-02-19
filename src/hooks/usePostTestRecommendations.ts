import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  score: number;
  totalPoints: number;
  percentage: number;
  subjectId?: string | null;
  weakTopics: string[];
  timeSpent: number;
}

interface RecommendedTest {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  questions_count: number;
  duration_minutes: number;
  is_official: boolean;
  author_name: string | null;
  subject: { name: string; color: string | null } | null;
}

interface RecommendedCourse {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  lessons_count: number | null;
  instructor_name: string;
  thumbnail_url: string | null;
  rating: number | null;
  subject: { name: string; color: string | null } | null;
  center: { name: string; logo_url: string | null } | null;
}

interface RecommendedCenter {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  city: string | null;
  is_verified: boolean | null;
  followers_count: number;
  student_count: number | null;
  specializations: string[] | null;
  courses_count: number;
  tests_count: number;
}

// Fetch recommended tests based on performance
export function useRecommendedTests(result: TestResult | null, currentTestId?: string) {
  return useQuery({
    queryKey: ["recommended-tests", result?.subjectId, result?.percentage, currentTestId],
    queryFn: async () => {
      if (!result) return [];

      // Get tests in the same subject with appropriate difficulty
      let difficulty = 2; // Default medium
      if (result.percentage < 40) difficulty = 1; // Easy if struggling
      else if (result.percentage >= 70) difficulty = result.percentage >= 85 ? 5 : 4; // Harder if doing well

      let query = supabase
        .from("tests")
        .select(`
          id, title, description, difficulty, questions_count, duration_minutes,
          is_official, author_name,
          subjects (name, color)
        `)
        .eq("is_published", true)
        .gt("questions_count", 0)
        .neq("id", currentTestId || "")
        .order("created_at", { ascending: false })
        .limit(6);

      // Prioritize same subject
      if (result.subjectId) {
        query = query.eq("subject_id", result.subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform the data
      return (data || []).map((test: any) => ({
        ...test,
        subject: test.subjects,
      })) as RecommendedTest[];
    },
    enabled: !!result,
  });
}

// Fetch recommended courses based on weak topics
export function useRecommendedCourses(result: TestResult | null) {
  return useQuery({
    queryKey: ["recommended-courses", result?.subjectId, result?.weakTopics],
    queryFn: async () => {
      if (!result) return [];

      let query = supabase
        .from("courses")
        .select(`
          id, title, description, duration_minutes, lessons_count,
          instructor_name, thumbnail_url, rating,
          subjects (name, color),
          educational_centers (name, logo_url)
        `)
        .eq("is_published", true)
        .gt("lessons_count", 0)
        .order("rating", { ascending: false })
        .limit(6);

      // Prioritize same subject
      if (result.subjectId) {
        query = query.eq("subject_id", result.subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((course: any) => ({
        ...course,
        subject: course.subjects,
        center: course.educational_centers,
      })) as RecommendedCourse[];
    },
    enabled: !!result,
  });
}

// Fetch recommended centers based on subject expertise
export function useRecommendedCenters(result: TestResult | null) {
  return useQuery({
    queryKey: ["recommended-centers", result?.subjectId],
    queryFn: async () => {
      if (!result) return [];

      // Get centers with courses/tests in this subject
      const { data: centers, error: centersError } = await supabase
        .from("educational_centers")
        .select(`
          id, name, description, logo_url, city, is_verified,
          followers_count, student_count, specializations
        `)
        .eq("status", "approved")
        .eq("onboarding_completed", true)
        .order("followers_count", { ascending: false })
        .limit(6);

      if (centersError) throw centersError;

      // Get courses and tests count for each center
      const centersWithCounts = await Promise.all(
        (centers || []).map(async (center) => {
          const [coursesRes, testsRes] = await Promise.all([
            supabase
              .from("courses")
              .select("id", { count: "exact", head: true })
              .eq("center_id", center.id)
              .eq("is_published", true),
            supabase
              .from("tests")
              .select("id", { count: "exact", head: true })
              .eq("center_id", center.id)
              .eq("is_published", true),
          ]);

          return {
            ...center,
            courses_count: coursesRes.count || 0,
            tests_count: testsRes.count || 0,
          };
        })
      );

      return centersWithCounts as RecommendedCenter[];
    },
    enabled: !!result,
  });
}

// Calculate weak topics from answers
export function calculateWeakTopics(
  questions: Array<{ id: string; topic: string | null }>,
  answers: Record<number, { optionId: string; isCorrect: boolean }>
): string[] {
  const topicStats: Record<string, { correct: number; total: number }> = {};

  questions.forEach((q, idx) => {
    if (!q.topic) return;
    
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { correct: 0, total: 0 };
    }
    
    topicStats[q.topic].total++;
    
    const answer = answers[idx];
    if (answer?.isCorrect) {
      topicStats[q.topic].correct++;
    }
  });

  // Return topics where accuracy is below 50%
  return Object.entries(topicStats)
    .filter(([_, stats]) => stats.total > 0 && stats.correct / stats.total < 0.5)
    .map(([topic]) => topic);
}
