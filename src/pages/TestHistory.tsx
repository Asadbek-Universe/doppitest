import { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { 
  History, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  FileText, 
  TrendingUp,
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  BarChart3,
  List,
  Target,
  Bookmark
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TestAnalytics } from "@/components/TestAnalytics";
import { ProgressGoals } from "@/components/ProgressGoals";
import { BookmarkedQuestionsTab } from "@/components/BookmarkedQuestionsTab";

interface TestAttemptWithTest {
  id: string;
  test_id: string;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  total_points: number | null;
  correct_answers: number | null;
  wrong_answers: number | null;
  skipped_answers: number | null;
  status: string;
  tests: {
    id: string;
    title: string;
    questions_count: number;
    duration_minutes: number;
    difficulty: number;
    is_official: boolean | null;
  } | null;
}

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty <= 2) return "Easy";
  if (difficulty <= 4) return "Medium";
  return "Hard";
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 2) return "text-green-500 bg-green-500/10";
  if (difficulty <= 4) return "text-orange-500 bg-orange-500/10";
  return "text-red-500 bg-red-500/10";
};

const getScoreColor = (percentage: number) => {
  if (percentage >= 80) return "text-green-500";
  if (percentage >= 60) return "text-yellow-500";
  if (percentage >= 40) return "text-orange-500";
  return "text-red-500";
};

const TestHistory: FC = () => {
  const { user } = useAuth();
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttemptWithTest | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const attemptIdParam = searchParams.get("attemptId");

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["test-attempts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("test_attempts")
        .select(`
          *,
          tests (
            id,
            title,
            questions_count,
            duration_minutes,
            difficulty,
            is_official
          )
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as TestAttemptWithTest[];
    },
    enabled: !!user,
  });

  // Deep-link support: /test-history?attemptId=...
  useEffect(() => {
    if (!attemptIdParam || !attempts || attempts.length === 0) return;
    if (selectedAttempt?.id === attemptIdParam) return;
    const found = attempts.find((a) => a.id === attemptIdParam);
    if (found) setSelectedAttempt(found);
  }, [attemptIdParam, attempts, selectedAttempt?.id]);

  const { data: attemptDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["attempt-details", selectedAttempt?.id],
    queryFn: async () => {
      if (!selectedAttempt) return null;

      const { data: answers, error: answersError } = await supabase
        .from("user_answers")
        .select(`
          *,
          questions (
            id,
            question_text,
            points,
            explanation,
            question_options (*)
          )
        `)
        .eq("attempt_id", selectedAttempt.id);

      if (answersError) throw answersError;
      return answers;
    },
    enabled: !!selectedAttempt,
  });

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const completedAttempts = attempts?.filter((a) => a.status === "completed") || [];
  const inProgressAttempts = attempts?.filter((a) => a.status === "in_progress") || [];

  // Calculate stats
  const totalTests = completedAttempts.length;
  const avgScore = totalTests > 0 
    ? Math.round(completedAttempts.reduce((acc, a) => {
        const percentage = a.total_points ? (a.score || 0) / a.total_points * 100 : 0;
        return acc + percentage;
      }, 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...completedAttempts.map((a) => a.total_points ? Math.round((a.score || 0) / a.total_points * 100) : 0))
    : 0;
  const totalTime = completedAttempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Sign in required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to view your test history.
              </p>
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review modal
  if (selectedAttempt) {
    const percentage = selectedAttempt.total_points 
      ? Math.round((selectedAttempt.score || 0) / selectedAttempt.total_points * 100) 
      : 0;

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 md:pt-24 pb-12">
          <div className="container px-6">
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedAttempt(null);
                setSearchParams({});
              }}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>

            <div className="max-w-4xl mx-auto">
              {/* Attempt Summary */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <span>{selectedAttempt.tests?.title || "Unknown Test"}</span>
                    <Badge className={selectedAttempt.tests?.is_official ? "bg-primary" : "bg-teal-500"}>
                      {selectedAttempt.tests?.is_official ? "Official" : "Center Test"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-xl p-4 text-center">
                      <p className={`text-3xl font-bold ${getScoreColor(percentage)}`}>
                        {percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-green-500">{selectedAttempt.correct_answers || 0}</p>
                      <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-red-500">{selectedAttempt.wrong_answers || 0}</p>
                      <p className="text-xs text-muted-foreground">Wrong</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-foreground">{formatTime(selectedAttempt.time_spent_seconds)}</p>
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Completed on {selectedAttempt.completed_at ? format(new Date(selectedAttempt.completed_at), "PPP 'at' p") : "N/A"}
                  </p>
                </CardContent>
              </Card>

              {/* Answer Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Answer Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : attemptDetails && attemptDetails.length > 0 ? (
                    <div className="space-y-4">
                      {attemptDetails.map((answer: any, idx: number) => {
                        const question = answer.questions;
                        const selectedOption = question?.question_options?.find(
                          (o: any) => o.id === answer.selected_option_id
                        );
                        const correctOption = question?.question_options?.find(
                          (o: any) => o.is_correct
                        );

                        return (
                          <motion.div
                            key={answer.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-xl border ${
                              answer.is_correct 
                                ? "border-green-500/30 bg-green-500/5" 
                                : answer.selected_option_id 
                                ? "border-red-500/30 bg-red-500/5"
                                : "border-border bg-muted/30"
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm ${
                                answer.is_correct 
                                  ? "bg-green-500 text-white" 
                                  : answer.selected_option_id 
                                  ? "bg-red-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground mb-2">
                                  {question?.question_text || "Question not found"}
                                </p>
                                <div className="space-y-2">
                                  {answer.selected_option_id ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">Your answer:</span>
                                      <span className={`text-sm font-medium ${answer.is_correct ? "text-green-500" : "text-red-500"}`}>
                                        {selectedOption?.option_letter}. {selectedOption?.option_text}
                                      </span>
                                      {answer.is_correct ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">Skipped</p>
                                  )}
                                  {!answer.is_correct && correctOption && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">Correct answer:</span>
                                      <span className="text-sm font-medium text-green-500">
                                        {correctOption.option_letter}. {correctOption.option_text}
                                      </span>
                                    </div>
                                  )}
                                  {question?.explanation && (
                                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                                      <p className="text-sm text-muted-foreground">
                                        <span className="font-medium">Explanation:</span> {question.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No answer details available for this attempt.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Test History
            </h1>
            <p className="text-muted-foreground">
              Review your past test attempts and track your progress
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{totalTests}</p>
                <p className="text-sm text-muted-foreground">Tests Taken</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{avgScore}%</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{bestScore}%</p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{Math.round(totalTime / 60)}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Tabs for History and Analytics */}
      <section className="container px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="history" className="gap-2">
                <List className="w-4 h-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="gap-2">
                <Bookmark className="w-4 h-4" />
                Bookmarks
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-2">
                <Target className="w-4 h-4" />
                Goals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookmarks">
              <BookmarkedQuestionsTab />
            </TabsContent>

            <TabsContent value="goals">
              <ProgressGoals />
            </TabsContent>

            <TabsContent value="analytics">
              {attempts && attempts.length > 0 ? (
                <TestAnalytics attempts={attempts} />
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <BarChart3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No data available</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete some tests to see your analytics
                    </p>
                    <Link to="/tests">
                      <Button>Browse Tests</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : attempts && attempts.length > 0 ? (
            <div className="space-y-4">
              {attempts.map((attempt, index) => {
                const percentage = attempt.total_points 
                  ? Math.round((attempt.score || 0) / attempt.total_points * 100) 
                  : 0;

                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => attempt.status === "completed" && setSelectedAttempt(attempt)}
                    >
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              attempt.status === "completed" 
                                ? percentage >= 60 ? "bg-green-500/10" : "bg-red-500/10"
                                : "bg-orange-500/10"
                            }`}>
                              {attempt.status === "completed" ? (
                                <Trophy className={`w-6 h-6 ${percentage >= 60 ? "text-green-500" : "text-red-500"}`} />
                              ) : (
                                <Clock className="w-6 h-6 text-orange-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {attempt.tests?.title || "Unknown Test"}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(attempt.started_at), "MMM d, yyyy")}</span>
                                {attempt.tests && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className={getDifficultyColor(attempt.tests.difficulty)}>
                                      {getDifficultyLabel(attempt.tests.difficulty)}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {attempt.status === "completed" ? (
                              <>
                                <div className="text-right hidden sm:block">
                                  <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                                    {percentage}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {attempt.correct_answers}/{(attempt.correct_answers || 0) + (attempt.wrong_answers || 0) + (attempt.skipped_answers || 0)} correct
                                  </p>
                                </div>
                                <Button variant="ghost" size="icon">
                                  <ChevronRight className="w-5 h-5" />
                                </Button>
                              </>
                            ) : (
                              <Badge className="bg-orange-500/10 text-orange-500">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No test attempts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start taking tests to see your history here
                </p>
                <Link to="/tests">
                  <Button>Browse Tests</Button>
                </Link>
              </CardContent>
            </Card>
          )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default TestHistory;
