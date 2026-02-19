import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch a single center by ID (public)
export const usePublicCenter = (centerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-center', centerId],
    queryFn: async () => {
      if (!centerId) return null;

      const { data, error } = await supabase
        .from('educational_centers')
        .select('*')
        .eq('id', centerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
};

// Fetch all public centers
export const usePublicCenters = () => {
  return useQuery({
    queryKey: ['public-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('educational_centers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch published courses for a center (public)
export const usePublicCenterCourses = (centerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-center-courses', centerId],
    queryFn: async () => {
      if (!centerId) return [];

      const { data, error } = await supabase
        .from('courses')
        .select('*, subjects(name, color)')
        .eq('center_id', centerId)
        .eq('is_published', true)
        .gt('lessons_count', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
};

// Fetch published tests for a center (public)
export const usePublicCenterTests = (centerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-center-tests', centerId],
    queryFn: async () => {
      if (!centerId) return [];

      const { data, error } = await supabase
        .from('tests')
        .select('*, subjects(name, color)')
        .eq('center_id', centerId)
        .eq('is_published', true)
        .gt('questions_count', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
};

// Fetch reviews for courses of a center (public)
export const usePublicCenterReviews = (centerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-center-reviews', centerId],
    queryFn: async () => {
      if (!centerId) return [];

      // First get center's course IDs
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('center_id', centerId);

      if (!courses || courses.length === 0) return [];

      const courseIds = courses.map((c) => c.id);

      const { data, error } = await supabase
        .from('course_reviews')
        .select('*, profiles:user_id(display_name, avatar_url), courses(title)')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
};

// Fetch public reels for a center
export const usePublicCenterReels = (centerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-center-reels', centerId],
    queryFn: async () => {
      if (!centerId) return [];

      const { data, error } = await supabase
        .from('center_reels')
        .select('*, subjects(name)')
        .eq('center_id', centerId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
};

// Fetch upcoming published olympiads for a center (public)
export const usePublicCenterOlympiads = (centerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-center-olympiads', centerId],
    queryFn: async () => {
      if (!centerId) return [];

      const { data, error } = await supabase
        .from('olympiads')
        .select('*, subjects(name)')
        .eq('center_id', centerId)
        .eq('is_public', true)
        .eq('is_published', true)
        .in('status', ['upcoming', 'active'])
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });
};