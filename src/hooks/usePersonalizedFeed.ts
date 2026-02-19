import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

// Map grades to difficulty levels for test recommendations
const gradeToTestDifficulty: Record<string, number[]> = {
  "5-sinf": [1],
  "6-sinf": [1, 2],
  "7-sinf": [1, 2],
  "8-sinf": [2, 3],
  "9-sinf": [2, 3],
  "10-sinf": [3, 4],
  "11-sinf": [3, 4, 5],
  "Abituriyent": [4, 5],
  "Talaba": [4, 5],
};

// Map purposes to recommended content types
const purposeKeywords: Record<string, string[]> = {
  "Olimpiadaga tayyorlanish": ["olympiad", "competition", "advanced"],
  "Maktab fanlarini mustahkamlash": ["basics", "fundamentals", "school"],
  "DTM/Test tayyorgarlik": ["exam", "test", "preparation", "DTM"],
  "Yangi ko'nikmalar o'rganish": ["beginner", "introduction", "new"],
  "Chet tili o'rganish": ["english", "language", "vocabulary"],
};

export const usePersonalizedTests = (subjectId?: string | null) => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["personalized-tests", profile?.grade, profile?.purpose, subjectId],
    queryFn: async () => {
      const difficulties = profile?.grade 
        ? gradeToTestDifficulty[profile.grade] || [2, 3] 
        : [2, 3];

      let query = supabase
        .from("tests")
        .select(`
          id,
          title,
          description,
          difficulty,
          duration_minutes,
          questions_count,
          is_free,
          price,
          completions,
          author_name,
          tags,
          subject_id,
          subjects(name, color, icon),
          educational_centers(name, is_verified)
        `)
        .in("difficulty", difficulties);

      // Filter by subject if specified
      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query
        .order("completions", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const usePersonalizedCourses = (subjectId?: string | null) => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["personalized-courses", profile?.grade, profile?.purpose, subjectId],
    queryFn: async () => {
      let query = supabase
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
          price,
          tags,
          subject_id,
          subjects(name, color, icon),
          educational_centers(name, is_verified, logo_url)
        `);

      // Filter by subject if specified
      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query
        .order("rating", { ascending: false })
        .limit(6);

      if (error) throw error;
      
      // If user has a purpose, prioritize courses matching keywords
      if (profile?.purpose && data) {
        const keywords = purposeKeywords[profile.purpose] || [];
        return data.sort((a, b) => {
          const aMatch = keywords.some(kw => 
            a.title?.toLowerCase().includes(kw.toLowerCase()) ||
            a.description?.toLowerCase().includes(kw.toLowerCase()) ||
            a.tags?.some((t: string) => t.toLowerCase().includes(kw.toLowerCase()))
          );
          const bMatch = keywords.some(kw => 
            b.title?.toLowerCase().includes(kw.toLowerCase()) ||
            b.description?.toLowerCase().includes(kw.toLowerCase()) ||
            b.tags?.some((t: string) => t.toLowerCase().includes(kw.toLowerCase()))
          );
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }
      
      return data;
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useRecommendedOlympiads = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["recommended-olympiads", profile?.purpose],
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
          registration_deadline,
          max_participants,
          current_participants,
          prize_description,
          subjects(name, color, icon),
          educational_centers(name, is_verified, logo_url)
        `)
        .eq("is_public", true)
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(4);

      if (error) throw error;
      return data;
    },
    enabled: !!profile && profile.purpose === "Olimpiadaga tayyorlanish",
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const usePersonalizedGreeting = () => {
  const { data: profile, isLoading } = useProfile();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Xayrli tong";
    if (hour < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  const getMotivation = () => {
    const motivations: Record<string, string> = {
      "Olimpiadaga tayyorlanish": "Olimpiadaga tayyor bo'lish uchun mashq qiling! 🏆",
      "Maktab fanlarini mustahkamlash": "Bugun yangi bilim o'rganing! 📚",
      "DTM/Test tayyorgarlik": "Test tayyorgarligini davom ettiring! ✍️",
      "Yangi ko'nikmalar o'rganish": "Yangi narsalarni kashf qiling! 🌟",
      "Chet tili o'rganish": "Til o'rganishda davom eting! 🌍",
    };
    return profile?.purpose ? motivations[profile.purpose] : "Keling, bugun ham o'rganamiz! 🚀";
  };

  return {
    greeting: getGreeting(),
    name: profile?.display_name || "O'quvchi",
    motivation: getMotivation(),
    grade: profile?.grade,
    purpose: profile?.purpose,
    isLoading,
    hasProfile: !!profile?.onboarding_completed,
  };
};
