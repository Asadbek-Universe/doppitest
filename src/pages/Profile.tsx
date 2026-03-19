import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Trophy,
  ChevronRight,
  LogIn,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, useOwnsCenter } from "@/hooks/useUserRole";
import { useUserOlympiadRegistrations } from "@/hooks/useOlympiadRegistration";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStatsOverview } from "@/components/profile/ProfileStatsOverview";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { ProfileTestHistoryTab } from "@/components/profile/ProfileTestHistoryTab";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { DangerZone } from "@/components/profile/DangerZone";
import { SavedItemsTab } from "@/components/profile/SavedItemsTab";

import { StudentDashboard } from "@/components/StudentDashboard";
import { CertificatesSection } from "@/components/CertificatesSection";
import { TestAnalytics } from "@/components/TestAnalytics";
import { ProgressGoals } from "@/components/ProgressGoals";
import { AchievementBadges } from "@/components/AchievementBadges";
import { BookmarkedQuestionsTab } from "@/components/BookmarkedQuestionsTab";

interface TestAttemptForAnalytics {
  id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total_points: number | null;
  correct_answers: number | null;
  wrong_answers: number | null;
  skipped_answers: number | null;
  status: string;
  tests: {
    title: string;
    difficulty: number;
    is_official: boolean | null;
  } | null;
}

const VALID_TABS = ["overview", "courses", "test-history", "olympiads", "saved", "achievements", "bookmarks", "goals", "settings"];

const Profile: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const { data: ownsCenter } = useOwnsCenter();
  const { data: olympiadRegistrations, isLoading: registrationsLoading } =
    useUserOlympiadRegistrations();
  const [activeTab, setActiveTab] = useState(() =>
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "overview"
  );
  const isCenter = role === "center" || ownsCenter === true;

  // Sync tab from URL (e.g. /profile?tab=settings)
  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const { data: attemptsForAnalytics = [] } = useQuery({
    queryKey: ["profile-analytics-attempts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("test_attempts")
        .select(
          `
          id,
          started_at,
          completed_at,
          score,
          total_points,
          correct_answers,
          wrong_answers,
          skipped_answers,
          status,
          tests (
            title,
            difficulty,
            is_official
          )
        `
        )
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TestAttemptForAnalytics[];
    },
    enabled: !!user,
  });

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses?course=${courseId}`);
  };

  const hasAnyActivity =
    (attemptsForAnalytics && attemptsForAnalytics.length > 0) ||
    (olympiadRegistrations && olympiadRegistrations.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <ProfileHeader />

      {isCenter && (
        <section className="container px-4 md:px-6 pt-2 pb-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                This is your <strong className="text-foreground">personal profile</strong>. To manage your center (courses, olympiads, analytics), go to{" "}
                <Link to="/center-panel" className="font-medium text-primary hover:underline">
                  Center Panel
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="container px-4 md:px-6 pb-8">
        <ProfileStatsOverview />
      </section>

      <section className="container px-4 md:px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full -mx-2">
            <TabsList className="bg-muted/50 p-1 inline-flex min-w-0 w-full justify-start h-auto flex-wrap gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="test-history">Test History</TabsTrigger>
              <TabsTrigger value="olympiads">Olympiads</TabsTrigger>
              <TabsTrigger value="saved">Saved Content</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="overview" className="mt-6 space-y-8">
            {!user ? (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <LogIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sign in to view your learning dashboard
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Track courses, progress, and certificates
                  </p>
                  <Link to="/auth">
                    <Button className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : !hasAnyActivity && attemptsForAnalytics.length === 0 ? (
              <ProfileEmptyState type="overview" />
            ) : (
              <>
                {attemptsForAnalytics.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Analytics
                    </h2>
                    <TestAnalytics attempts={attemptsForAnalytics} />
                  </div>
                )}
                {user && <CertificatesSection />}
                {user && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-foreground">
                        My Olympiad Registrations
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => navigate("/olympiads")}
                      >
                        Browse Olympiads
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    {registrationsLoading ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2].map((i) => (
                          <Card
                            key={i}
                            className="border-border animate-pulse"
                          >
                            <CardContent className="p-6">
                              <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                              <div className="h-4 bg-muted rounded w-1/3" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : olympiadRegistrations && olympiadRegistrations.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {olympiadRegistrations.map((reg, index) => {
                          const olympiad = reg.olympiad as any;
                          if (!olympiad) return null;
                          const statusColors: Record<string, string> = {
                            registered: "bg-primary/10 text-primary",
                            completed: "bg-green-500/10 text-green-500",
                            cancelled: "bg-destructive/10 text-destructive",
                          };
                          const olympiadStatusColors: Record<string, string> = {
                            upcoming: "bg-blue-500/10 text-blue-500",
                            active: "bg-green-500/10 text-green-500",
                            completed: "bg-muted text-muted-foreground",
                          };
                          return (
                            <motion.div
                              key={reg.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className="border-border hover:border-primary/50 transition-colors">
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-foreground text-lg mb-1">
                                        {olympiad.title}
                                      </h3>
                                      {olympiad.center && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                          {olympiad.center.name}
                                          {olympiad.center.is_verified && (
                                            <CheckSquare className="w-3 h-3 text-primary" />
                                          )}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                      <Badge
                                        className={
                                          statusColors[reg.status] ||
                                          statusColors.registered
                                        }
                                      >
                                        {reg.status.charAt(0).toUpperCase() +
                                          reg.status.slice(1)}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={
                                          olympiadStatusColors[olympiad.status] || ""
                                        }
                                      >
                                        {olympiad.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="w-4 h-4" />
                                      <span>
                                        {format(
                                          new Date(olympiad.start_date),
                                          "MMM d, yyyy"
                                        )}{" "}
                                        –{" "}
                                        {format(
                                          new Date(olympiad.end_date),
                                          "MMM d, yyyy"
                                        )}
                                      </span>
                                    </div>
                                    {olympiad.subject && (
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor:
                                              olympiad.subject.color || "#6366f1",
                                          }}
                                        />
                                        <span className="text-muted-foreground">
                                          {olympiad.subject.name}
                                        </span>
                                      </div>
                                    )}
                                    {olympiad.max_participants && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>
                                          {olympiad.current_participants || 0} /{" "}
                                          {olympiad.max_participants} participants
                                        </span>
                                      </div>
                                    )}
                                    {olympiad.prize_description && (
                                      <div className="flex items-center gap-2 text-primary">
                                        <Trophy className="w-4 h-4" />
                                        <span className="font-medium">
                                          {olympiad.prize_description}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        Registered{" "}
                                        {format(
                                          new Date(reg.registered_at),
                                          "MMM d, yyyy"
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="border-border">
                        <CardContent className="p-12 text-center">
                          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            No olympiad registrations yet
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Browse available olympiads and register to compete!
                          </p>
                          <Button
                            onClick={() => navigate("/olympiads")}
                            className="gap-2"
                          >
                            <Trophy className="w-4 h-4" />
                            Browse Olympiads
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            {user ? (
              <StudentDashboard
                userId={user.id}
                onCourseClick={handleCourseClick}
              />
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <LogIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sign in to view your courses
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Enroll in courses and track your progress
                  </p>
                  <Link to="/auth">
                    <Button className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="test-history" className="mt-6">
            {user ? (
              <ProfileTestHistoryTab />
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <LogIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sign in to view test history
                  </h3>
                  <Link to="/auth">
                    <Button className="gap-2">Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="olympiads" className="mt-6">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">
                    My Olympiad Registrations
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/olympiads")}
                  >
                    Browse Olympiads
                  </Button>
                </div>
                {registrationsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <Card key={i} className="border-border animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : olympiadRegistrations && olympiadRegistrations.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {olympiadRegistrations.map((reg) => {
                      const olympiad = reg.olympiad as any;
                      if (!olympiad) return null;
                      return (
                        <Card
                          key={reg.id}
                          className="border-border hover:border-primary/50"
                        >
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-2">
                              {olympiad.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(olympiad.start_date),
                                "MMM d, yyyy"
                              )}{" "}
                              –{" "}
                              {format(
                                new Date(olympiad.end_date),
                                "MMM d, yyyy"
                              )}
                            </p>
                            <Badge className="mt-2">{reg.status}</Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <ProfileEmptyState type="overview" />
                )}
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <SavedItemsTab />
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            {user ? (
              <AchievementBadges showAll />
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-6">
            {user ? (
              <BookmarkedQuestionsTab />
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="goals" className="mt-6">
            {user ? (
              <ProgressGoals />
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6 space-y-8">
            {user ? (
              <>
                <ProfileSettings />
                <DangerZone />
              </>
            ) : (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <LogIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sign in to manage settings
                  </h3>
                  <Link to="/auth">
                    <Button className="gap-2">Sign In</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Profile;
