import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IncompleteTest {
  id: string;
  test_id: string;
  started_at: string;
  test: {
    id: string;
    title: string;
    difficulty: number;
    duration_minutes: number;
    subjects?: { id: string; name: string; color: string } | null;
  };
}

export interface IncompleteCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    instructor_name: string | null;
    subjects?: { id: string; name: string; color: string } | null;
  };
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface RecentlyCompletedTest {
  id: string;
  test_id: string;
  started_at: string;
  completed_at: string;
  score: number | null;
  total_points: number | null;
  test: {
    id: string;
    title: string;
    difficulty: number;
    duration_minutes: number;
    subjects?: { id: string; name: string; color: string } | null;
  };
}

export interface RecentlyCompletedCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    instructor_name: string | null;
    subjects?: { id: string; name: string; color: string } | null;
  };
}

export function useIncompleteTests(userId?: string) {
  return useQuery({
    queryKey: ["incomplete-tests", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("test_attempts")
        .select(`
          id,
          test_id,
          started_at,
          tests (
            id,
            title,
            difficulty,
            duration_minutes,
            subjects (id, name, color)
          )
        `)
        .eq("user_id", userId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        test_id: item.test_id,
        started_at: item.started_at,
        test: item.tests as IncompleteTest["test"],
      })) as IncompleteTest[];
    },
    enabled: !!userId,
  });
}

export function useIncompleteCourses(userId?: string) {
  return useQuery({
    queryKey: ["incomplete-courses", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get enrollments that are not completed
      const { data: enrollments, error: enrollError } = await supabase
        .from("course_enrollments")
        .select(`
          id,
          course_id,
          enrolled_at,
          courses (
            id,
            title,
            thumbnail_url,
            instructor_name,
            subjects (id, name, color)
          )
        `)
        .eq("user_id", userId)
        .is("completed_at", null)
        .order("enrolled_at", { ascending: false })
        .limit(10);

      if (enrollError) throw enrollError;
      if (!enrollments || enrollments.length === 0) return [];

      // Get lesson counts for enrolled courses
      const courseIds = enrollments.map((e) => e.course_id);
      
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, course_id")
        .in("course_id", courseIds);

      if (lessonsError) throw lessonsError;

      // Get lesson progress for this user
      const { data: progress, error: progressError } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed, course_id")
        .eq("user_id", userId)
        .in("course_id", courseIds);

      if (progressError) throw progressError;

      // Calculate progress for each course
      const result: IncompleteCourse[] = [];
      
      for (const enrollment of enrollments) {
        const courseLessons = lessons?.filter((l) => l.course_id === enrollment.course_id) || [];
        const totalLessons = courseLessons.length;
        
        if (totalLessons === 0) continue;
        
        const courseProgress = progress?.filter(
          (p) => p.course_id === enrollment.course_id && p.is_completed
        ) || [];
        const completedLessons = courseProgress.length;
        
        const percentage = Math.round((completedLessons / totalLessons) * 100);
        if (percentage < 100) {
          result.push({
            id: enrollment.id,
            course_id: enrollment.course_id,
            enrolled_at: enrollment.enrolled_at,
            course: enrollment.courses as IncompleteCourse["course"],
            progress: percentage,
            totalLessons,
            completedLessons,
          });
        }
      }

      return result.slice(0, 5);
    },
    enabled: !!userId,
  });
}

export function useRecentlyCompletedTests(userId?: string, days: number = 7) {
  return useQuery({
    queryKey: ["recently-completed-tests", userId, days],
    queryFn: async () => {
      if (!userId) return [];

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("test_attempts")
        .select(`
          id,
          test_id,
          started_at,
          completed_at,
          score,
          total_points,
          tests (
            id,
            title,
            difficulty,
            duration_minutes,
            subjects (id, name, color)
          )
        `)
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", since)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        test_id: item.test_id,
        started_at: item.started_at,
        completed_at: item.completed_at,
        score: item.score,
        total_points: item.total_points,
        test: item.tests as RecentlyCompletedTest["test"],
      })) as RecentlyCompletedTest[];
    },
    enabled: !!userId,
  });
}

export function useRecentlyCompletedCourses(userId?: string, days: number = 7) {
  return useQuery({
    queryKey: ["recently-completed-courses", userId, days],
    queryFn: async () => {
      if (!userId) return [];

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          id,
          course_id,
          enrolled_at,
          completed_at,
          courses (
            id,
            title,
            thumbnail_url,
            instructor_name,
            subjects (id, name, color)
          )
        `)
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .gte("completed_at", since)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        course_id: item.course_id,
        enrolled_at: item.enrolled_at,
        completed_at: item.completed_at,
        course: item.courses as RecentlyCompletedCourse["course"],
      })) as RecentlyCompletedCourse[];
    },
    enabled: !!userId,
  });
}
