import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Check if user is following a specific center
export const useIsFollowing = (centerId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-following', centerId, user?.id],
    queryFn: async () => {
      if (!centerId || !user) return false;

      const { data, error } = await supabase
        .from('center_followers')
        .select('id')
        .eq('center_id', centerId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!centerId && !!user,
  });
};

// Get follower count for a center
export const useFollowerCount = (centerId: string | undefined) => {
  return useQuery({
    queryKey: ['follower-count', centerId],
    queryFn: async () => {
      if (!centerId) return 0;

      const { count, error } = await supabase
        .from('center_followers')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', centerId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!centerId,
  });
};

// Get all centers a user follows
export const useFollowedCenters = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followed-centers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('center_followers')
        .select(`
          id,
          followed_at,
          center:educational_centers(
            id,
            name,
            logo_url,
            description,
            followers_count
          )
        `)
        .eq('user_id', user.id)
        .order('followed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Follow a center
export const useFollowCenter = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (centerId: string) => {
      if (!user) throw new Error('Must be logged in to follow');

      const { error } = await supabase
        .from('center_followers')
        .insert({ user_id: user.id, center_id: centerId });

      if (error) throw error;
    },
    onSuccess: (_, centerId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', centerId] });
      queryClient.invalidateQueries({ queryKey: ['follower-count', centerId] });
      queryClient.invalidateQueries({ queryKey: ['followed-centers'] });
      toast.success('Now following this center!');
    },
    onError: (error) => {
      console.error('Follow error:', error);
      toast.error('Failed to follow center');
    },
  });
};

// Unfollow a center
export const useUnfollowCenter = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (centerId: string) => {
      if (!user) throw new Error('Must be logged in to unfollow');

      const { error } = await supabase
        .from('center_followers')
        .delete()
        .eq('user_id', user.id)
        .eq('center_id', centerId);

      if (error) throw error;
    },
    onSuccess: (_, centerId) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', centerId] });
      queryClient.invalidateQueries({ queryKey: ['follower-count', centerId] });
      queryClient.invalidateQueries({ queryKey: ['followed-centers'] });
      toast.success('Unfollowed center');
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow center');
    },
  });
};
