import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Calendar, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useOlympiadWinners } from "@/hooks/useHomeFeed";

interface PastOlympiadCardProps {
  id: string;
  title: string;
  subject?: {
    name: string;
    color?: string | null;
    icon?: string | null;
  } | null;
  center?: {
    name: string;
    is_verified?: boolean | null;
  } | null;
  endDate: string;
  currentParticipants?: number | null;
}

export const PastOlympiadCard: FC<PastOlympiadCardProps> = ({
  id,
  title,
  subject,
  center,
  endDate,
  currentParticipants,
}) => {
  const navigate = useNavigate();
  const { data: winners, isLoading: winnersLoading } = useOlympiadWinners(id);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-500/20 to-amber-400/10 border-amber-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-300/20 to-gray-200/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-700/20 to-amber-600/10 border-amber-700/30";
      default:
        return "bg-muted/50";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm h-full"
        onClick={() => navigate(`/olympiads/${id}`)}
      >
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-2 mb-1">
                {title}
              </h3>
              {center && (
                <p className="text-sm text-muted-foreground truncate">
                  {center.name}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0 bg-muted text-muted-foreground">
              Completed
            </Badge>
          </div>

          {/* Subject & Stats */}
          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
            {subject && (
              <div className="flex items-center gap-1.5">
                <span>{subject.icon}</span>
                <span>{subject.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(endDate), "MMM d, yyyy")}</span>
            </div>
            {currentParticipants && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{currentParticipants}</span>
              </div>
            )}
          </div>

          {/* Winners Section */}
          <div className="mt-auto pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Top Winners</span>
            </div>

            {winnersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : winners && winners.length > 0 ? (
              <div className="space-y-2">
                {winners.map((winner) => (
                  <div
                    key={winner.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${getRankBg(winner.rank || 0)}`}
                  >
                    <div className="flex items-center justify-center w-6">
                      {getRankIcon(winner.rank || 0)}
                    </div>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={winner.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {winner.profile?.display_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate flex-1">
                      {winner.profile?.display_name || "Anonymous"}
                    </span>
                    {winner.score !== null && (
                      <span className="text-xs text-muted-foreground">
                        {winner.score} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No results available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
