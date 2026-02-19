import { FC } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Star, Users, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecommendedCourses } from "@/hooks/usePostTestRecommendations";
import { useNavigate } from "react-router-dom";

interface TestResults {
  score: number;
  totalPoints: number;
  percentage: number;
  subjectId?: string | null;
  weakTopics: string[];
  timeSpent: number;
}

interface RecommendedCoursesStepProps {
  results: TestResults;
}

export const RecommendedCoursesStep: FC<RecommendedCoursesStepProps> = ({
  results,
}) => {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useRecommendedCourses(results);

  const handleViewCourse = (courseId: string) => {
    navigate(`/courses?selected=${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Courses Available
        </h3>
        <p className="text-muted-foreground">
          We couldn't find any matching courses at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Recommended Courses
        </h2>
        <p className="text-muted-foreground">
          Strengthen your knowledge with these curated courses
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-5 flex flex-col h-full">
                {/* Thumbnail */}
                {course.thumbnail_url && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {course.subject && (
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: course.subject.color || undefined,
                        color: course.subject.color || undefined,
                      }}
                    >
                      {course.subject.name}
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {course.title}
                </h3>

                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {course.description}
                  </p>
                )}

                {/* Course meta */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons_count || 0} lessons</span>
                  </div>
                  {course.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{Math.round(course.duration_minutes / 60)}h</span>
                    </div>
                  )}
                  {course.rating && course.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Instructor & Center */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      {course.center?.logo_url && (
                        <AvatarImage src={course.center.logo_url} />
                      )}
                      <AvatarFallback className="text-xs">
                        {course.instructor_name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {course.center?.name || course.instructor_name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleViewCourse(course.id)}
                    className="gap-1"
                  >
                    View
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
