import { FC } from "react";
import { motion } from "framer-motion";
import { Flame, Coins, Zap, Star } from "lucide-react";

interface UserStatsProps {
  xp: number;
  maxXp: number;
  level: number;
  coins: number;
  streak: number;
}

export const UserStats: FC<UserStatsProps> = ({
  xp,
  maxXp,
  level,
  coins,
  streak,
}) => {
  const xpPercentage = (xp / maxXp) * 100;

  return (
    <div className="flex items-center gap-4">
      {/* Streak */}
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-streak/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Flame className="w-4 h-4 text-streak" />
        <span className="text-sm font-bold text-streak">{streak}</span>
      </motion.div>

      {/* Coins */}
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coin/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Coins className="w-4 h-4 text-coin" />
        <span className="text-sm font-bold text-coin">{coins.toLocaleString()}</span>
      </motion.div>

      {/* XP Bar */}
      <motion.div
        className="hidden sm:flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary">
          <Star className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Level {level}
            </span>
            <span className="text-xs text-muted-foreground">
              {xp}/{maxXp} XP
            </span>
          </div>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-xp rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
