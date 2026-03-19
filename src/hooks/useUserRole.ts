import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'center' | 'user';
export type AdminRole = 'super_admin' | 'moderator' | 'content_reviewer' | 'finance_admin';

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL as string | undefined;
const VALID_ROLES: AppRole[] = ['admin', 'center', 'user'];

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    retry: 1,
    retryOnMount: true,
    queryFn: async (): Promise<AppRole | null> => {
      if (!user?.id) return null;

      // 1) Prefer profiles.role (source of truth for app)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileRole = profile?.role as string | null;
      if (profileRole === 'admin' || profileRole === 'center') {
        return profileRole as AppRole;
      }
      if (profileRole === 'user') {
        const { data: center } = await supabase
          .from('educational_centers')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();
        if (center) return 'center';
        return 'user';
      }

      // 2) Fallback: user_roles table (get_user_role RPC)
      const { data: rpcRole, error } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (!error && rpcRole && VALID_ROLES.includes(rpcRole as AppRole)) {
        return rpcRole as AppRole;
      }
      if (error) {
        console.warn('get_user_role failed:', error);
      }

      // 3) Super admin by email
      if (user.email && SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL) {
        return 'admin';
      }

      return null;
    },
    enabled: !!user?.id,
  });
};

export const useAdminRole = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('admin_role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching admin sub-role:', error);
        return null;
      }
      return (data?.admin_role as AdminRole | null) ?? null;
    },
    enabled: !!user?.id,
  });
};

export const useIsAdmin = () => {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === 'admin', isLoading };
};

export const useIsCenter = () => {
  const { data: role, isLoading } = useUserRole();
  return { isCenter: role === 'center', isLoading };
};

/** True if the current user owns an educational_centers row (used for redirects when role may not be "center" yet). */
export const useOwnsCenter = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owns-center', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('educational_centers')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });
};
