import { FC, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Clock, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookmarkCheck,
  BookOpen, 
  Tag, 
  TrendingUp,
  List,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTest, useStartTestAttempt, useSubmitAnswer, useCompleteTestAttempt, Question } from "@/hooks/useTests";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGoalCompletion } from "@/hooks/useGoalCompletion";
import { useBookmarkedQuestionIds, useToggleQuestionBookmark } from "@/hooks/useQuestionBookmarks";
import { useUserRole } from "@/hooks/useUserRole";
import { PostTestFlow } from "@/components/post-test";
import { calculateWeakTopics } from "@/hooks/usePostTestRecommendations";

interface TestPlayerProps {
  test: {
    id: string;
    title: string;
    tag: string;
    difficulty: string;
    questionsCount: number;
    duration: number;
  };
  onExit: () => void;
}

type TestState = "loading" | "ready" | "playing" | "review" | "results" | "post-test-flow";

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy":
      return "text-green-500 bg-green-500/10";
    case "Medium":
      return "text-orange-500 bg-orange-500/10";
    case "Hard":
      return "text-red-500 bg-red-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const TestPlayer: FC<TestPlayerProps> = ({ test, onExit }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkGoalCompletion } = useGoalCompletion(user?.id);
  const { data: role } = useUserRole();
  
  const { data: testData, isLoading, error } = useTest(test.id);
  const startAttemptMutation = useStartTestAttempt();
  const submitAnswerMutation = useSubmitAnswer();
  const completeAttemptMutation = useCompleteTestAttempt();
  
  // Question bookmarks
  const { data: bookmarkedQuestionIds } = useBookmarkedQuestionIds(test.id, user?.id);
  const toggleBookmarkMutation = useToggleQuestionBookmark();

  const [testState, setTestState] = useState<TestState>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, { optionId: string; optionLetter: string; isCorrect: boolean }>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);
  const [timeSpent, setTimeSpent] = useState(0);
  const [results, setResults] = useState<{
    correct: number;
    wrong: number;
    skipped: number;
    totalPoints: number;
    earnedPoints: number;
    percentage: number;
    weakTopics: string[];
  } | null>(null);

  const questions = testData?.questions || [];
  const question = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestion === questions.length - 1;
  
  // Check if current question is bookmarked
  const isCurrentQuestionBookmarked = useMemo(() => {
    if (!question || !bookmarkedQuestionIds) return false;
    return bookmarkedQuestionIds.has(question.id);
  }, [question, bookmarkedQuestionIds]);
  
  // Check if user can bookmark (only 'user' role can add/remove)
  const canBookmark = role === "user";

  // Initialize test state when data loads
  useEffect(() => {
    if (!isLoading && testData) {
      if (testData.questions.length === 0) {
        toast({
          title: "No questions available",
          description: "This test doesn't have any questions yet.",
          variant: "destructive",
        });
        setTestState("ready");
      } else {
        setTestState("ready");
      }
    }
  }, [isLoading, testData]);

  // Timer
  useEffect(() => {
    if (testState !== "playing") return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [testState]);

  // Update selected answer when changing questions
  useEffect(() => {
    setSelectedAnswer(answers[currentQuestion]?.optionLetter || null);
  }, [currentQuestion, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTest = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to take tests and save your progress.",
        variant: "destructive",
      });
      return;
    }

    try {
      const attempt = await startAttemptMutation.mutateAsync({
        testId: test.id,
        userId: user.id,
      });
      setAttemptId(attempt.id);
      setTestState("playing");
      setTimeLeft(test.duration * 60);
      setTimeSpent(0);
    } catch (error) {
      console.error("Failed to start test:", error);
      toast({
        title: "Error",
        description: "Failed to start test. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnswerSelect = async (optionId: string, optionLetter: string) => {
    setSelectedAnswer(optionLetter);
    
    // Find if answer is correct
    const selectedOption = question?.question_options.find((o) => o.id === optionId);
    const isCorrect = selectedOption?.is_correct || false;
    
    setAnswers((prev) => ({ 
      ...prev, 
      [currentQuestion]: { optionId, optionLetter, isCorrect } 
    }));

    // Save answer to database if we have an attempt
    if (attemptId && question) {
      try {
        await submitAnswerMutation.mutateAsync({
          attemptId,
          questionId: question.id,
          optionId,
          isCorrect,
          isMarkedForReview: markedForReview.has(currentQuestion),
        });
      } catch (error) {
        console.error("Failed to save answer:", error);
      }
    }
  };

  const handleClearAnswer = () => {
    setSelectedAnswer(null);
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion];
      return newAnswers;
    });
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  // Toggle bookmark for current question (persists to database)
  const handleToggleBookmark = async () => {
    if (!user || !question || !canBookmark) {
      if (!canBookmark && user) {
        toast({
          title: "Cannot bookmark",
          description: "Only students can bookmark questions.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      await toggleBookmarkMutation.mutateAsync({
        questionId: question.id,
        testId: test.id,
        userId: user.id,
      });
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to save bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setTestState("review");
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((q, idx) => {
      totalPoints += q.points;
      const answer = answers[idx];
      if (answer) {
        const selectedOption = q.question_options.find((o) => o.id === answer.optionId);
        if (selectedOption?.is_correct) {
          correct++;
          earnedPoints += q.points;
        } else {
          wrong++;
        }
      } else {
        skipped++;
      }
    });

    // Calculate weak topics
    const weakTopics = calculateWeakTopics(
      questions.map((q) => ({ id: q.id, topic: q.topic })),
      answers
    );

    return { 
      correct, 
      wrong, 
      skipped, 
      totalPoints, 
      earnedPoints, 
      percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      weakTopics
    };
  };

  const handleSubmitTest = async () => {
    const calculatedResults = calculateResults();
    setResults(calculatedResults);
    setTestState("post-test-flow"); // Go to post-test flow instead of simple results

    // Save results to database
    if (attemptId) {
      try {
        await completeAttemptMutation.mutateAsync({
          attemptId,
          score: calculatedResults.earnedPoints,
          totalPoints: calculatedResults.totalPoints,
          correctAnswers: calculatedResults.correct,
          wrongAnswers: calculatedResults.wrong,
          skippedAnswers: calculatedResults.skipped,
          timeSpentSeconds: timeSpent,
        });
        toast({
          title: "Test completed!",
          description: `You scored ${calculatedResults.percentage}% (${calculatedResults.earnedPoints}/${calculatedResults.totalPoints} points)`,
        });

        // Check for goal completion after test is saved
        await checkGoalCompletion(testData?.test?.subject_id);
      } catch (error) {
        console.error("Failed to save results:", error);
      }
    }
  };

  const handleRetry = () => {
    setTestState("ready");
    setCurrentQuestion(0);
    setAnswers({});
    setMarkedForReview(new Set());
    setTimeLeft(test.duration * 60);
    setTimeSpent(0);
    setResults(null);
    setAttemptId(null);
  };

  const answeredCount = Object.keys(answers).length;

  // Loading state
  if (testState === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Failed to load test</h2>
          <p className="text-muted-foreground mb-4">There was an error loading this test.</p>
          <Button onClick={onExit}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Ready state - show start screen
  if (testState === "ready") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-3xl p-8 max-w-lg w-full shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{test.title}</h2>
            <Badge className={test.tag === "Official" ? "bg-primary text-primary-foreground" : "bg-teal-500 text-white"}>
              {test.tag}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{questions.length}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{test.duration}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${getDifficultyColor(test.difficulty).split(" ")[0]}`}>
                {test.difficulty.charAt(0)}
              </p>
              <p className="text-xs text-muted-foreground">{test.difficulty}</p>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">This test doesn't have any questions yet.</p>
              <Button onClick={onExit}>Go Back</Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={onExit} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleStartTest} 
                className="flex-1"
                disabled={startAttemptMutation.isPending}
              >
                {startAttemptMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Start Test
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Post-test flow (new multi-step flow)
  if (testState === "post-test-flow" && results) {
    return (
      <PostTestFlow
        testId={test.id}
        testTitle={test.title}
        results={{
          score: results.earnedPoints,
          totalPoints: results.totalPoints,
          percentage: results.percentage,
          correct: results.correct,
          wrong: results.wrong,
          skipped: results.skipped,
          timeSpent: timeSpent,
          subjectId: testData?.test?.subject_id,
          weakTopics: results.weakTopics,
        }}
        onExit={onExit}
        onRetry={handleRetry}
      />
    );
  }

  // Review Screen
  if (testState === "review") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <header className="bg-background border-b border-border sticky top-0 z-50">
          <div className="container px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <List className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Review Your Answers</h1>
                  <p className="text-sm text-muted-foreground">
                    {answeredCount}/{questions.length} answered
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-6 py-2 bg-card rounded-full border border-border shadow-sm">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-xl font-bold text-foreground">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container px-6 py-8 max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-4">Question Summary</h3>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    setCurrentQuestion(idx);
                    setTestState("playing");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium ${
                      answers[idx] 
                        ? "bg-green-500 text-white" 
                        : markedForReview.has(idx)
                        ? "bg-orange-500 text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-foreground text-sm truncate max-w-md">{q.question_text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bookmarkedQuestionIds?.has(q.id) && (
                      <Badge className="bg-primary/10 text-primary">
                        <BookmarkCheck className="w-3 h-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                    {answers[idx] ? (
                      <Badge className="bg-green-500/10 text-green-500">Answered</Badge>
                    ) : markedForReview.has(idx) ? (
                      <Badge className="bg-orange-500/10 text-orange-500">Review</Badge>
                    ) : (
                      <Badge variant="outline">Unanswered</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setTestState("playing")} size="lg">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Continue Test
            </Button>
            <Button onClick={handleSubmitTest} size="lg" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Test
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Playing state
  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No question available</p>
          <Button onClick={onExit} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Test info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">{test.title}</h1>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{test.tag}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className={getDifficultyColor(test.difficulty).split(" ")[0]}>
                    {test.difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Timer */}
            <div className="flex items-center gap-2 px-6 py-2 bg-card rounded-full border border-border shadow-sm">
              <Clock className={`w-5 h-5 ${timeLeft <= 60 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
              <span className={`text-xl font-bold ${timeLeft <= 60 ? "text-red-500" : "text-foreground"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Right: Question count & exit */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1}/{questions.length}
              </span>
              <button 
                onClick={onExit}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      {/* Main content */}
      <main className="container px-6 py-8 max-w-4xl mx-auto pb-32">
        {/* Question card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <Badge className="bg-primary text-primary-foreground">
              Question #{currentQuestion + 1}
            </Badge>
            <Badge className="bg-accent text-accent-foreground">
              {question.points} Points
            </Badge>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-4">
            {question.question_text}
          </h2>

          <div className="flex items-center gap-4 text-sm flex-wrap">
            {question.topic && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Topic: {question.topic}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Type: {question.question_type}</span>
            </div>
          </div>
        </motion.div>

        {/* Answer options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {question.question_options
            .sort((a, b) => a.order_index - b.order_index)
            .map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleAnswerSelect(option.id, option.option_letter)}
              className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                selectedAnswer === option.option_letter
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  selectedAnswer === option.option_letter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {option.option_letter}
              </div>
              <span className="text-foreground">{option.option_text}</span>
            </motion.button>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between mb-8 gap-2">
          {/* Bookmark button (persists to DB) */}
          <Button
            variant="outline"
            onClick={handleToggleBookmark}
            disabled={toggleBookmarkMutation.isPending || !canBookmark}
            className={isCurrentQuestionBookmarked ? "border-primary text-primary" : ""}
          >
            {isCurrentQuestionBookmarked ? (
              <BookmarkCheck className="w-4 h-4 mr-2" />
            ) : (
              <Bookmark className="w-4 h-4 mr-2" />
            )}
            {toggleBookmarkMutation.isPending ? "Saving..." : isCurrentQuestionBookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
          
          {/* Mark for review (session only) */}
          <Button
            variant="outline"
            onClick={toggleMarkForReview}
            className={markedForReview.has(currentQuestion) ? "border-orange-500 text-orange-500" : ""}
          >
            <Tag className="w-4 h-4 mr-2" />
            Review
          </Button>
          
          <Button variant="ghost" onClick={handleClearAnswer} disabled={!selectedAnswer}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Question palette */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Question Palette</h3>
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isBookmarked = bookmarkedQuestionIds?.has(q.id);
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all relative ${
                    idx === currentQuestion
                      ? "bg-primary text-primary-foreground"
                      : answers[idx]
                      ? "bg-green-500 text-white"
                      : markedForReview.has(idx)
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {idx + 1}
                  {isBookmarked && (
                    <BookmarkCheck className="w-3 h-3 absolute -top-1 -right-1 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-4">
        <div className="container px-6 flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setTestState("review")}>
              <List className="w-4 h-4 mr-2" />
              Review All
            </Button>
          </div>

          <Button onClick={handleNextQuestion}>
            {isLastQuestion ? "Finish" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default TestPlayer;
