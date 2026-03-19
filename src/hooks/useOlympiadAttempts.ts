import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OlympiadAttemptRow {
  id: string;
  olympiad_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  total_points: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  status: string;
}

export function useOlympiadAttempts(olympiadId: string | null) {
  return useQuery({
    queryKey: ['olympiad-attempts', olympiadId],
    queryFn: async (): Promise<OlympiadAttemptRow[]> => {
      if (!olympiadId) return [];
      const { data, error } = await supabase
        .from('olympiad_attempts')
        .select('*')
        .eq('olympiad_id', olympiadId)
        .order('score', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as OlympiadAttemptRow[];
    },
    enabled: !!olympiadId,
  });
}

export function useOlympiadLeaderboard(olympiadId: string | null) {
  const { data: attempts, ...rest } = useOlympiadAttempts(olympiadId);
  return {
    data: attempts?.filter((a) => a.status === 'completed' && a.score != null) ?? [],
    ...rest,
  };
}

export function useOlympiadStats(olympiadId: string | null) {
  return useQuery({
    queryKey: ['olympiad-stats', olympiadId],
    queryFn: async () => {
      if (!olympiadId) return null;
      const [regs, attempts] = await Promise.all([
        supabase.from('olympiad_registrations').select('id, score, status').eq('olympiad_id', olympiadId),
        supabase.from('olympiad_attempts').select('id, status, score, time_spent_seconds').eq('olympiad_id', olympiadId),
      ]);
      if (regs.error) throw regs.error;
      if (attempts.error) throw attempts.error;
      const registrations = regs.data ?? [];
      const attemptList = (attempts.data ?? []) as { id: string; status: string; score: number | null; time_spent_seconds: number | null }[];
      const started = attemptList.length;
      const completed = attemptList.filter((a) => a.status === 'completed').length;
      const scores = attemptList.filter((a) => a.status === 'completed' && a.score != null).map((a) => Number(a.score));
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const maxScore = scores.length ? Math.max(...scores) : 0;
      return {
        totalRegistrations: registrations.length,
        started,
        completed,
        averageScore: Math.round(avgScore * 100) / 100,
        highestScore: maxScore,
      };
    },
    enabled: !!olympiadId,
  });
}
