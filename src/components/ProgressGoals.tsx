import { FC, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Trash2, Trophy, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserGoal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  subject_id: string | null;
  deadline: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

export const ProgressGoals: FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goalType, setGoalType] = useState("score");
  const [targetValue, setTargetValue] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [deadline, setDeadline] = useState("");

  // Fetch user goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["user-goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserGoal[];
    },
    enabled: !!user,
  });

  // Fetch subjects for filtering
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*");
      if (error) throw error;
      return data as Subject[];
    },
  });

  // Fetch test attempts to calculate current progress
  const { data: attempts = [] } = useQuery({
    queryKey: ["test-attempts-for-goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("*, tests(subject_id)")
        .eq("user_id", user!.id)
        .eq("status", "completed");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create goal mutation
  const createGoal = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_goals").insert({
        user_id: user!.id,
        goal_type: goalType,
        target_value: parseInt(targetValue),
        subject_id: subjectId || null,
        deadline: deadline || null,
        current_value: calculateCurrentValue(goalType, subjectId),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-goals"] });
      toast.success("Goal created successfully!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create goal");
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from("user_goals").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-goals"] });
      toast.success("Goal deleted");
    },
  });

  const calculateCurrentValue = (type: string, subjectFilter?: string) => {
    const filteredAttempts = subjectFilter
      ? attempts.filter((a: any) => a.tests?.subject_id === subjectFilter)
      : attempts;

    if (type === "score") {
      if (filteredAttempts.length === 0) return 0;
      const avgScore = filteredAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / filteredAttempts.length;
      return Math.round(avgScore);
    } else if (type === "tests_completed") {
      return filteredAttempts.length;
    }
    return 0;
  };

  const resetForm = () => {
    setGoalType("score");
    setTargetValue("");
    setSubjectId("");
    setDeadline("");
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case "score":
        return <Target className="w-5 h-5" />;
      case "tests_completed":
        return <Trophy className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getGoalLabel = (type: string) => {
    switch (type) {
      case "score":
        return "Average Score";
      case "tests_completed":
        return "Tests Completed";
      default:
        return type;
    }
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return "All Subjects";
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || "Unknown";
  };

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sign in to set your goals</p>
        </CardContent>
      </Card>
    );
  }

  if (goalsLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Goals</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Average Score Target</SelectItem>
                    <SelectItem value="tests_completed">Tests Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  placeholder={goalType === "score" ? "e.g., 85" : "e.g., 10"}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Subject (Optional)</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Deadline (Optional)</Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => createGoal.mutate()}
                disabled={!targetValue || createGoal.isPending}
              >
                {createGoal.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No goals set yet</p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Active Goals</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <AnimatePresence>
                  {activeGoals.map((goal, index) => {
                    const currentValue = calculateCurrentValue(goal.goal_type, goal.subject_id || undefined);
                    const progress = Math.min((currentValue / goal.target_value) * 100, 100);
                    const isComplete = currentValue >= goal.target_value;

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`bg-card/50 backdrop-blur border-border/50 ${isComplete ? "ring-2 ring-green-500/50" : ""}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isComplete ? "bg-green-500/20 text-green-500" : "bg-primary/20 text-primary"}`}>
                                  {isComplete ? <CheckCircle2 className="w-5 h-5" /> : getGoalIcon(goal.goal_type)}
                                </div>
                                <div>
                                  <p className="font-medium">{getGoalLabel(goal.goal_type)}</p>
                                  <p className="text-xs text-muted-foreground">{getSubjectName(goal.subject_id)}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteGoal.mutate(goal.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {currentValue} / {goal.target_value}
                                  {goal.goal_type === "score" && "%"}
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>

                            {goal.deadline && (
                              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>Due {format(new Date(goal.deadline), "MMM d, yyyy")}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Completed Goals</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{getGoalLabel(goal.goal_type)}</p>
                            <p className="text-xs text-muted-foreground">
                              Completed {goal.completed_at && format(new Date(goal.completed_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <span className="text-green-500 font-bold">{goal.target_value}{goal.goal_type === "score" && "%"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
