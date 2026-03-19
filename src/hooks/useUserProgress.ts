import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserProgressStats {
  /** Consecutive days with activity (test attempt or game score) */
  dayStreak: number;
  /** Level derived from total activity (tests + courses + olympiads + games) */
  level: number;
  /** Total points from game_scores (used as "coins" or XP) */
  totalCoins: number;
  /** Number of math_challenge games played (games "won" = completed) */
  gamesWon: number;
  /** Enrolled courses count */
  coursesEnrolled: number;
  /** Completed test attempts */
  testsCompleted: number;
  /** Olympiad registrations */
  olympiadsParticipated: number;
  /** Unlocked achievements count */
  achievementsCount: number;
  /** Progress 0–100 for streak (streak/7 cap) */
  streakProgress: number;
  /** Progress 0–100 for level (level/20 cap) */
  levelProgress: number;
  /** Progress 0–100 for coins (coins/5000 cap) */
  coinsProgress: number;
  /** Progress 0–100 for games (games/50 cap) */
  gamesProgress: number;
}

const LEVEL_XP_PER_LEVEL = 5;
const MAX_LEVEL = 50;
const MAX_STREAK_FOR_PROGRESS = 7;
const MAX_COINS_FOR_PROGRESS = 5000;
const MAX_GAMES_FOR_PROGRESS = 50;

export function useUserProgress(): {
  data: UserProgressStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async (): Promise<UserProgressStats> => {
      if (!user?.id) {
        return getEmptyProgress();
      }

      const [
        enrollmentsRes,
        attemptsRes,
        olympiadsRes,
        achievementsRes,
        gameScoresRes,
        profileRes,
      ] = await Promise.all([
        supabase
          .from("course_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("test_attempts")
          .select("id, completed_at", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "completed"),
        supabase
          .from("olympiad_registrations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("user_achievements")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("game_scores")
          .select("score, created_at")
          .eq("user_id", user.id)
          .in("game_type", ["math_challenge", "tic_tac_toe"]),
        supabase
          .from("profiles")
          .select("last_activity_at")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const coursesEnrolled = enrollmentsRes.count ?? 0;
      const testsCompleted = attemptsRes.count ?? 0;
      const olympiadsParticipated = olympiadsRes.count ?? 0;
      const achievementsCount = achievementsRes.count ?? 0;

      const gameScores = gameScoresRes.data ?? [];
      const gamesWon = gameScores.length;
      const totalCoins = gameScores.reduce((sum, g) => sum + (g.score ?? 0), 0);

      // Level: 1 + floor(totalActivity / LEVEL_XP_PER_LEVEL), cap MAX_LEVEL
      const totalActivity =
        testsCompleted + coursesEnrolled + olympiadsParticipated + gamesWon;
      const level = Math.min(
        MAX_LEVEL,
        Math.max(1, 1 + Math.floor(totalActivity / LEVEL_XP_PER_LEVEL))
      );

      // Streak: consecutive days with activity
      const dayStreak = computeDayStreak(
        attemptsRes.data ?? [],
        gameScores,
        profileRes.data?.last_activity_at
      );

      return {
        dayStreak,
        level,
        totalCoins,
        gamesWon,
        coursesEnrolled,
        testsCompleted,
        olympiadsParticipated,
        achievementsCount,
        streakProgress: Math.min(100, (dayStreak / MAX_STREAK_FOR_PROGRESS) * 100),
        levelProgress: Math.min(100, (level / MAX_LEVEL) * 100),
        coinsProgress: Math.min(100, (totalCoins / MAX_COINS_FOR_PROGRESS) * 100),
        gamesProgress: Math.min(100, (gamesWon / MAX_GAMES_FOR_PROGRESS) * 100),
      };
    },
    enabled: !!user?.id,
    retry: false,
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

function getEmptyProgress(): UserProgressStats {
  return {
    dayStreak: 0,
    level: 1,
    totalCoins: 0,
    gamesWon: 0,
    coursesEnrolled: 0,
    testsCompleted: 0,
    olympiadsParticipated: 0,
    achievementsCount: 0,
    streakProgress: 0,
    levelProgress: 0,
    coinsProgress: 0,
    gamesProgress: 0,
  };
}

/** Returns number of consecutive days (including today) with at least one activity. */
function computeDayStreak(
  attempts: { completed_at?: string | null }[],
  gameScores: { created_at?: string | null }[],
  lastActivityAt: string | null | undefined
): number {
  const dateToYmd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const activityDates = new Set<string>();

  attempts.forEach((a) => {
    if (a.completed_at) activityDates.add(dateToYmd(new Date(a.completed_at)));
  });
  gameScores.forEach((g) => {
    if (g.created_at) activityDates.add(dateToYmd(new Date(g.created_at)));
  });
  if (lastActivityAt) activityDates.add(dateToYmd(new Date(lastActivityAt)));

  const sorted = Array.from(activityDates).sort();
  if (sorted.length === 0) return 0;

  const today = dateToYmd(new Date());
  let streak = 0;
  let check = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = dateToYmd(check);
    if (activityDates.has(key)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
