import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCenterCourses = (centerId: string | null) => {
  return useQuery({
    queryKey: ['admin-center-courses', centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, students_count, rating, created_at, subjects(name)')
        .eq('center_id', centerId!)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};

export const useCenterTests = (centerId: string | null) => {
  return useQuery({
    queryKey: ['admin-center-tests', centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('id, title, completions, rating, created_at, subjects(name)')
        .eq('center_id', centerId!)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};

export const useCenterReels = (centerId: string | null) => {
  return useQuery({
    queryKey: ['admin-center-reels', centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_reels')
        .select('id, title, views_count, likes_count, created_at')
        .eq('center_id', centerId!)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};

export const useCenterOlympiads = (centerId: string | null) => {
  return useQuery({
    queryKey: ['admin-center-olympiads', centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('olympiads')
        .select('id, title, status, current_participants, start_date, end_date')
        .eq('center_id', centerId!)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};

export const useCenterAnalyticsSummary = (centerId: string | null) => {
  return useQuery({
    queryKey: ['admin-center-analytics-summary', centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_analytics')
        .select('*')
        .eq('center_id', centerId!)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      // Aggregate stats
      const totals = (data || []).reduce(
        (acc, row) => ({
          profile_views: acc.profile_views + (row.profile_views || 0),
          course_views: acc.course_views + (row.course_views || 0),
          test_views: acc.test_views + (row.test_views || 0),
          video_views: acc.video_views + (row.video_views || 0),
          enrollments: acc.enrollments + (row.enrollments || 0),
          test_completions: acc.test_completions + (row.test_completions || 0),
          revenue: acc.revenue + (row.revenue || 0),
        }),
        {
          profile_views: 0,
          course_views: 0,
          test_views: 0,
          video_views: 0,
          enrollments: 0,
          test_completions: 0,
          revenue: 0,
        }
      );

      return { totals, daily: data || [] };
    },
  });
};

export const useCenterSubscription = (centerId: string | null) => {
  return useQuery({
    queryKey: ['admin-center-subscription', centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_subscriptions')
        .select('*')
        .eq('center_id', centerId!)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
};
