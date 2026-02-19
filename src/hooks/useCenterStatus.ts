import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CenterStatus = 'pending' | 'approved' | 'rejected' | 'active';

export interface CenterWithStatus {
  id: string;
  name: string;
  status: CenterStatus;
  rejection_reason: string | null;
  is_verified: boolean;
  onboarding_completed: boolean;
  owner_id: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface CenterSubscriptionWithTariff {
  id: string;
  center_id: string;
  tier: 'free' | 'pro' | 'enterprise';
  tariff_selected: boolean;
  selected_at: string | null;
  max_courses: number;
  max_tests: number;
  max_videos: number;
  can_create_olympiads: boolean;
  seo_boost_level: number;
  is_active: boolean;
  admin_notes: string | null;
  tariff_approved_at: string | null;
  tariff_approved_by: string | null;
}

// Fetch center status for current user
export const useMyCenterStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-center-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('educational_centers')
        .select('id, name, status, rejection_reason, is_verified, onboarding_completed, owner_id, approved_at, approved_by')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CenterWithStatus | null;
    },
    enabled: !!user?.id,
  });
};

// Fetch subscription with tariff_selected flag
export const useCenterSubscriptionStatus = (centerId: string | null | undefined) => {
  return useQuery({
    queryKey: ['center-subscription-status', centerId],
    queryFn: async () => {
      if (!centerId) return null;

      const { data, error } = await supabase
        .from('center_subscriptions')
        .select('id, center_id, tier, tariff_selected, selected_at, max_courses, max_tests, max_videos, can_create_olympiads, seo_boost_level, is_active, admin_notes, tariff_approved_at, tariff_approved_by')
        .eq('center_id', centerId)
        .maybeSingle();

      if (error) throw error;
      return data as CenterSubscriptionWithTariff | null;
    },
    enabled: !!centerId,
  });
};

// Select a tariff (for centers after approval)
export const useSelectTariff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      tier,
    }: {
      subscriptionId: string;
      tier: 'free' | 'pro' | 'enterprise';
    }) => {
      // Get tier limits
      const tierLimits = {
        free: { max_courses: 3, max_tests: 5, max_videos: 10, can_create_olympiads: false, seo_boost_level: 0 },
        pro: { max_courses: 15, max_tests: 30, max_videos: 50, can_create_olympiads: true, seo_boost_level: 1 },
        enterprise: { max_courses: 9999, max_tests: 9999, max_videos: 9999, can_create_olympiads: true, seo_boost_level: 3 },
      };

      const { error } = await supabase
        .from('center_subscriptions')
        .update({
          tier,
          tariff_selected: true,
          ...tierLimits[tier],
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-center-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-center'] });
    },
  });
};

// Admin: Fetch all centers for approval
export const usePendingCenters = () => {
  return useQuery({
    queryKey: ['pending-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('educational_centers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Admin: Fetch all centers with status
export const useAllCentersWithStatus = () => {
  return useQuery({
    queryKey: ['all-centers-with-status'],
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

// Admin: Approve a center
export const useApproveCenter = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (centerId: string) => {
      const { error } = await supabase
        .from('educational_centers')
        .update({
          status: 'approved',
          is_verified: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', centerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-centers'] });
      queryClient.invalidateQueries({ queryKey: ['all-centers-with-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
    },
  });
};

// Admin: Reject a center
export const useRejectCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ centerId, reason }: { centerId: string; reason: string }) => {
      const { error } = await supabase
        .from('educational_centers')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          is_verified: false,
        })
        .eq('id', centerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-centers'] });
      queryClient.invalidateQueries({ queryKey: ['all-centers-with-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
    },
  });
};
