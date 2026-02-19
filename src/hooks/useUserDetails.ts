import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserTestAttempts = (userId: string | null) => {
  return useQuery({
    queryKey: ['admin-user-test-attempts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*, tests(title, subjects(name))')
        .eq('user_id', userId!)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};

export const useUserCourseEnrollments = (userId: string | null) => {
  return useQuery({
    queryKey: ['admin-user-enrollments', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, courses(title, subjects(name))')
        .eq('user_id', userId!)
        .order('enrolled_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};

export const useUserLessonProgress = (userId: string | null) => {
  return useQuery({
    queryKey: ['admin-user-lesson-progress', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*, lessons(title, course_id), courses:lessons(courses(title))')
        .eq('user_id', userId!)
        .order('completed_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
  });
};

export const useUserSavedItems = (userId: string | null) => {
  return useQuery({
    queryKey: ['admin-user-saved-items', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
  });
};

export const useUserActivityLogs = (userId: string | null) => {
  return useQuery({
    queryKey: ['admin-user-activity-logs', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });
};
