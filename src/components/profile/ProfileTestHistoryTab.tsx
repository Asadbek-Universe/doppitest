import { FC, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  ChevronRight,
  Loader2,
  BarChart3,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface AttemptRow {
  id: string;
  test_id: string;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  total_points: number | null;
  status: string;
  tests: {
    id: string;
    title: string;
    questions_count: number;
    duration_minutes: number;
    difficulty: number;
    subjects: { id: string; name: string } | null;
  } | null;
}

export const ProfileTestHistoryTab: FC = () => {
  const { user } = useAuth();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["profile-test-attempts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("test_attempts")
        .select(`
          id,
          test_id,
          started_at,
          completed_at,
          time_spent_seconds,
          score,
          total_points,
          status,
          tests (
            id,
            title,
            questions_count,
            duration_minutes,
            difficulty,
            subjects (id, name)
          )
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AttemptRow[];
    },
    enabled: !!user,
  });

  const subjects = useMemo(() => {
    const set = new Set<string>();
    attempts.forEach((a) => {
      const name = (a.tests as any)?.subjects?.name;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [attempts]);

  const filtered = useMemo(() => {
    let list = subjectFilter === "all"
      ? attempts
      : attempts.filter((a) => (a.tests as any)?.subjects?.name === subjectFilter);
    if (sortBy === "score") {
      list = [...list].sort((a, b) => {
        const pctA = a.total_points ? ((a.score ?? 0) / a.total_points) * 100 : 0;
        const pctB = b.total_points ? ((b.score ?? 0) / b.total_points) * 100 : 0;
        return pctB - pctA;
      });
    }
    return list;
  }, [attempts, subjectFilter, sortBy]);

  const formatTime = (sec: number | null) => {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "score")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by date</SelectItem>
            <SelectItem value="score">Sort by score</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <Link to="/test-history">
            Full history
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No test attempts yet.</p>
            <Button asChild className="mt-4">
              <Link to="/tests">Browse tests</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 15).map((attempt) => {
            const pct = attempt.total_points
              ? Math.round(((attempt.score ?? 0) / attempt.total_points) * 100)
              : 0;
            const passed = pct >= 60;
            const subj = (attempt.tests as any)?.subjects?.name ?? "—";
            return (
              <Card key={attempt.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          attempt.status === "completed"
                            ? passed
                              ? "bg-green-500/10"
                              : "bg-red-500/10"
                            : "bg-orange-500/10"
                        }`}
                      >
                        {attempt.status === "completed" ? (
                          passed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        ) : (
                          <FileText className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {attempt.tests?.title ?? "Unknown test"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{subj}</span>
                          <span>·</span>
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(attempt.started_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {attempt.status === "completed" && (
                        <>
                          <span
                            className={`text-lg font-bold ${
                              passed ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {pct}%
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(attempt.time_spent_seconds)}
                          </span>
                          <Badge variant={passed ? "default" : "destructive"}>
                            {passed ? "Pass" : "Fail"}
                          </Badge>
                        </>
                      )}
                      {attempt.status === "in_progress" && (
                        <Badge className="bg-orange-500/10 text-orange-600">In progress</Badge>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/test-history?attemptId=${attempt.id}`}>
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
