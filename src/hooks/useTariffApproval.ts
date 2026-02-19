import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Fetch centers that have selected a tariff but are not yet active (awaiting approval)
export const usePendingTariffRequests = () => {
  return useQuery({
    queryKey: ['pending-tariff-requests'],
    queryFn: async () => {
      // Get subscriptions where tariff_selected = true
      // and center status is 'approved' (not yet 'active')
      const { data: subscriptions, error: subError } = await supabase
        .from('center_subscriptions')
        .select(`
          id,
          center_id,
          tier,
          tariff_selected,
          selected_at,
          max_courses,
          max_tests,
          max_videos,
          can_create_olympiads,
          admin_notes,
          educational_centers!inner (
            id,
            name,
            city,
            email,
            phone,
            status,
            owner_id
          )
        `)
        .eq('tariff_selected', true)
        .order('selected_at', { ascending: false });

      if (subError) throw subError;

      // Filter to only include centers with 'approved' status (not yet active)
      const pending = subscriptions?.filter(
        (sub) => sub.educational_centers?.status === 'approved'
      ) || [];

      return pending;
    },
  });
};

// Admin approves tariff - sets center to 'active'
export const useApproveTariff = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      centerId,
      subscriptionId,
      modifiedTier,
      adminNotes,
    }: {
      centerId: string;
      subscriptionId: string;
      modifiedTier?: 'free' | 'pro' | 'enterprise';
      adminNotes?: string;
    }) => {
      // Update subscription with approval info
      const subscriptionUpdates: Record<string, unknown> = {
        tariff_approved_at: new Date().toISOString(),
        tariff_approved_by: user?.id,
      };

      if (adminNotes) {
        subscriptionUpdates.admin_notes = adminNotes;
      }

      // If tier was modified, update the limits accordingly
      if (modifiedTier) {
        const tierLimits = {
          free: { max_courses: 3, max_tests: 5, max_videos: 10, can_create_olympiads: false, seo_boost_level: 0 },
          pro: { max_courses: 15, max_tests: 30, max_videos: 50, can_create_olympiads: true, seo_boost_level: 1 },
          enterprise: { max_courses: 9999, max_tests: 9999, max_videos: 9999, can_create_olympiads: true, seo_boost_level: 3 },
        };
        subscriptionUpdates.tier = modifiedTier;
        Object.assign(subscriptionUpdates, tierLimits[modifiedTier]);
      }

      const { error: subError } = await supabase
        .from('center_subscriptions')
        .update(subscriptionUpdates)
        .eq('id', subscriptionId);

      if (subError) throw subError;

      // Set center to 'active'
      const { error: centerError } = await supabase
        .from('educational_centers')
        .update({ status: 'active' })
        .eq('id', centerId);

      if (centerError) throw centerError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-tariff-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
      queryClient.invalidateQueries({ queryKey: ['all-centers-with-status'] });
    },
  });
};

// Admin rejects tariff request
export const useRejectTariff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      centerId,
      subscriptionId,
      reason,
    }: {
      centerId: string;
      subscriptionId: string;
      reason: string;
    }) => {
      // Reset the tariff selection
      const { error: subError } = await supabase
        .from('center_subscriptions')
        .update({
          tariff_selected: false,
          selected_at: null,
          admin_notes: reason,
          tier: 'free',
          max_courses: 3,
          max_tests: 5,
          max_videos: 10,
          can_create_olympiads: false,
          seo_boost_level: 0,
        })
        .eq('id', subscriptionId);

      if (subError) throw subError;

      // Set rejection reason on center (stays in 'approved' status, but can re-select tariff)
      const { error: centerError } = await supabase
        .from('educational_centers')
        .update({ rejection_reason: reason })
        .eq('id', centerId);

      if (centerError) throw centerError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-tariff-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
      queryClient.invalidateQueries({ queryKey: ['center-subscription-status'] });
    },
  });
};
