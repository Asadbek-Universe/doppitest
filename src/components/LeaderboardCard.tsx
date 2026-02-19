import { FC } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardUser {
  rank: number;
  previousRank?: number;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
}

interface LeaderboardCardProps {
  title: string;
  users: LeaderboardUser[];
  currentUserId?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-coin fill-coin" />;
    case 2:
      return <Medal className="w-5 h-5 text-muted-foreground" />;
    case 3:
      return <Medal className="w-5 h-5 text-streak" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankChange = (current: number, previous?: number) => {
  if (!previous) return null;
  const diff = previous - current;
  if (diff > 0) return <TrendingUp className="w-4 h-4 text-xp" />;
  if (diff < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export const LeaderboardCard: FC<LeaderboardCardProps> = ({
  title,
  users,
  currentUserId,
}) => {
  return (
    <Card variant="elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-5 h-5 text-coin" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {users.map((user, index) => (
            <motion.div
              key={user.rank}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                user.rank <= 3
                  ? "bg-gradient-hero"
                  : "hover:bg-muted/50"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Rank */}
              <div className="w-8 h-8 flex items-center justify-center">
                {getRankIcon(user.rank)}
              </div>

              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user.rank === 1
                    ? "bg-gradient-coin"
                    : user.rank === 2
                    ? "bg-muted"
                    : user.rank === 3
                    ? "bg-gradient-accent"
                    : "bg-secondary"
                }`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-sm">
                    {user.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">
                    {user.name}
                  </span>
                  {getRankChange(user.rank, user.previousRank)}
                </div>
                <span className="text-xs text-muted-foreground">
                  Level {user.level}
                </span>
              </div>

              {/* XP */}
              <div className="text-right">
                <span className="font-bold text-sm text-xp">
                  {user.xp.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground ml-1">XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
