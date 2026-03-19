import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ISODateString = string;

const startOfDayISO = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};

const endOfDayISO = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
};

const yyyyMmDd = (isoOrDate: string | Date) => {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Fetch all users with their profiles
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch all user roles
export const useAllUserRoles = () => {
  return useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      return data;
    },
  });
};

// Fetch all courses
export const useAllCourses = () => {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch all tests
export const useAllTests = () => {
  return useQuery({
    queryKey: ['admin-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch all educational centers
export const useAllCenters = () => {
  return useQuery({
    queryKey: ['admin-centers'],
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

// Fetch platform stats
export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        users,
        activeUsers,
        courses,
        tests,
        centers,
        enrollments,
        attempts,
        olympiads,
        reels,
        pendingCenters,
        pendingCourses,
        pendingTests,
        pendingOlympiads,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('last_activity_at', sevenDaysAgo.toISOString()),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('educational_centers').select('id', { count: 'exact', head: true }),
        supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('test_attempts').select('id', { count: 'exact', head: true }),
        supabase.from('olympiads').select('id', { count: 'exact', head: true }),
        supabase.from('center_reels').select('id', { count: 'exact', head: true }),
        supabase
          .from('educational_centers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending_approval'),
        supabase
          .from('tests')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending_approval'),
        supabase
          .from('olympiads')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending_approval'),
      ]);

      return {
        usersCount: users.count ?? 0,
        activeUsers7d: activeUsers.count ?? 0,
        coursesCount: courses.count ?? 0,
        testsCount: tests.count ?? 0,
        centersCount: centers.count ?? 0,
        enrollmentsCount: enrollments.count ?? 0,
        attemptsCount: attempts.count ?? 0,
        olympiadsCount: olympiads.count ?? 0,
        reelsCount: reels.count ?? 0,
        pendingCentersCount: pendingCenters.count ?? 0,
        pendingCoursesCount: pendingCourses.count ?? 0,
        pendingTestsCount: pendingTests.count ?? 0,
        pendingOlympiadsCount: pendingOlympiads.count ?? 0,
      };
    },
  });
};

export type AdminRangeAnalytics = {
  from: ISODateString;
  to: ISODateString;
  kpis: {
    users: number;
    centers: number;
    attempts: number;
    enrollments: number;
  };
  timeseries: Array<{
    date: string;
    users: number;
    centers: number;
    attempts: number;
    enrollments: number;
  }>;
};

// Range analytics for dashboard charts (client-side aggregation)
export const useAdminRangeAnalytics = ({ from, to }: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['admin-range-analytics', from.toISOString(), to.toISOString()],
    queryFn: async (): Promise<AdminRangeAnalytics> => {
      const fromISO = startOfDayISO(from);
      const toISO = endOfDayISO(to);

      const [usersRes, centersRes, attemptsRes, enrollmentsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', fromISO)
          .lte('created_at', toISO),
        supabase
          .from('educational_centers')
          .select('created_at')
          .gte('created_at', fromISO)
          .lte('created_at', toISO),
        supabase
          .from('test_attempts')
          .select('started_at')
          .gte('started_at', fromISO)
          .lte('started_at', toISO),
        supabase
          .from('course_enrollments')
          .select('enrolled_at')
          .gte('enrolled_at', fromISO)
          .lte('enrolled_at', toISO),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (centersRes.error) throw centersRes.error;
      if (attemptsRes.error) throw attemptsRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;

      const users = usersRes.data ?? [];
      const centers = centersRes.data ?? [];
      const attempts = attemptsRes.data ?? [];
      const enrollments = enrollmentsRes.data ?? [];

      // build day buckets
      const buckets = new Map<
        string,
        { date: string; users: number; centers: number; attempts: number; enrollments: number }
      >();
      const cursor = new Date(from);
      cursor.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(0, 0, 0, 0);
      while (cursor <= end) {
        const key = yyyyMmDd(cursor);
        buckets.set(key, { date: key, users: 0, centers: 0, attempts: 0, enrollments: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      for (const u of users) {
        const key = yyyyMmDd((u as { created_at: string }).created_at);
        const b = buckets.get(key);
        if (b) b.users += 1;
      }
      for (const c of centers) {
        const key = yyyyMmDd((c as { created_at: string }).created_at);
        const b = buckets.get(key);
        if (b) b.centers += 1;
      }
      for (const a of attempts) {
        const key = yyyyMmDd((a as { started_at: string }).started_at);
        const b = buckets.get(key);
        if (b) b.attempts += 1;
      }
      for (const e of enrollments) {
        const key = yyyyMmDd((e as { enrolled_at: string }).enrolled_at);
        const b = buckets.get(key);
        if (b) b.enrollments += 1;
      }

      const timeseries = Array.from(buckets.values());

      return {
        from: fromISO,
        to: toISO,
        kpis: {
          users: users.length,
          centers: centers.length,
          attempts: attempts.length,
          enrollments: enrollments.length,
        },
        timeseries,
      };
    },
  });
};

// Assign role to user
export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'center' | 'user' }) => {
      // First delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Then insert new role
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
  });
};

// Verify/Unverify center
export const useVerifyCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ centerId, verified }: { centerId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('educational_centers')
        .update({ is_verified: verified })
        .eq('id', centerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
    },
  });
};

// Fetch activity logs
export const useActivityLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['admin-activity-logs', limit],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch profiles for user_ids
      const userIds = [...new Set(logs?.filter(l => l.user_id).map(l => l.user_id) || [])];
      let profilesMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p.display_name || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }

      return logs?.map(log => ({
        ...log,
        user_display_name: log.user_id ? profilesMap[log.user_id] || null : null,
      })) || [];
    },
  });
};

// Fetch all subjects
export const useAllSubjects = () => {
  return useQuery({
    queryKey: ['admin-subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

// Create subject
export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subject: { name: string; name_uz?: string; color?: string; icon?: string }) => {
      const { error } = await supabase.from('subjects').insert(subject);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
    },
  });
};

// Update subject
export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...subject }: { id: string; name?: string; name_uz?: string; color?: string; icon?: string }) => {
      const { error } = await supabase.from('subjects').update(subject).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
    },
  });
};

// Delete subject
export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
    },
  });
};

// Bulk assign role to users
export const useBulkAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: 'admin' | 'center' | 'user' }) => {
      // Delete existing roles for all users
      await supabase.from('user_roles').delete().in('user_id', userIds);

      // Insert new roles for all users
      const { error } = await supabase.from('user_roles').insert(
        userIds.map((userId) => ({ user_id: userId, role }))
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
  });
};

// Bulk delete subjects
export const useBulkDeleteSubjects = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('subjects').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
    },
  });
};

// Bulk verify/unverify centers
export const useBulkVerifyCenters = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ centerIds, verified }: { centerIds: string[]; verified: boolean }) => {
      const { error } = await supabase
        .from('educational_centers')
        .update({ is_verified: verified })
        .in('id', centerIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-centers'] });
    },
  });
};

// Bulk delete courses
export const useBulkDeleteCourses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('courses').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
};

// Bulk delete tests
export const useBulkDeleteTests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('tests').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tests'] });
    },
  });
};
