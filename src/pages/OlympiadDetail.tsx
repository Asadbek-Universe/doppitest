import { FC } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Award,
  Shield,
  User,
  Medal,
  Crown,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useOlympiadDetails, useOlympiadParticipants } from "@/hooks/useOlympiadDetails";
import { useOlympiadRegistration } from "@/hooks/useOlympiadRegistration";
import { useAuth } from "@/hooks/useAuth";

const OlympiadDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: olympiad, isLoading } = useOlympiadDetails(id || "");
  const { data: participants, isLoading: participantsLoading } = useOlympiadParticipants(id || "");
  const { 
    isRegistered, 
    register, 
    unregister, 
    isRegistering, 
    isUnregistering 
  } = useOlympiadRegistration(id || "");

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-muted text-muted-foreground border-muted",
  };

  const handleRegister = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    register();
  };

  const isFull = olympiad?.max_participants 
    ? (olympiad?.current_participants || 0) >= olympiad.max_participants 
    : false;

  const isDeadlinePassed = olympiad?.registration_deadline 
    ? new Date(olympiad.registration_deadline) < new Date() 
    : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-6 pt-24 pb-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-6 pt-24 pb-12">
          <Card className="bg-card border-border p-12 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Olympiad Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The olympiad you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/olympiads")}>
              Browse Olympiads
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 md:pt-24 pb-8 bg-gradient-hero">
        <div className="container px-6">
          <Button
            variant="ghost"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/olympiads")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Olympiads
          </Button>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {olympiad.subject && (
                  <Badge 
                    className="px-3 py-1"
                    style={{ 
                      backgroundColor: `${olympiad.subject.color}20`,
                      color: olympiad.subject.color,
                      borderColor: `${olympiad.subject.color}40`
                    }}
                  >
                    {olympiad.subject.name}
                  </Badge>
                )}
                <Badge className={statusColors[olympiad.status] || statusColors.upcoming}>
                  {olympiad.status.charAt(0).toUpperCase() + olympiad.status.slice(1)}
                </Badge>
              </div>

              <motion.h1 
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {olympiad.title}
              </motion.h1>

              {olympiad.center && (
                <Link 
                  to={`/centers/${olympiad.center.id}`}
                  className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={olympiad.center.logo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {olympiad.center.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{olympiad.center.name}</span>
                      {olympiad.center.is_verified && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    {olympiad.center.city && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {olympiad.center.city}
                      </span>
                    )}
                  </div>
                </Link>
              )}

              {olympiad.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {olympiad.description}
                </p>
              )}
            </div>

            {/* Registration Card */}
            <Card className="w-full lg:w-96 bg-card border-border sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-foreground">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Event Dates</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(olympiad.start_date), "MMM d, yyyy")} - {format(new Date(olympiad.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  {olympiad.registration_deadline && (
                    <div className="flex items-center gap-3 text-foreground">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Registration Deadline</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(olympiad.registration_deadline), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-foreground">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Participants</p>
                      <p className="text-sm text-muted-foreground">
                        {olympiad.current_participants || 0}
                        {olympiad.max_participants && ` / ${olympiad.max_participants}`} registered
                      </p>
                    </div>
                  </div>

                  {olympiad.prize_description && (
                    <div className="flex items-center gap-3 text-foreground">
                      <Trophy className="w-5 h-5 text-coin" />
                      <div>
                        <p className="font-medium">Prize</p>
                        <p className="text-sm text-coin font-medium">{olympiad.prize_description}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {olympiad.status === "completed" ? (
                  <Button className="w-full" disabled>
                    Olympiad Completed
                  </Button>
                ) : isRegistered ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-500 justify-center">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">You're Registered!</span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => unregister()}
                      disabled={isUnregistering}
                    >
                      {isUnregistering ? "Cancelling..." : "Cancel Registration"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleRegister}
                    disabled={isRegistering || isFull || isDeadlinePassed}
                  >
                    {isRegistering ? "Registering..." : 
                     isFull ? "Registration Full" :
                     isDeadlinePassed ? "Deadline Passed" :
                     "Register Now"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="container px-6 py-8">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="participants">
              Participants ({participants?.length || 0})
            </TabsTrigger>
            {olympiad.status === "completed" && (
              <TabsTrigger value="leaderboard">
                <Trophy className="w-4 h-4 mr-1" />
                Leaderboard
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-primary" />
                    About This Olympiad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {olympiad.description || "No description provided for this olympiad."}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-coin" />
                    Prizes & Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {olympiad.prize_description ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-coin/10 border border-coin/20">
                        <Trophy className="w-8 h-8 text-coin" />
                        <div>
                          <p className="font-semibold text-foreground">Grand Prize</p>
                          <p className="text-coin font-medium">{olympiad.prize_description}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Prize information will be announced soon.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {Math.ceil((new Date(olympiad.end_date).getTime() - new Date(olympiad.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-sm text-muted-foreground">Days Duration</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {olympiad.current_participants || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Registered</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 text-coin mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {olympiad.prize_description ? "Yes" : "TBA"}
                  </p>
                  <p className="text-sm text-muted-foreground">Prizes</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground capitalize">
                    {olympiad.status}
                  </p>
                  <p className="text-sm text-muted-foreground">Status</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rules">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Competition Rules
                </CardTitle>
                <CardDescription>
                  Please read all rules carefully before participating
                </CardDescription>
              </CardHeader>
              <CardContent>
                {olympiad.rules ? (
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <div className="whitespace-pre-wrap">{olympiad.rules}</div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Rules for this olympiad have not been published yet.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back later for updates.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Registered Participants
                </CardTitle>
                <CardDescription>
                  {participants?.length || 0} participants registered for this olympiad
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participantsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : participants && participants.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {participants.map((participant, index) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {participant.profile?.display_name || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {participant.profile?.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {participant.profile.city}
                              </span>
                            )}
                            {participant.rank && (
                              <Badge variant="outline" className="text-xs">
                                Rank #{participant.rank}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {participant.score !== null && (
                          <div className="text-right">
                            <p className="font-bold text-primary">{participant.score}</p>
                            <p className="text-xs text-muted-foreground">pts</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No participants have registered yet.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Be the first to register!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {olympiad.status === "completed" && (
            <TabsContent value="leaderboard">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-coin" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Final rankings and scores for this olympiad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {participantsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (() => {
                    const rankedParticipants = participants
                      ?.filter((p) => p.score !== null && p.rank !== null)
                      .sort((a, b) => (a.rank || 999) - (b.rank || 999)) || [];

                    if (rankedParticipants.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium text-foreground mb-2">
                            Results Not Yet Available
                          </p>
                          <p className="text-muted-foreground">
                            The leaderboard will be updated once all scores are processed.
                          </p>
                        </div>
                      );
                    }

                    const getMedalIcon = (rank: number) => {
                      if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
                      if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
                      if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
                      return null;
                    };

                    const getRankStyle = (rank: number) => {
                      if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30";
                      if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
                      if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30";
                      return "bg-muted/30 border-border";
                    };

                    return (
                      <div className="space-y-3">
                        {/* Top 3 Podium for larger screens */}
                        {rankedParticipants.length >= 3 && (
                          <div className="hidden md:flex justify-center items-end gap-4 mb-8 pb-8 border-b border-border">
                            {/* 2nd Place */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="flex flex-col items-center"
                            >
                              <Avatar className="h-16 w-16 border-4 border-gray-400 shadow-lg mb-2">
                                <AvatarImage src={rankedParticipants[1]?.profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-gray-400/20 text-gray-600 text-xl">
                                  <User className="w-8 h-8" />
                                </AvatarFallback>
                              </Avatar>
                              <Medal className="w-6 h-6 text-gray-400 mb-1" />
                              <p className="font-medium text-foreground text-center truncate max-w-[120px]">
                                {rankedParticipants[1]?.profile?.display_name || "Anonymous"}
                              </p>
                              <p className="text-lg font-bold text-primary">{rankedParticipants[1]?.score} pts</p>
                              <div className="h-20 w-24 bg-gray-400/20 rounded-t-lg mt-2 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-400">2</span>
                              </div>
                            </motion.div>

                            {/* 1st Place */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center"
                            >
                              <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-xl mb-2">
                                <AvatarImage src={rankedParticipants[0]?.profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-yellow-500/20 text-yellow-600 text-2xl">
                                  <User className="w-10 h-10" />
                                </AvatarFallback>
                              </Avatar>
                              <Crown className="w-8 h-8 text-yellow-500 mb-1" />
                              <p className="font-bold text-foreground text-center truncate max-w-[120px]">
                                {rankedParticipants[0]?.profile?.display_name || "Anonymous"}
                              </p>
                              <p className="text-xl font-bold text-primary">{rankedParticipants[0]?.score} pts</p>
                              <div className="h-28 w-28 bg-yellow-500/20 rounded-t-lg mt-2 flex items-center justify-center">
                                <span className="text-3xl font-bold text-yellow-500">1</span>
                              </div>
                            </motion.div>

                            {/* 3rd Place */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex flex-col items-center"
                            >
                              <Avatar className="h-14 w-14 border-4 border-amber-600 shadow-lg mb-2">
                                <AvatarImage src={rankedParticipants[2]?.profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-amber-600/20 text-amber-700 text-lg">
                                  <User className="w-7 h-7" />
                                </AvatarFallback>
                              </Avatar>
                              <Medal className="w-6 h-6 text-amber-600 mb-1" />
                              <p className="font-medium text-foreground text-center truncate max-w-[120px]">
                                {rankedParticipants[2]?.profile?.display_name || "Anonymous"}
                              </p>
                              <p className="text-lg font-bold text-primary">{rankedParticipants[2]?.score} pts</p>
                              <div className="h-16 w-24 bg-amber-600/20 rounded-t-lg mt-2 flex items-center justify-center">
                                <span className="text-2xl font-bold text-amber-600">3</span>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* Full Leaderboard List */}
                        <div className="space-y-2">
                          {rankedParticipants.map((participant, index) => (
                            <motion.div
                              key={participant.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`flex items-center gap-4 p-4 rounded-lg border ${getRankStyle(participant.rank || 999)}`}
                            >
                              {/* Rank */}
                              <div className="flex items-center justify-center w-10 h-10">
                                {getMedalIcon(participant.rank || 999) || (
                                  <span className="text-lg font-bold text-muted-foreground">
                                    {participant.rank}
                                  </span>
                                )}
                              </div>

                              {/* Avatar */}
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={participant.profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <User className="w-6 h-6" />
                                </AvatarFallback>
                              </Avatar>

                              {/* Name and City */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {participant.profile?.display_name || "Anonymous"}
                                </p>
                                {participant.profile?.city && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {participant.profile.city}
                                  </p>
                                )}
                              </div>

                              {/* Score */}
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary">{participant.score}</p>
                                <p className="text-xs text-muted-foreground">points</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </section>
    </div>
  );
};

export default OlympiadDetail;
