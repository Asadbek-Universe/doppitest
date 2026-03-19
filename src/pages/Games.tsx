import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Trophy, 
  Coins, 
  Gamepad2, 
  Flame, 
  Star, 
  Zap, 
  Clock, 
  Play,
  ChevronRight,
  Sparkles,
  Target,
  Brain,
  Calculator,
  Eye,
  Lock
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MathGame } from "@/components/MathGame";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { GameStats } from "@/components/GameStats";
import { AchievementBadges } from "@/components/AchievementBadges";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useToast } from "@/hooks/use-toast";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { PreviewModeBanner } from "@/components/PreviewModeBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { useLocation, useNavigate } from "react-router-dom";

const progressStatKeys = [
  { key: "streak" as const, icon: Flame, label: "Day Streak", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { key: "level" as const, icon: Star, label: "Current Level", color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
  { key: "coins" as const, icon: Coins, label: "Total Coins", color: "text-emerald-500", bgColor: "bg-emerald-500/20" },
  { key: "games" as const, icon: Trophy, label: "Games Won", color: "text-purple-500", bgColor: "bg-purple-500/20" },
];

const featuredGame = {
  title: "Math Speed Challenge",
  description: "Race against time! Solve arithmetic problems as fast as you can. Earn bonus points for streaks and accuracy.",
  players: "12.5K",
  difficulty: "Medium",
  reward: 150,
  duration: "5 min",
  image: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(280 70% 50%) 50%, hsl(320 80% 60%) 100%)"
};

const games = [
  {
    id: 3,
    title: "Number Crunch",
    description: "Advanced math calculations",
    icon: Calculator,
    color: "from-cyan-500 to-blue-500",
    players: "3.8K",
    reward: 150,
    available: true,
  },
  {
    id: 5,
    title: "Tic-Tac-Toe (X/O)",
    description: "Classic X/O game against a simple AI",
    icon: Gamepad2,
    color: "from-emerald-500 to-teal-500",
    players: "2.1K",
    reward: 50,
    available: true,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Games: FC = () => {
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isTicTacToeOpen, setIsTicTacToeOpen] = useState(false);
  const { toast } = useToast();
  const { isPreviewMode, canInteract } = usePreviewMode();
  const { data: progress, isLoading: progressLoading, isError: progressError } = useUserProgress();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.endsWith("/tic-tac-toe")) {
      setIsTicTacToeOpen(true);
    }
  }, [location.pathname]);

  const handlePlayGame = (gameId?: number) => {
    if (!canInteract) {
      toast({
        title: "Preview Mode",
        description: "You cannot play games in preview mode. This feature is for students only.",
        variant: "destructive",
      });
      return;
    }
    
    if (gameId === 3 || gameId === undefined) {
      setIsGameOpen(true);
      if (location.pathname.endsWith("/tic-tac-toe")) {
        navigate("/games", { replace: true });
      }
    } else if (gameId === 5) {
      setIsTicTacToeOpen(true);
      if (!location.pathname.endsWith("/tic-tac-toe")) {
        navigate("/games/tic-tac-toe", { replace: true });
      }
    } else {
      toast({
        title: "Coming Soon!",
        description: "This game is not available yet. Try Math Speed Challenge!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navbar />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="container px-4 md:px-6 pt-20">
          <PreviewModeBanner className="mb-4" />
        </div>
      )}

      {/* Hero Section - Featured Game */}
      <section className={isPreviewMode ? "pt-4 md:pt-6 relative" : "pt-24 md:pt-28 relative"}>
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden"
            style={{ background: featuredGame.image }}
          >
            {/* Animated Grid Overlay */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            
            {/* Glowing orb effect */}
            <motion.div
              className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            <div className="relative p-8 md:p-12 lg:p-16">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-4">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Featured Game
                  </Badge>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight"
                >
                  {featuredGame.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/80 text-lg md:text-xl mb-8 leading-relaxed"
                >
                  {featuredGame.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-4 md:gap-6 text-white/90 text-sm mb-8"
                >
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Users className="w-4 h-4" />
                    <span>{featuredGame.players} playing</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Trophy className="w-4 h-4" />
                    <span>{featuredGame.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span>{featuredGame.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-yellow-500/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Coins className="w-4 h-4 text-yellow-300" />
                    <span className="text-yellow-300 font-semibold">+{featuredGame.reward} coins</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button 
                    size="lg" 
                    className={`font-semibold px-8 shadow-lg shadow-black/20 ${!canInteract ? 'bg-white/50 text-muted-foreground' : 'bg-white text-primary hover:bg-white/90'}`}
                    onClick={() => handlePlayGame()}
                    disabled={!canInteract}
                  >
                    {!canInteract ? (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Preview Only
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        Play Now
                      </>
                    )}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    How to Play
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats and Leaderboard Section */}
      <section className="container px-4 md:px-6 py-12 md:py-16 relative">
        {progressError && (
          <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
            Progress data could not be loaded. You can still play games and view leaderboard.
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Your Progress</h2>
                <p className="text-muted-foreground mt-1">Track your gaming achievements</p>
              </div>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View All Stats
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 md:gap-6"
            >
              {(progressLoading
                ? progressStatKeys.map(({ key, icon: Icon, label, color, bgColor }) => (
                    <motion.div key={key} variants={itemVariants}>
                      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                        <CardContent className="p-5 md:p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${bgColor}`}>
                              <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color}`} />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-16 mb-1" />
                          <div className="text-sm text-muted-foreground mb-4">{label}</div>
                          <Skeleton className="h-1.5 w-full" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                : progressStatKeys.map(({ key, icon: Icon, label, color, bgColor }) => {
                    const stat = progress ?? undefined;
                    const value =
                      key === "streak"
                        ? String(stat?.dayStreak ?? 0)
                        : key === "level"
                          ? String(stat?.level ?? 1)
                          : key === "coins"
                            ? (stat?.totalCoins ?? 0).toLocaleString()
                            : String(stat?.gamesWon ?? 0);
                    const progressPct =
                      key === "streak"
                        ? stat?.streakProgress ?? 0
                        : key === "level"
                          ? stat?.levelProgress ?? 0
                          : key === "coins"
                            ? stat?.coinsProgress ?? 0
                            : stat?.gamesProgress ?? 0;
                    return (
                      <motion.div
                        key={key}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden group">
                          <CardContent className="p-5 md:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color}`} />
                              </div>
                            </div>
                            <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{value}</div>
                            <div className="text-sm text-muted-foreground mb-4">{label}</div>
                            <Progress value={progressPct} className="h-1.5" />
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
              )}
            </motion.div>
          </div>

          {/* User Stats, Achievements & Leaderboard */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <GameStats gameType="math_challenge" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <AchievementBadges showAll />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <GameLeaderboard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Available Games Grid */}
      <section className="container px-4 md:px-6 pb-16 md:pb-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">All Games</h2>
            <p className="text-muted-foreground mt-1">Choose your challenge</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {games.length} games
          </Badge>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {games.map((game) => (
            <motion.div
              key={game.id}
              variants={itemVariants}
              onHoverStart={() => setHoveredGame(game.id)}
              onHoverEnd={() => setHoveredGame(null)}
              onClick={() => handlePlayGame(game.id)}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden group h-full">
                <CardContent className="p-0">
                  {/* Gradient Header */}
                  <div className={`h-32 bg-gradient-to-br ${game.color} relative overflow-hidden`}>
                    <motion.div
                      className="absolute inset-0 bg-black/20"
                      animate={{ opacity: hoveredGame === game.id ? 0 : 0.2 }}
                    />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ 
                        scale: hoveredGame === game.id ? 1.1 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <game.icon className="w-12 h-12 text-white drop-shadow-lg" />
                    </motion.div>
                    
                    {/* Play button on hover */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredGame === game.id ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: hoveredGame === game.id ? 1 : 0.8 }}
                        className="bg-white rounded-full p-3 shadow-lg"
                      >
                        <Play className="w-6 h-6 text-primary fill-primary" />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {game.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{game.players}</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 font-semibold text-sm">
                        <Coins className="w-4 h-4" />
                        <span>+{game.reward}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
      {/* Math Game Modal */}
      <MathGame isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />
      <TicTacToeGame
        isOpen={isTicTacToeOpen}
        onClose={() => {
          setIsTicTacToeOpen(false);
          if (location.pathname.endsWith("/tic-tac-toe")) {
            navigate("/games", { replace: true });
          }
        }}
      />
    </div>
  );
};

export default Games;
