import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fetch all subjects
export const useSubjects = () => {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch all published, approved courses with at least 1 lesson (for public view)
export const useCourses = (subjectId?: string) => {
  return useQuery({
    queryKey: ["courses", subjectId],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select(`
          *,
          subjects (
            id,
            name,
            color,
            icon
          )
        `)
        .eq("is_published", true)
        .eq("approval_status", "published")
        .gt("lessons_count", 0)
        .order("created_at", { ascending: false });

      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Fetch single course with all details
export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          subjects (
            id,
            name,
            color,
            icon
          )
        `)
        .eq("id", courseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

// Fetch lessons for a course grouped by section
export const useLessons = (courseId: string) => {
  return useQuery({
    queryKey: ["lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Group lessons by section
      const sections: Record<string, typeof data> = {};
      data?.forEach((lesson) => {
        const section = lesson.section_title || "Introduction";
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push(lesson);
      });

      return { lessons: data, sections };
    },
    enabled: !!courseId,
  });
};

// Fetch course reviews
export const useCourseReviews = (courseId: string) => {
  return useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

// Enroll in a course
export const useEnrollCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      userId,
    }: {
      courseId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", variables.courseId] });
    },
  });
};

// Check enrollment status
export const useEnrollmentStatus = (courseId: string, userId?: string) => {
  return useQuery({
    queryKey: ["enrollment", courseId, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!userId,
  });
};

// Update lesson progress
export const useUpdateLessonProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      courseId,
      userId,
      isCompleted,
      watchedSeconds,
    }: {
      lessonId: string;
      courseId: string;
      userId: string;
      isCompleted?: boolean;
      watchedSeconds?: number;
    }) => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .upsert(
          {
            lesson_id: lessonId,
            course_id: courseId,
            user_id: userId,
            is_completed: isCompleted,
            watched_seconds: watchedSeconds,
            completed_at: isCompleted ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,lesson_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", variables.courseId] });
    },
  });
};

// Get lesson progress for a course
export const useLessonProgress = (courseId: string, userId?: string) => {
  return useQuery({
    queryKey: ["lesson-progress", courseId, userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!userId,
  });
};

// Submit a review
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      userId,
      rating,
      reviewText,
    }: {
      courseId: string;
      userId: string;
      rating: number;
      reviewText?: string;
    }) => {
      const { data, error } = await supabase
        .from("course_reviews")
        .upsert(
          {
            course_id: courseId,
            user_id: userId,
            rating,
            review_text: reviewText,
          },
          { onConflict: "user_id,course_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-reviews", variables.courseId] });
    },
  });
};

// Fetch all user enrollments with course details
export const useUserEnrollments = (userId?: string) => {
  return useQuery({
    queryKey: ["user-enrollments", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses (
            *,
            subjects (
              id,
              name,
              color,
              icon
            )
          )
        `)
        .eq("user_id", userId)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Fetch all lesson progress for a user
export const useAllLessonProgress = (userId?: string) => {
  return useQuery({
    queryKey: ["all-lesson-progress", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("lesson_progress")
        .select(`
          *,
          lessons (
            id,
            title,
            course_id,
            duration_minutes
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Fetch lessons count per course for calculating progress
export const useCourseLessonsCounts = (courseIds: string[]) => {
  return useQuery({
    queryKey: ["course-lessons-counts", courseIds],
    queryFn: async () => {
      if (!courseIds.length) return {};
      
      const { data, error } = await supabase
        .from("lessons")
        .select("id, course_id")
        .in("course_id", courseIds);

      if (error) throw error;
      
      // Count lessons per course
      const counts: Record<string, number> = {};
      data?.forEach((lesson) => {
        counts[lesson.course_id] = (counts[lesson.course_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: courseIds.length > 0,
  });
};
