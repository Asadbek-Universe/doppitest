import { FC } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  questions_answered: number;
  max_streak: number;
  created_at: string;
  display_name?: string;
}

export const GameLeaderboard: FC = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["game-leaderboard"],
    queryFn: async () => {
      // Get top scores
      const { data: scores, error } = await supabase
        .from("game_scores")
        .select("id, user_id, score, questions_answered, max_streak, created_at")
        .eq("game_type", "math_challenge")
        .order("score", { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!scores || scores.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(scores.map(s => s.user_id))];
      
      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      // Merge profiles with scores
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      
      return scores.map(score => ({
        ...score,
        display_name: profileMap.get(score.user_id) || "Anonymous"
      })) as LeaderboardEntry[];
    },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-300/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="w-5 h-5 text-primary" />
          Top Players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="w-16 h-4" />
            </div>
          ))
        ) : leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(index + 1)}`}
            >
              <div className="w-8 flex items-center justify-center">
                {getRankIcon(index + 1)}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {entry.display_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.display_name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.questions_answered} questions · {entry.max_streak}× streak
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{entry.score}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No scores yet. Be the first!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
