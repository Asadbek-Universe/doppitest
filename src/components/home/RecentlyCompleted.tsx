import { FC } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  FileText,
  GraduationCap,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useRecentlyCompletedCourses,
  useRecentlyCompletedTests,
} from "@/hooks/useContinueLearning";

export const RecentlyCompleted: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tests, isLoading: testsLoading } = useRecentlyCompletedTests(user?.id, 7);
  const { data: courses, isLoading: coursesLoading } = useRecentlyCompletedCourses(user?.id, 7);

  const isLoading = testsLoading || coursesLoading;
  const hasContent = (tests?.length || 0) > 0 || (courses?.length || 0) > 0;

  if (!user || (!isLoading && !hasContent)) return null;

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return "Oson";
    if (difficulty <= 4) return "O'rta";
    return "Qiyin";
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-accent/20 text-accent";
    if (difficulty <= 4) return "bg-coin/20 text-coin";
    return "bg-destructive/20 text-destructive";
  };

  const renderScore = (score: number | null, total: number | null) => {
    if (!score || !total) return null;
    const pct = Math.round((score / total) * 100);
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Trophy className="w-3 h-3" />
        {pct}%
      </span>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Yaqinda yakunlangan</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Completed Tests */}
          {tests?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Test
                        </Badge>
                        {item.test.subjects && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${item.test.subjects.color}20`,
                              color: item.test.subjects.color,
                            }}
                          >
                            {item.test.subjects.name}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getDifficultyColor(item.test.difficulty)}`}>
                          {getDifficultyLabel(item.test.difficulty)}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-foreground truncate">
                        {item.test.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {renderScore(item.score, item.total_points)}
                        <span>
                          Yakunlangan: {formatDistanceToNow(new Date(item.completed_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/test-history?attemptId=${item.id}`)}
                        className="gap-1"
                      >
                        Natijani ko‘rish
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/test-history?attemptId=${item.id}`)}
                      >
                        Tahlil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Completed Courses */}
          {courses?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (tests?.length || 0) * 0.05 + index * 0.05 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      {item.course.thumbnail_url ? (
                        <img
                          src={item.course.thumbnail_url}
                          alt={item.course.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Kurs
                        </Badge>
                        {item.course.subjects && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${item.course.subjects.color}20`,
                              color: item.course.subjects.color,
                            }}
                          >
                            {item.course.subjects.name}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-foreground truncate">{item.course.title}</h3>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>
                          Yakunlangan: {formatDistanceToNow(new Date(item.completed_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="flex-shrink-0 gap-1"
                      onClick={() => navigate(`/courses?courseId=${item.course_id}`)}
                    >
                      Ko‘rish
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};
