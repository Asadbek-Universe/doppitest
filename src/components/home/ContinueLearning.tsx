import { FC } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Clock, 
  BookOpen, 
  FileText, 
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useIncompleteTests, useIncompleteCourses } from "@/hooks/useContinueLearning";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export const ContinueLearning: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: incompleteTests, isLoading: testsLoading } = useIncompleteTests(user?.id);
  const { data: incompleteCourses, isLoading: coursesLoading } = useIncompleteCourses(user?.id);

  const isLoading = testsLoading || coursesLoading;
  const hasContent = (incompleteTests?.length || 0) > 0 || (incompleteCourses?.length || 0) > 0;

  // Don't render if user is not logged in or has no incomplete items
  if (!user || (!isLoading && !hasContent)) {
    return null;
  }

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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Davom ettiring
          </h2>
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
          {/* Incomplete Tests */}
          {incompleteTests?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/tests?testId=${item.test_id}&attemptId=${item.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Test
                        </Badge>
                        {item.test.subjects && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${item.test.subjects.color}20`,
                              color: item.test.subjects.color 
                            }}
                          >
                            {item.test.subjects.name}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getDifficultyColor(item.test.difficulty)}`}>
                          {getDifficultyLabel(item.test.difficulty)}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.test.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.test.duration_minutes} daqiqa
                        </span>
                        <span>
                          Boshlangan: {formatDistanceToNow(new Date(item.started_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="flex-shrink-0 gap-1"
                    >
                      Davom etish
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Incomplete Courses */}
          {incompleteCourses?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (incompleteTests?.length || 0) * 0.05 + index * 0.05 }}
            >
              <Card 
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/courses?courseId=${item.course_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      {item.course.thumbnail_url ? (
                        <img 
                          src={item.course.thumbnail_url} 
                          alt={item.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Kurs
                        </Badge>
                        {item.course.subjects && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${item.course.subjects.color}20`,
                              color: item.course.subjects.color 
                            }}
                          >
                            {item.course.subjects.name}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.course.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-2 flex-1">
                          <Progress value={item.progress} className="h-2 flex-1 max-w-[120px]" />
                          <span className="text-xs text-muted-foreground">
                            {item.progress}%
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {item.completedLessons}/{item.totalLessons} dars
                        </span>
                         <span className="text-xs text-muted-foreground">
                           Boshlangan: {formatDistanceToNow(new Date(item.enrolled_at), { addSuffix: true })}
                         </span>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="flex-shrink-0 gap-1"
                    >
                      Davom etish
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
