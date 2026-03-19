import { FC } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Trophy,
  Clock,
  Target,
  Flame,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useProfileLearningStats } from "@/hooks/useProfileLearningStats";
import { Skeleton } from "@/components/ui/skeleton";

const statCards: {
  key: string;
  icon: FC<{ className?: string }>;
  label: string;
  getValue: (p: ReturnType<typeof useUserProgress>["data"], s: ReturnType<typeof useProfileLearningStats>["data"]) => string;
  getProgress?: (p: ReturnType<typeof useUserProgress>["data"], s: ReturnType<typeof useProfileLearningStats>["data"]) => number;
  color: string;
  bgColor: string;
}[] = [
  {
    key: "coursesEnrolled",
    icon: BookOpen,
    label: "Courses enrolled",
    getValue: (p) => String(p?.coursesEnrolled ?? 0),
    getProgress: (p) => Math.min(100, ((p?.coursesEnrolled ?? 0) / 10) * 100),
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "coursesCompleted",
    icon: CheckCircle2,
    label: "Courses completed",
    getValue: (_p, s) => String(s?.coursesCompleted ?? 0),
    getProgress: (p, s) => {
      const enrolled = p?.coursesEnrolled ?? 0;
      const completed = s?.coursesCompleted ?? 0;
      return enrolled > 0 ? Math.min(100, (completed / enrolled) * 100) : 0;
    },
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    key: "testsTaken",
    icon: FileText,
    label: "Tests taken",
    getValue: (p) => String(p?.testsCompleted ?? 0),
    getProgress: (p) => Math.min(100, ((p?.testsCompleted ?? 0) / 20) * 100),
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    key: "olympiads",
    icon: Trophy,
    label: "Olympiads participated",
    getValue: (p) => String(p?.olympiadsParticipated ?? 0),
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    key: "avgScore",
    icon: TrendingUp,
    label: "Average test score",
    getValue: (_p, s) => (s ? `${s.averageTestScore}%` : "0%"),
    getProgress: (_p, s) => s?.averageTestScore ?? 0,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "bestScore",
    icon: Target,
    label: "Best score",
    getValue: (_p, s) => (s ? `${s.bestTestScore}%` : "0%"),
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    key: "studyTime",
    icon: Clock,
    label: "Total study time",
    getValue: (_p, s) => {
      if (!s?.totalStudyTimeMinutes) return "0 min";
      if (s.totalStudyTimeMinutes >= 60) return `${Math.floor(s.totalStudyTimeMinutes / 60)}h ${s.totalStudyTimeMinutes % 60}m`;
      return `${s.totalStudyTimeMinutes} min`;
    },
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    key: "streak",
    icon: Flame,
    label: "Current streak",
    getValue: (p) => `${p?.dayStreak ?? 0} days`,
    getProgress: (p) => Math.min(100, ((p?.dayStreak ?? 0) / 7) * 100),
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export const ProfileStatsOverview: FC = () => {
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { data: learningStats, isLoading: statsLoading } = useProfileLearningStats();
  const isLoading = progressLoading || statsLoading;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((item, index) => {
        const Icon = item.icon;
        const value = item.getValue(progress, learningStats);
        const progressPct = item.getProgress?.(progress, learningStats) ?? 0;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full border-border bg-card/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                )}
                <p className="text-xs text-muted-foreground mb-2">{item.label}</p>
                {item.getProgress != null && (
                  <Progress value={isLoading ? 0 : progressPct} className="h-1.5" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
