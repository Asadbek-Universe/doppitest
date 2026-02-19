import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AggregationPeriod = 'daily' | 'weekly' | 'monthly';
export type GroupBy = 'none' | 'subject' | 'center';

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

const getWeekKey = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
  return d.toISOString().split('T')[0];
};

const getMonthKey = (date: Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getDayKey = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const useAdvancedAnalytics = ({
  from,
  to,
  aggregation,
  groupBy,
}: {
  from: Date;
  to: Date;
  aggregation: AggregationPeriod;
  groupBy: GroupBy;
}) => {
  return useQuery({
    queryKey: ['advanced-analytics', from.toISOString(), to.toISOString(), aggregation, groupBy],
    queryFn: async () => {
      const fromISO = startOfDayISO(from);
      const toISO = endOfDayISO(to);

      // Fetch raw data
      const [attemptsRes, enrollmentsRes, subjectsRes, centersRes] = await Promise.all([
        supabase
          .from('test_attempts')
          .select('started_at, status, test_id, tests(subject_id, center_id)')
          .gte('started_at', fromISO)
          .lte('started_at', toISO),
        supabase
          .from('course_enrollments')
          .select('enrolled_at, completed_at, course_id, courses(subject_id, center_id)')
          .gte('enrolled_at', fromISO)
          .lte('enrolled_at', toISO),
        supabase.from('subjects').select('id, name'),
        supabase.from('educational_centers').select('id, name'),
      ]);

      if (attemptsRes.error) throw attemptsRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (centersRes.error) throw centersRes.error;

      const attempts = attemptsRes.data ?? [];
      const enrollments = enrollmentsRes.data ?? [];
      const subjects = subjectsRes.data ?? [];
      const centers = centersRes.data ?? [];

      const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
      const centerMap = new Map(centers.map((c) => [c.id, c.name]));

      // Aggregate function
      const getKey = (dateStr: string) => {
        const d = new Date(dateStr);
        switch (aggregation) {
          case 'weekly':
            return getWeekKey(d);
          case 'monthly':
            return getMonthKey(d);
          default:
            return getDayKey(d);
        }
      };

      const getGroupKey = (item: { subject_id?: string | null; center_id?: string | null }) => {
        if (groupBy === 'subject' && item.subject_id) {
          return subjectMap.get(item.subject_id) || 'Unknown';
        }
        if (groupBy === 'center' && item.center_id) {
          return centerMap.get(item.center_id) || 'Unknown';
        }
        return 'All';
      };

      // Build timeseries
      type TimeseriesPoint = {
        period: string;
        group: string;
        attempts: number;
        completedAttempts: number;
        enrollments: number;
        completedEnrollments: number;
      };

      const buckets = new Map<string, TimeseriesPoint>();

      for (const attempt of attempts) {
        const periodKey = getKey(attempt.started_at);
        const groupKey = getGroupKey({
          subject_id: attempt.tests?.subject_id,
          center_id: attempt.tests?.center_id,
        });
        const key = `${periodKey}|${groupKey}`;

        if (!buckets.has(key)) {
          buckets.set(key, {
            period: periodKey,
            group: groupKey,
            attempts: 0,
            completedAttempts: 0,
            enrollments: 0,
            completedEnrollments: 0,
          });
        }
        const b = buckets.get(key)!;
        b.attempts += 1;
        if (attempt.status === 'completed') b.completedAttempts += 1;
      }

      for (const enrollment of enrollments) {
        const periodKey = getKey(enrollment.enrolled_at);
        const groupKey = getGroupKey({
          subject_id: enrollment.courses?.subject_id,
          center_id: enrollment.courses?.center_id,
        });
        const key = `${periodKey}|${groupKey}`;

        if (!buckets.has(key)) {
          buckets.set(key, {
            period: periodKey,
            group: groupKey,
            attempts: 0,
            completedAttempts: 0,
            enrollments: 0,
            completedEnrollments: 0,
          });
        }
        const b = buckets.get(key)!;
        b.enrollments += 1;
        if (enrollment.completed_at) b.completedEnrollments += 1;
      }

      const timeseries = Array.from(buckets.values()).sort((a, b) =>
        a.period.localeCompare(b.period)
      );

      // Get unique groups for legend
      const groups = [...new Set(timeseries.map((t) => t.group))];

      return {
        timeseries,
        groups,
        subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
        centers: centers.map((c) => ({ id: c.id, name: c.name })),
      };
    },
  });
};

export const useHealthMetrics = ({ from, to }: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['health-metrics', from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const fromISO = startOfDayISO(from);
      const toISO = endOfDayISO(to);

      // Get users who were active (took test or enrolled) in the first half of the period
      // and check if they returned in the second half
      const midpoint = new Date((from.getTime() + to.getTime()) / 2);
      const midISO = startOfDayISO(midpoint);

      const [
        totalUsersRes,
        activeUsersFirstHalfRes,
        activeUsersSecondHalfRes,
        testAttemptsRes,
        completedAttemptsRes,
        enrollmentsRes,
        completedEnrollmentsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase
          .from('test_attempts')
          .select('user_id')
          .gte('started_at', fromISO)
          .lt('started_at', midISO),
        supabase
          .from('test_attempts')
          .select('user_id')
          .gte('started_at', midISO)
          .lte('started_at', toISO),
        supabase
          .from('test_attempts')
          .select('id', { count: 'exact', head: true })
          .gte('started_at', fromISO)
          .lte('started_at', toISO),
        supabase
          .from('test_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('started_at', fromISO)
          .lte('started_at', toISO),
        supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .gte('enrolled_at', fromISO)
          .lte('enrolled_at', toISO),
        supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .not('completed_at', 'is', null)
          .gte('enrolled_at', fromISO)
          .lte('enrolled_at', toISO),
      ]);

      const firstHalfUsers = new Set(
        (activeUsersFirstHalfRes.data ?? []).map((r) => r.user_id)
      );
      const secondHalfUsers = new Set(
        (activeUsersSecondHalfRes.data ?? []).map((r) => r.user_id)
      );

      // Retention: users from first half who returned in second half
      let retained = 0;
      firstHalfUsers.forEach((uid) => {
        if (secondHalfUsers.has(uid)) retained++;
      });

      const retentionRate = firstHalfUsers.size > 0 ? (retained / firstHalfUsers.size) * 100 : 0;

      const totalAttempts = testAttemptsRes.count ?? 0;
      const completedAttempts = completedAttemptsRes.count ?? 0;
      const testCompletionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;

      const totalEnrollments = enrollmentsRes.count ?? 0;
      const completedEnrollments = completedEnrollmentsRes.count ?? 0;
      const courseCompletionRate =
        totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

      return {
        totalUsers: totalUsersRes.count ?? 0,
        activeUsersInPeriod: new Set([...firstHalfUsers, ...secondHalfUsers]).size,
        retentionRate: Math.round(retentionRate * 10) / 10,
        testCompletionRate: Math.round(testCompletionRate * 10) / 10,
        courseCompletionRate: Math.round(courseCompletionRate * 10) / 10,
        totalAttempts,
        completedAttempts,
        totalEnrollments,
        completedEnrollments,
      };
    },
  });
};
