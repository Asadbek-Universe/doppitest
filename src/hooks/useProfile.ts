import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  phone: string | null;
  gender: string | null;
  grade: string | null;
  studies_at_center: boolean | null;
  center_name: string | null;
  purpose: string | null;
  onboarding_completed: boolean | null;
  school: string | null;
  preferred_language: string | null;
  interests: string[] | null;
  weak_subjects: string[] | null;
  goals: string | null;
  study_time_per_day_minutes: number | null;
  preparing_for_olympiads: boolean | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

/** User's personal profile (profiles table). For center's public profile use useMyCenter in center panel. */
export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    retry: false,
    retryOnMount: false,
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      updates: Partial<
        Pick<
          Profile,
          'display_name' | 'avatar_url' | 'bio' | 'city' | 'preferred_language'
        >
      >
    ) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    },
  });
};
