import { FC, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Award,
  Play,
  ChevronRight,
  TrendingUp,
  Calendar,
  Target,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useUserEnrollments,
  useAllLessonProgress,
  useCourseLessonsCounts,
} from "@/hooks/useCourses";

interface StudentDashboardProps {
  userId: string;
  onCourseClick?: (courseId: string) => void;
}

export const StudentDashboard: FC<StudentDashboardProps> = ({
  userId,
  onCourseClick,
}) => {
  const { data: enrollments, isLoading: enrollmentsLoading } = useUserEnrollments(userId);
  const { data: allProgress, isLoading: progressLoading } = useAllLessonProgress(userId);
  
  const courseIds = useMemo(() => 
    enrollments?.map((e) => e.courses?.id).filter(Boolean) as string[] || [],
    [enrollments]
  );
  
  const { data: lessonCounts } = useCourseLessonsCounts(courseIds);

  // Calculate course progress
  const courseProgress = useMemo(() => {
    if (!enrollments || !allProgress || !lessonCounts) return {};
    
    const progress: Record<string, { completed: number; total: number; percentage: number }> = {};
    
    enrollments.forEach((enrollment) => {
      const courseId = enrollment.courses?.id;
      if (!courseId) return;
      
      const totalLessons = lessonCounts[courseId] || 0;
      const completedLessons = allProgress.filter(
        (p) => p.lessons?.course_id === courseId && p.is_completed
      ).length;
      
      progress[courseId] = {
        completed: completedLessons,
        total: totalLessons,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    });
    
    return progress;
  }, [enrollments, allProgress, lessonCounts]);

  // Get completed courses (certificates)
  const completedCourses = useMemo(() => {
    return enrollments?.filter((e) => {
      const courseId = e.courses?.id;
      if (!courseId) return false;
      const progress = courseProgress[courseId];
      return progress && progress.percentage === 100;
    }) || [];
  }, [enrollments, courseProgress]);

  // Get in-progress courses
  const inProgressCourses = useMemo(() => {
    return enrollments?.filter((e) => {
      const courseId = e.courses?.id;
      if (!courseId) return false;
      const progress = courseProgress[courseId];
      return progress && progress.percentage > 0 && progress.percentage < 100;
    }) || [];
  }, [enrollments, courseProgress]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEnrolled = enrollments?.length || 0;
    const totalCompleted = completedCourses.length;
    const totalLessonsCompleted = allProgress?.filter((p) => p.is_completed).length || 0;
    const totalMinutesWatched = allProgress?.reduce((acc, p) => acc + (p.watched_seconds || 0), 0) || 0;
    const hoursWatched = Math.floor(totalMinutesWatched / 3600);
    
    return {
      totalEnrolled,
      totalCompleted,
      totalLessonsCompleted,
      hoursWatched,
    };
  }, [enrollments, completedCourses, allProgress]);

  const isLoading = enrollmentsLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-muted mb-4" />
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalEnrolled}
              </div>
              <div className="text-sm text-muted-foreground">Enrolled Courses</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalLessonsCompleted}
              </div>
              <div className="text-sm text-muted-foreground">Lessons Completed</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-coin/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-coin" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.hoursWatched}h
              </div>
              <div className="text-sm text-muted-foreground">Hours Watched</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-streak/10 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-streak" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalCompleted}
              </div>
              <div className="text-sm text-muted-foreground">Certificates Earned</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Continue Learning Section */}
      {inProgressCourses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Continue Learning
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inProgressCourses.slice(0, 3).map((enrollment) => {
                  const course = enrollment.courses;
                  if (!course) return null;
                  const progress = courseProgress[course.id];
                  
                  return (
                    <motion.div
                      key={enrollment.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => onCourseClick?.(course.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <GraduationCap className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {course.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={progress?.percentage || 0} className="flex-1 h-2" />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {progress?.percentage || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress?.completed || 0} of {progress?.total || 0} lessons completed
                        </p>
                      </div>
                      
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        Continue
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Enrolled Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Enrolled Courses ({enrollments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!enrollments?.length ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No courses yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by enrolling in a course
                </p>
                <Button>Browse Courses</Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {enrollments.map((enrollment) => {
                    const course = enrollment.courses;
                    if (!course) return null;
                    const progress = courseProgress[course.id];
                    const isCompleted = progress?.percentage === 100;
                    
                    return (
                      <motion.div
                        key={enrollment.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => onCourseClick?.(course.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <GraduationCap className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground truncate">
                              {course.title}
                            </h4>
                            {isCompleted && (
                              <Badge variant="secondary" className="bg-accent/20 text-accent">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {course.instructor_name}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Target className="w-3 h-3" />
                              {progress?.completed || 0}/{progress?.total || 0} lessons
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <span className="text-lg font-bold text-primary">
                              {progress?.percentage || 0}%
                            </span>
                          </div>
                          <Progress 
                            value={progress?.percentage || 0} 
                            className="w-24 h-2" 
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Certificates Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-coin" />
              Certificates ({completedCourses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!completedCourses.length ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No certificates yet
                </h3>
                <p className="text-muted-foreground">
                  Complete a course to earn your first certificate
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedCourses.map((enrollment) => {
                  const course = enrollment.courses;
                  if (!course) return null;
                  
                  return (
                    <motion.div
                      key={enrollment.id}
                      className="relative p-6 rounded-xl border-2 border-coin/30 bg-gradient-to-br from-coin/5 to-transparent overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Certificate Pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                        <Award className="w-full h-full text-coin" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-full bg-coin/20 flex items-center justify-center">
                            <Award className="w-5 h-5 text-coin" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Certificate of Completion
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {enrollment.completed_at 
                                ? new Date(enrollment.completed_at).toLocaleDateString()
                                : 'Recently completed'}
                            </p>
                          </div>
                        </div>
                        
                        <h4 className="font-bold text-foreground text-lg mb-1">
                          {course.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Instructed by {course.instructor_name}
                        </p>
                        
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Certificate
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
