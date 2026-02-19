import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Crown, Award, Target, Flame, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: FC<{ className?: string }>;
  color: string;
  bgColor: string;
  requirement: (stats: PlayerStats) => boolean;
  category: "score" | "streak" | "games" | "difficulty";
}

interface PlayerStats {
  highScore: number;
  totalGames: number;
  bestStreak: number;
  maxDifficulty: number;
  totalScore: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Score milestones
  {
    id: "first_century",
    name: "First Century",
    description: "Score 100 points in a single game",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    requirement: (stats) => stats.highScore >= 100,
    category: "score",
  },
  {
    id: "high_scorer",
    name: "High Scorer",
    description: "Score 250 points in a single game",
    icon: Trophy,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    requirement: (stats) => stats.highScore >= 250,
    category: "score",
  },
  {
    id: "math_master",
    name: "Math Master",
    description: "Score 500 points in a single game",
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    requirement: (stats) => stats.highScore >= 500,
    category: "score",
  },
  {
    id: "legendary",
    name: "Legendary",
    description: "Score 1000 points in a single game",
    icon: Award,
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    requirement: (stats) => stats.highScore >= 1000,
    category: "score",
  },
  // Streak achievements
  {
    id: "hot_streak",
    name: "Hot Streak",
    description: "Get a 5× answer streak",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    requirement: (stats) => stats.bestStreak >= 5,
    category: "streak",
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Get a 10× answer streak",
    icon: Zap,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    requirement: (stats) => stats.bestStreak >= 10,
    category: "streak",
  },
  {
    id: "perfect_run",
    name: "Perfect Run",
    description: "Get a 20× answer streak",
    icon: Medal,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/20",
    requirement: (stats) => stats.bestStreak >= 20,
    category: "streak",
  },
  // Games played
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Play 5 games",
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    requirement: (stats) => stats.totalGames >= 5,
    category: "games",
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Play 25 games",
    icon: Star,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/20",
    requirement: (stats) => stats.totalGames >= 25,
    category: "games",
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Play 100 games",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
    requirement: (stats) => stats.totalGames >= 100,
    category: "games",
  },
  // Difficulty achievements
  {
    id: "challenger",
    name: "Challenger",
    description: "Reach difficulty level 5",
    icon: Target,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    requirement: (stats) => stats.maxDifficulty >= 5,
    category: "difficulty",
  },
  {
    id: "expert",
    name: "Expert",
    description: "Reach difficulty level 8",
    icon: Award,
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
    requirement: (stats) => stats.maxDifficulty >= 8,
    category: "difficulty",
  },
];

interface AchievementBadgesProps {
  showAll?: boolean;
}

export const AchievementBadges: FC<AchievementBadgesProps> = ({ showAll = false }) => {
  const { user } = useAuth();

  const { data: unlockedIds, isLoading } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map((a) => a.achievement_id);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Sign in to track your achievements!
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
            <Award className="w-5 h-5 text-purple-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedSet = new Set(unlockedIds || []);
  const displayAchievements = showAll 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter((a) => unlockedSet.has(a.id));

  const unlockedCount = unlockedIds?.length || 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            Achievements
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {unlockedCount}/{ACHIEVEMENTS.length} unlocked
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {displayAchievements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Play games to unlock achievements!
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {(showAll ? ACHIEVEMENTS : displayAchievements).map((achievement, index) => {
              const isUnlocked = unlockedSet.has(achievement.id);
              const Icon = achievement.icon;
              
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative group cursor-pointer`}
                  title={`${achievement.name}: ${achievement.description}`}
                >
                  <div className={`
                    flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                    ${isUnlocked 
                      ? `${achievement.bgColor} border-current/30` 
                      : "bg-muted/30 border-border/50 opacity-40 grayscale"
                    }
                  `}>
                    <Icon className={`w-6 h-6 ${isUnlocked ? achievement.color : "text-muted-foreground"}`} />
                    <span className="text-[10px] text-center mt-1 text-muted-foreground truncate w-full">
                      {achievement.name}
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-40">
                    <p className="text-xs font-semibold text-foreground">{achievement.name}</p>
                    <p className="text-[10px] text-muted-foreground">{achievement.description}</p>
                    {!isUnlocked && (
                      <p className="text-[10px] text-primary mt-1">Not yet unlocked</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook to check and unlock achievements
export const useCheckAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  const { data: unlockedIds } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map((a) => a.achievement_id);
    },
    enabled: !!user,
  });

  const unlockMutation = useMutation({
    mutationFn: async (achievementIds: string[]) => {
      if (!user) return;
      
      const inserts = achievementIds.map((id) => ({
        user_id: user.id,
        achievement_id: id,
      }));

      const { error } = await supabase
        .from("user_achievements")
        .insert(inserts);

      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
    },
  });

  const checkAndUnlock = async (stats: PlayerStats) => {
    if (!user || !unlockedIds) return;

    const unlockedSet = new Set(unlockedIds);
    const toUnlock: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedSet.has(achievement.id) && achievement.requirement(stats)) {
        toUnlock.push(achievement);
      }
    }

    if (toUnlock.length > 0) {
      setNewlyUnlocked(toUnlock);
      await unlockMutation.mutateAsync(toUnlock.map((a) => a.id));
      
      // Show toast for each new achievement
      for (const achievement of toUnlock) {
        toast({
          title: `🏆 Achievement Unlocked!`,
          description: `${achievement.name}: ${achievement.description}`,
        });
      }
    }
  };

  return { checkAndUnlock, newlyUnlocked, clearNewlyUnlocked: () => setNewlyUnlocked([]) };
};

// Achievement unlock notification component
export const AchievementUnlockNotification: FC<{ achievement: Achievement; onClose: () => void }> = ({ 
  achievement, 
  onClose 
}) => {
  const Icon = achievement.icon;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <div className={`flex items-center gap-4 px-6 py-4 rounded-xl ${achievement.bgColor} border border-current/30 shadow-2xl backdrop-blur-sm`}>
        <div className={`p-3 rounded-full bg-background/50`}>
          <Icon className={`w-8 h-8 ${achievement.color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Achievement Unlocked!</p>
          <p className="font-bold text-foreground">{achievement.name}</p>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
        </div>
      </div>
    </motion.div>
  );
};
