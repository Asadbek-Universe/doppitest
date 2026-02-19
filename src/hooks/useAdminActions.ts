import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Block/Unblock user
export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ blocked_at: block ? new Date().toISOString() : null })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

// Update user profile (admin)
export const useAdminUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      updates 
    }: { 
      userId: string; 
      updates: {
        display_name?: string;
        city?: string;
        phone?: string;
        bio?: string;
        grade?: string;
      }
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

// Delete user (soft delete by blocking, but option for hard delete)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, hardDelete = false }: { userId: string; hardDelete?: boolean }) => {
      if (hardDelete) {
        // Delete all related data first
        await supabase.from('user_roles').delete().eq('user_id', userId);
        await supabase.from('saved_items').delete().eq('user_id', userId);
        await supabase.from('question_bookmarks').delete().eq('user_id', userId);
        
        // Finally delete profile
        const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
        if (error) throw error;
      } else {
        // Soft delete - just block the user
        const { error } = await supabase
          .from('profiles')
          .update({ blocked_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
  });
};

// Update center (admin)
export const useAdminUpdateCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      centerId, 
      updates 
    }: { 
      centerId: string; 
      updates: {
        name?: string;
        description?: string;
        city?: string;
        address?: string;
        email?: string;
        phone?: string;
        website?: string;
        is_verified?: boolean;
        status?: 'pending' | 'approved' | 'rejected' | 'active';
      }
    }) => {
      const { error } = await supabase
        .from('educational_centers')
        .update(updates)
        .eq('id', centerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
    },
  });
};

// Delete center
export const useDeleteCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (centerId: string) => {
      // Delete related data first
      await supabase.from('center_subscriptions').delete().eq('center_id', centerId);
      await supabase.from('center_seo_settings').delete().eq('center_id', centerId);
      await supabase.from('center_analytics').delete().eq('center_id', centerId);
      await supabase.from('center_reels').delete().eq('center_id', centerId);
      await supabase.from('center_followers').delete().eq('center_id', centerId);
      
      // Delete content
      await supabase.from('courses').delete().eq('center_id', centerId);
      await supabase.from('tests').delete().eq('center_id', centerId);
      await supabase.from('olympiads').delete().eq('center_id', centerId);
      
      // Finally delete center
      const { error } = await supabase.from('educational_centers').delete().eq('id', centerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tests'] });
    },
  });
};

// Update center subscription/tariff
export const useUpdateCenterTariff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      centerId, 
      tier,
      maxCourses,
      maxTests,
      maxVideos,
      canCreateOlympiads,
    }: { 
      centerId: string; 
      tier: 'free' | 'pro' | 'enterprise';
      maxCourses?: number;
      maxTests?: number;
      maxVideos?: number;
      canCreateOlympiads?: boolean;
    }) => {
      const updates: Record<string, unknown> = { tier };
      if (maxCourses !== undefined) updates.max_courses = maxCourses;
      if (maxTests !== undefined) updates.max_tests = maxTests;
      if (maxVideos !== undefined) updates.max_videos = maxVideos;
      if (canCreateOlympiads !== undefined) updates.can_create_olympiads = canCreateOlympiads;

      const { error } = await supabase
        .from('center_subscriptions')
        .update(updates)
        .eq('center_id', centerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-center-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
    },
  });
};

// Approve/Reject center
export const useApproveCenterStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      centerId, 
      status,
      rejectionReason,
      approvedBy,
    }: { 
      centerId: string; 
      status: 'approved' | 'rejected';
      rejectionReason?: string;
      approvedBy?: string;
    }) => {
      const updates: Record<string, unknown> = { 
        status,
        is_verified: status === 'approved',
      };
      
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = approvedBy;
        updates.rejection_reason = null;
      } else {
        updates.rejection_reason = rejectionReason;
        updates.approved_at = null;
        updates.approved_by = null;
      }

      const { error } = await supabase
        .from('educational_centers')
        .update(updates)
        .eq('id', centerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
    },
  });
};

// Bulk block users
export const useBulkBlockUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, block }: { userIds: string[]; block: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ blocked_at: block ? new Date().toISOString() : null })
        .in('user_id', userIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

// Bulk delete centers
export const useBulkDeleteCenters = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (centerIds: string[]) => {
      // Delete related data first
      await supabase.from('center_subscriptions').delete().in('center_id', centerIds);
      await supabase.from('center_seo_settings').delete().in('center_id', centerIds);
      await supabase.from('center_analytics').delete().in('center_id', centerIds);
      await supabase.from('center_reels').delete().in('center_id', centerIds);
      await supabase.from('center_followers').delete().in('center_id', centerIds);
      await supabase.from('courses').delete().in('center_id', centerIds);
      await supabase.from('tests').delete().in('center_id', centerIds);
      await supabase.from('olympiads').delete().in('center_id', centerIds);
      
      const { error } = await supabase.from('educational_centers').delete().in('id', centerIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tests'] });
    },
  });
};
