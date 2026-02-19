import { FC } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Target, TrendingUp, Star, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface GameStatsProps {
  gameType?: string;
}

export const GameStats: FC<GameStatsProps> = ({ gameType = "math_challenge" }) => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-game-stats", user?.id, gameType],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("game_type", gameType)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const scores = data.map((d) => d.score);
      const highScore = Math.max(...scores);
      const totalGames = data.length;
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalGames);
      const bestStreak = Math.max(...data.map((d) => d.max_streak));
      const maxDifficulty = Math.max(...data.map((d) => d.difficulty_reached));
      
      // Calculate improvement: compare last 5 games average to previous 5
      let improvement = 0;
      if (data.length >= 2) {
        const recent = data.slice(0, Math.min(5, data.length));
        const older = data.slice(5, Math.min(10, data.length));
        if (older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b.score, 0) / older.length;
          improvement = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
        }
      }

      return {
        highScore,
        totalGames,
        avgScore,
        bestStreak,
        maxDifficulty,
        improvement,
        lastScore: data[0]?.score || 0,
      };
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Sign in to track your personal best and progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Play your first game to start tracking your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    { 
      icon: Trophy, 
      label: "Personal Best", 
      value: stats.highScore.toLocaleString(), 
      color: "text-yellow-500", 
      bgColor: "bg-yellow-500/20" 
    },
    { 
      icon: Target, 
      label: "Average Score", 
      value: stats.avgScore.toLocaleString(), 
      color: "text-primary", 
      bgColor: "bg-primary/20" 
    },
    { 
      icon: Zap, 
      label: "Best Streak", 
      value: `${stats.bestStreak}×`, 
      color: "text-orange-500", 
      bgColor: "bg-orange-500/20" 
    },
    { 
      icon: Flame, 
      label: "Max Difficulty", 
      value: `Lvl ${stats.maxDifficulty}`, 
      color: "text-red-500", 
      bgColor: "bg-red-500/20" 
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Your Stats
          </CardTitle>
          <span className="text-xs text-muted-foreground">{stats.totalGames} games played</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personal Best Highlight */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-xl p-4 text-center border border-yellow-500/30"
        >
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Personal Best</p>
          <p className="text-3xl font-bold text-foreground">{stats.highScore.toLocaleString()}</p>
          {stats.improvement !== 0 && (
            <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${stats.improvement > 0 ? "text-green-500" : "text-red-500"}`}>
              <TrendingUp className={`w-4 h-4 ${stats.improvement < 0 ? "rotate-180" : ""}`} />
              <span>{stats.improvement > 0 ? "+" : ""}{stats.improvement}% vs previous</span>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statItems.slice(1).map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted/30 rounded-lg p-3"
            >
              <div className={`p-2 rounded-lg ${stat.bgColor} w-fit mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
