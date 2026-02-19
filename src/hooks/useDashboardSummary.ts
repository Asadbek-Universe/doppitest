import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const startOfRange = (daysBack: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const rangeStart = startOfRange(30); // last 30 days

      const [
        newUsersRange,
        pendingCenters,
        recentActivity,
        newCoursesRange,
        newTestsRange,
        activeTestAttempts,
      ] = await Promise.all([
        // New users registered in the last 30 days
        supabase
          .from('profiles')
          .select('id, display_name, created_at')
          .gte('created_at', rangeStart)
          .order('created_at', { ascending: false })
          .limit(5),

        // Pending center verifications
        supabase
          .from('educational_centers')
          .select('id, name, created_at')
          .eq('is_verified', false)
          .order('created_at', { ascending: false })
          .limit(5),

        // Recent activity logs (last 10)
        supabase
          .from('activity_logs')
          .select('id, action_type, entity_type, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10),

        // New courses in the last 30 days
        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', rangeStart),

        // New tests in the last 30 days
        supabase
          .from('tests')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', rangeStart),

        // Active test attempts (in_progress)
        supabase
          .from('test_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'in_progress'),
      ]);

      // Get profile display names for activity logs
      const userIds = [...new Set(recentActivity.data?.filter(l => l.user_id).map(l => l.user_id) || [])];
      let profilesMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds as string[]);

        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p.display_name || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }

      const enrichedActivity = recentActivity.data?.map(log => ({
        ...log,
        user_display_name: log.user_id ? profilesMap[log.user_id] || null : null,
      })) || [];

      // Get total pending count
      const { count: pendingCount } = await supabase
        .from('educational_centers')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', false);

      // Get total new users in the range count
      const { count: newUsersRangeCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', rangeStart);

      return {
        newUsersRange: {
          count: newUsersRangeCount ?? 0,
          items: newUsersRange.data || [],
        },
        pendingVerifications: {
          count: pendingCount ?? 0,
          items: pendingCenters.data || [],
        },
        recentActivity: enrichedActivity,
        rangeStats: {
          newCourses: newCoursesRange.count ?? 0,
          newTests: newTestsRange.count ?? 0,
          activeAttempts: activeTestAttempts.count ?? 0,
        },
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
