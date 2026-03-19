import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Reel {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  views_count: number;
  likes_count: number;
  is_published: boolean;
  created_at: string;
  center_id: string;
  subject_id: string | null;
  subject?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  center?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export const usePublishedReels = (subjectFilter?: string) => {
  return useQuery({
    queryKey: ["published-reels", subjectFilter],
    queryFn: async () => {
      let query = supabase
        .from("center_reels")
        .select(`
          *,
          subject:subjects(id, name, color),
          center:educational_centers(id, name, logo_url)
        `)
        .eq("is_published", true)
        .eq("approval_status", "published")
        .order("created_at", { ascending: false });

      if (subjectFilter && subjectFilter !== "all") {
        query = query.eq("subject_id", subjectFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Reel[];
    },
  });
};

export const useIncrementReelViews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reelId: string) => {
      // Get current views and increment
      const { data: reel } = await supabase
        .from("center_reels")
        .select("views_count")
        .eq("id", reelId)
        .single();
      
      if (reel) {
        const { error } = await supabase
          .from("center_reels")
          .update({ views_count: (reel.views_count || 0) + 1 })
          .eq("id", reelId);
        if (error) console.error("Failed to increment views:", error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-reels"] });
    },
  });
};

export const useLikeReel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reelId: string) => {
      // For now, just increment the likes count directly
      // In a full implementation, you'd track user likes in a separate table
      const { data: reel } = await supabase
        .from("center_reels")
        .select("likes_count")
        .eq("id", reelId)
        .single();
      
      if (reel) {
        const { error } = await supabase
          .from("center_reels")
          .update({ likes_count: (reel.likes_count || 0) + 1 })
          .eq("id", reelId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-reels"] });
    },
  });
};

export const useSubjects = () => {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};
