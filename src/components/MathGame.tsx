import { FC, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Trophy, Zap, CheckCircle, XCircle, RotateCcw, TrendingUp, TrendingDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useCheckAchievements } from "./AchievementBadges";
interface MathGameProps {
  isOpen: boolean;
  onClose: () => void;
}

type GameState = "ready" | "playing" | "finished";

interface Question {
  num1: number;
  num2: number;
  operator: "+" | "-" | "×";
  answer: number;
  options: number[];
}

const generateQuestion = (difficulty: number): Question => {
  const operators: ("+" | "-" | "×")[] = ["+", "-", "×"];
  const operator = operators[Math.floor(Math.random() * (difficulty > 3 ? 3 : 2))];
  
  let num1: number, num2: number, answer: number;
  const maxNum = Math.min(10 + difficulty * 5, 50);
  
  switch (operator) {
    case "+":
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      answer = num1 + num2;
      break;
    case "-":
      num1 = Math.floor(Math.random() * maxNum) + 10;
      num2 = Math.floor(Math.random() * Math.min(num1, maxNum)) + 1;
      answer = num1 - num2;
      break;
    case "×":
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      break;
    default:
      num1 = 1;
      num2 = 1;
      answer = 2;
  }

  // Generate wrong options
  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrongAnswer = answer + offset;
    if (wrongAnswer > 0 && wrongAnswer !== answer && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  options.sort(() => Math.random() - 0.5);

  return { num1, num2, operator, answer, options };
};

export const MathGame: FC<MathGameProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkAndUnlock } = useCheckAchievements();
  
  const [gameState, setGameState] = useState<GameState>("ready");
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const hasSubmittedRef = useRef(false);

  // Fetch personal best
  const { data: personalBest } = useQuery({
    queryKey: ["personal-best", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("game_scores")
        .select("score")
        .eq("user_id", user.id)
        .eq("game_type", "math_challenge")
        .order("score", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data?.score || 0;
    },
    enabled: !!user,
  });

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(difficulty));
    setFeedback(null);
  }, [difficulty]);

  const startGame = () => {
    hasSubmittedRef.current = false;
    setIsNewRecord(false);
    setGameState("playing");
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setQuestionsAnswered(0);
    setTimeLeft(60);
    setDifficulty(1);
    nextQuestion();
  };

  const saveScore = async (finalScore: number, answered: number, bestStreak: number, maxDifficulty: number) => {
    if (!user || hasSubmittedRef.current) return;
    
    hasSubmittedRef.current = true;
    setIsSaving(true);
    
    // Check if new record
    if (personalBest !== null && finalScore > personalBest) {
      setIsNewRecord(true);
    }
    
    try {
      const { error } = await supabase
        .from("game_scores")
        .insert({
          user_id: user.id,
          game_type: "math_challenge",
          score: finalScore,
          questions_answered: answered,
          max_streak: bestStreak,
          difficulty_reached: maxDifficulty,
          time_played_seconds: 60,
        });

      if (error) throw error;
      
      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ["game-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["personal-best"] });
      queryClient.invalidateQueries({ queryKey: ["user-game-stats"] });
      
      // Fetch updated stats for achievement checking
      const { data: allScores } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("game_type", "math_challenge");

      if (allScores && allScores.length > 0) {
        const scores = allScores.map((d) => d.score);
        const stats = {
          highScore: Math.max(...scores),
          totalGames: allScores.length,
          bestStreak: Math.max(...allScores.map((d) => d.max_streak)),
          maxDifficulty: Math.max(...allScores.map((d) => d.difficulty_reached)),
          totalScore: scores.reduce((a, b) => a + b, 0),
        };
        
        // Check for new achievements
        await checkAndUnlock(stats);
      }
      
      toast({
        title: isNewRecord ? "New Personal Best!" : "Score saved!",
        description: isNewRecord 
          ? `You beat your record with ${finalScore} points!` 
          : `You scored ${finalScore} points.`,
      });
    } catch (error) {
      console.error("Failed to save score:", error);
      toast({
        title: "Score not saved",
        description: "Sign in to save your scores to the leaderboard.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswer = (selectedAnswer: number) => {
    if (!question || feedback) return;

    const isCorrect = selectedAnswer === question.answer;
    setFeedback(isCorrect ? "correct" : "wrong");
    setQuestionsAnswered(prev => prev + 1);

    if (isCorrect) {
      const streakBonus = Math.floor(streak / 3) * 5;
      setScore(prev => prev + 10 + streakBonus);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      
      // Increase difficulty every 5 correct answers
      if ((questionsAnswered + 1) % 5 === 0) {
        setDifficulty(prev => Math.min(prev + 1, 10));
      }
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      nextQuestion();
    }, 500);
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Save score when game finishes
  useEffect(() => {
    if (gameState === "finished" && !hasSubmittedRef.current) {
      saveScore(score, questionsAnswered, maxStreak, difficulty);
    }
  }, [gameState]);

  useEffect(() => {
    if (!isOpen) {
      setGameState("ready");
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setQuestionsAnswered(0);
      setTimeLeft(60);
      hasSubmittedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-card border-border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Math Speed Challenge</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <CardContent className="p-6">
              {/* Ready State */}
              {gameState === "ready" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Ready to Play?</h3>
                  <p className="text-muted-foreground mb-4">
                    Solve as many math problems as you can in 60 seconds!
                  </p>
                  {user && personalBest !== undefined && personalBest > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center gap-2 text-yellow-500">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold">Personal Best: {personalBest} pts</span>
                      </div>
                    </div>
                  )}
                  <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                    <li>✓ +10 points per correct answer</li>
                    <li>✓ Streak bonuses for consecutive answers</li>
                    <li>✓ Beat your personal best!</li>
                  </ul>
                  <Button size="lg" onClick={startGame} className="px-8">
                    Start Game
                  </Button>
                </motion.div>
              )}

              {/* Playing State */}
              {gameState === "playing" && question && (
                <div className="space-y-6">
                  {/* Stats Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">{score}</span>
                      </div>
                      <div className="flex items-center gap-2 text-orange-500">
                        <Zap className="w-5 h-5" />
                        <span className="font-bold">×{streak}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-5 h-5 ${timeLeft <= 10 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                      <span className={`font-bold ${timeLeft <= 10 ? "text-destructive" : "text-foreground"}`}>
                        {timeLeft}s
                      </span>
                    </div>
                  </div>

                  {/* Timer Progress */}
                  <Progress value={(timeLeft / 60) * 100} className="h-2" />

                  {/* Question */}
                  <motion.div
                    key={questionsAnswered}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-center py-8 rounded-xl ${
                      feedback === "correct" 
                        ? "bg-green-500/20" 
                        : feedback === "wrong" 
                        ? "bg-destructive/20" 
                        : "bg-muted/50"
                    } transition-colors`}
                  >
                    <div className="text-5xl font-bold text-foreground mb-2">
                      {question.num1} {question.operator} {question.num2}
                    </div>
                    <div className="text-muted-foreground">= ?</div>
                    
                    {feedback && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-4"
                      >
                        {feedback === "correct" ? (
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-12 h-12 text-destructive mx-auto" />
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3">
                    {question.options.map((option, index) => (
                      <motion.button
                        key={`${questionsAnswered}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleAnswer(option)}
                        disabled={!!feedback}
                        className={`p-4 text-xl font-bold rounded-xl border-2 transition-all ${
                          feedback
                            ? option === question.answer
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-muted border-border text-muted-foreground"
                            : "bg-card border-border hover:border-primary hover:bg-primary/10 text-foreground"
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Finished State */}
              {gameState === "finished" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className={`w-20 h-20 rounded-full ${isNewRecord ? "bg-yellow-500/20" : "bg-primary/20"} flex items-center justify-center mx-auto mb-6`}>
                    {isNewRecord ? (
                      <Star className="w-10 h-10 text-yellow-500" />
                    ) : (
                      <Trophy className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  {isNewRecord && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mb-2"
                    >
                      <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        New Personal Best!
                      </span>
                    </motion.div>
                  )}
                  <h3 className="text-2xl font-bold text-foreground mb-2">Game Over!</h3>
                  <p className="text-4xl font-bold text-primary mb-2">{score} points</p>
                  
                  {/* Comparison with personal best */}
                  {user && personalBest !== undefined && personalBest > 0 && !isNewRecord && (
                    <div className="flex items-center justify-center gap-2 text-sm mb-2">
                      {score >= personalBest ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Tied your best!
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          {personalBest - score} pts below your best ({personalBest})
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-muted-foreground mb-2">
                    {questionsAnswered} questions · Best streak: {maxStreak}×
                  </p>
                  {isSaving && (
                    <p className="text-sm text-muted-foreground mb-4">Saving score...</p>
                  )}
                  {!user && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign in to save your scores!
                    </p>
                  )}
                  
                  <div className="flex gap-3 justify-center mt-6">
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                    <Button onClick={startGame} className="gap-2" disabled={isSaving}>
                      <RotateCcw className="w-4 h-4" />
                      Play Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
