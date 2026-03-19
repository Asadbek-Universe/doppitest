import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Cache configuration for home feed queries - 5 min stale, 30 min gc
const FEED_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,
};

// Fetch featured tests (popular published tests with at least 1 question)
export const useFeaturedTests = () => {
  return useQuery({
    queryKey: ["featured-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select(`
          id,
          title,
          description,
          difficulty,
          duration_minutes,
          questions_count,
          is_free,
          is_published,
          price,
          completions,
          author_name,
          approval_status,
          subjects(name, color, icon),
          educational_centers(name, is_verified)
        `)
        .eq("is_published", true)
        .eq("approval_status", "published")
        .gt("questions_count", 0)
        .order("completions", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    ...FEED_CACHE_CONFIG,
  });
};

// Fetch featured courses (popular published courses with at least 1 lesson)
export const useFeaturedCourses = () => {
  return useQuery({
    queryKey: ["featured-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          description,
          instructor_name,
          thumbnail_url,
          rating,
          students_count,
          lessons_count,
          duration_minutes,
          is_free,
          is_published,
          price,
          approval_status,
          subjects(name, color, icon),
          educational_centers(name, is_verified, logo_url)
        `)
        .eq("is_published", true)
        .eq("approval_status", "published")
        .gt("lessons_count", 0)
        .order("students_count", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    ...FEED_CACHE_CONFIG,
  });
};

// Fetch featured reels (popular published reels)
export const useFeaturedReels = () => {
  return useQuery({
    queryKey: ["featured-reels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("center_reels")
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          duration_seconds,
          views_count,
          likes_count,
          subjects(name, color, icon),
          educational_centers(name, is_verified, logo_url)
        `)
        .eq("is_published", true)
        .order("views_count", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    ...FEED_CACHE_CONFIG,
  });
};

// Fetch featured centers (verified centers with high follower count)
export const useFeaturedCenters = () => {
  return useQuery({
    queryKey: ["featured-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_centers")
        .select(`
          id,
          name,
          description,
          logo_url,
          city,
          is_verified,
          followers_count
        `)
        .eq("is_verified", true)
        .order("followers_count", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    ...FEED_CACHE_CONFIG,
  });
};

// Fetch upcoming published olympiads
export const useUpcomingOlympiads = () => {
  return useQuery({
    queryKey: ["upcoming-olympiads"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("olympiads")
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          status,
          subject_id,
          registration_deadline,
          max_participants,
          current_participants,
          prize_description,
          is_published,
          approval_status,
          subjects(name, color, icon),
          educational_centers(name, is_verified, logo_url)
        `)
        .eq("is_public", true)
        .eq("approval_status", "published")
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(6);

      if (error) throw error;
      return data;
    },
    ...FEED_CACHE_CONFIG,
  });
};

// Fetch past/completed olympiads with top winners
export const usePastOlympiads = () => {
  return useQuery({
    queryKey: ["past-olympiads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("olympiads")
        .select(`
          id,
          title,
          start_date,
          end_date,
          subject_id,
          current_participants,
          is_published,
          approval_status,
          subjects(name, color, icon),
          educational_centers(name, is_verified, logo_url)
        `)
        .eq("is_public", true)
        .eq("approval_status", "published")
        .eq("status", "completed")
        .order("end_date", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
    ...FEED_CACHE_CONFIG,
  });
};

// Fetch top winners for a specific olympiad
export const useOlympiadWinners = (olympiadId: string) => {
  return useQuery({
    queryKey: ["olympiad-winners", olympiadId],
    queryFn: async () => {
      const { data: registrations, error } = await supabase
        .from("olympiad_registrations")
        .select("*")
        .eq("olympiad_id", olympiadId)
        .not("rank", "is", null)
        .order("rank", { ascending: true })
        .limit(3);

      if (error) throw error;
      
      if (!registrations || registrations.length === 0) return [];

      // Fetch profiles for winners
      const userIds = registrations.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      return registrations.map(reg => ({
        ...reg,
        profile: profiles?.find(p => p.user_id === reg.user_id) || null
      }));
    },
    enabled: !!olympiadId,
  });
};

// Fetch all subjects - longer cache since subjects rarely change
export const useAllSubjects = () => {
  return useQuery({
    queryKey: ["all-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
  });
};
