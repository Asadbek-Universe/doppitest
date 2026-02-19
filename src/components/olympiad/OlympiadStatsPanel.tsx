import { FC } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Award, Building2, TrendingUp, Medal, Crown, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TopParticipant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_score: number;
  olympiads_participated: number;
}

interface TopCenter {
  center_id: string;
  name: string;
  logo_url: string | null;
  olympiads_count: number;
  total_participants: number;
}

interface OlympiadStats {
  total_olympiads: number;
  total_participants: number;
  completed_olympiads: number;
  average_participants: number;
}

const useOlympiadStats = () => {
  return useQuery({
    queryKey: ["olympiad-global-stats"],
    queryFn: async () => {
      // Get total olympiads count
      const { count: totalOlympiads } = await supabase
        .from("olympiads")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "published");

      // Get completed olympiads
      const { count: completedOlympiads } = await supabase
        .from("olympiads")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Get total participants
      const { count: totalParticipants } = await supabase
        .from("olympiad_registrations")
        .select("*", { count: "exact", head: true });

      const stats: OlympiadStats = {
        total_olympiads: totalOlympiads || 0,
        total_participants: totalParticipants || 0,
        completed_olympiads: completedOlympiads || 0,
        average_participants: totalOlympiads && totalParticipants 
          ? Math.round(totalParticipants / totalOlympiads) 
          : 0,
      };

      return stats;
    },
  });
};

const useTopParticipants = () => {
  return useQuery({
    queryKey: ["olympiad-top-participants"],
    queryFn: async () => {
      // Get top scoring participants from completed olympiads
      const { data: registrations } = await supabase
        .from("olympiad_registrations")
        .select("user_id, score, rank")
        .not("score", "is", null)
        .order("score", { ascending: false })
        .limit(50);

      if (!registrations?.length) return [];

      // Aggregate by user
      const userScores = new Map<string, { total: number; count: number }>();
      registrations.forEach((r) => {
        const existing = userScores.get(r.user_id) || { total: 0, count: 0 };
        userScores.set(r.user_id, {
          total: existing.total + (r.score || 0),
          count: existing.count + 1,
        });
      });

      // Get top 5 users
      const topUserIds = Array.from(userScores.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5)
        .map(([id]) => id);

      if (!topUserIds.length) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", topUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return topUserIds.map((userId) => {
        const stats = userScores.get(userId)!;
        const profile = profileMap.get(userId);
        return {
          user_id: userId,
          display_name: profile?.display_name || "Anonymous",
          avatar_url: profile?.avatar_url,
          total_score: stats.total,
          olympiads_participated: stats.count,
        } as TopParticipant;
      });
    },
  });
};

const useTopCenters = () => {
  return useQuery({
    queryKey: ["olympiad-top-centers"],
    queryFn: async () => {
      // Get olympiads with participant counts
      const { data: olympiads } = await supabase
        .from("olympiads")
        .select("center_id, current_participants")
        .eq("approval_status", "published")
        .not("center_id", "is", null);

      if (!olympiads?.length) return [];

      // Aggregate by center
      const centerStats = new Map<string, { count: number; participants: number }>();
      olympiads.forEach((o) => {
        if (!o.center_id) return;
        const existing = centerStats.get(o.center_id) || { count: 0, participants: 0 };
        centerStats.set(o.center_id, {
          count: existing.count + 1,
          participants: existing.participants + (o.current_participants || 0),
        });
      });

      // Get top 5 centers
      const topCenterIds = Array.from(centerStats.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id]) => id);

      if (!topCenterIds.length) return [];

      // Get center details
      const { data: centers } = await supabase
        .from("educational_centers")
        .select("id, name, logo_url")
        .in("id", topCenterIds);

      const centerMap = new Map(centers?.map((c) => [c.id, c]) || []);

      return topCenterIds.map((centerId) => {
        const stats = centerStats.get(centerId)!;
        const center = centerMap.get(centerId);
        return {
          center_id: centerId,
          name: center?.name || "Unknown Center",
          logo_url: center?.logo_url,
          olympiads_count: stats.count,
          total_participants: stats.participants,
        } as TopCenter;
      });
    },
  });
};

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Crown className="w-4 h-4 text-amber-500" />;
    case 1:
      return <Medal className="w-4 h-4 text-slate-400" />;
    case 2:
      return <Medal className="w-4 h-4 text-amber-600" />;
    default:
      return <Star className="w-4 h-4 text-muted-foreground" />;
  }
};

export const OlympiadStatsPanel: FC = () => {
  const { data: stats, isLoading: statsLoading } = useOlympiadStats();
  const { data: topParticipants, isLoading: participantsLoading } = useTopParticipants();
  const { data: topCenters, isLoading: centersLoading } = useTopCenters();

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-amber-500/10 via-background to-background border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{stats?.total_olympiads || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Olympiads</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold">{stats?.total_participants || 0}</p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <Award className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{stats?.completed_olympiads || 0}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{stats?.average_participants || 0}</p>
                  <p className="text-xs text-muted-foreground">Avg. Per Event</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Participants Leaderboard */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participantsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topParticipants && topParticipants.length > 0 ? (
              <div className="space-y-3">
                {topParticipants.map((participant, index) => (
                  <motion.div
                    key={participant.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6">
                      {getRankIcon(index)}
                    </div>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={participant.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {participant.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {participant.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.olympiads_participated} olympiad{participant.olympiads_participated !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {participant.total_score} pts
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No rankings yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Centers */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Top Organizers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {centersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topCenters && topCenters.length > 0 ? (
              <div className="space-y-3">
                {topCenters.map((center, index) => (
                  <motion.div
                    key={center.center_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9 rounded-lg">
                      <AvatarImage src={center.logo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs rounded-lg">
                        {center.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{center.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {center.olympiads_count} olympiad{center.olympiads_count !== 1 ? "s" : ""} • {center.total_participants} participants
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No centers yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
