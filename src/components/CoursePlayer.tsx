import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Users,
  BookOpen,
  Clock,
  Play,
  Heart,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Target,
  AlertCircle,
  ThumbsUp,
  MessageCircle,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCourse, useLessons, useCourseReviews } from "@/hooks/useCourses";

interface CoursePlayerProps {
  courseId: string;
  onBack: () => void;
}

export const CoursePlayer: FC<CoursePlayerProps> = ({ courseId, onBack }) => {
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: lessonsData, isLoading: lessonsLoading } = useLessons(courseId);
  const { data: reviews } = useCourseReviews(courseId);

  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(["Introduction"]);
  const [activeTab, setActiveTab] = useState("overview");

  if (courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const sections = lessonsData?.sections || {};
  const lessons = lessonsData?.lessons || [];
  const completedLessons = 1; // Would come from user progress
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // Calculate rating distribution
  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews?.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating - 1]++;
    }
  });
  const totalReviews = reviews?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <section
        className="relative pt-16 pb-8"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)/0.8) 0%, hsl(var(--primary)/0.4) 50%, hsl(200 80% 70% / 0.6) 100%)",
        }}
      >
        <div className="container px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
            <button onClick={onBack} className="hover:text-white">
              Home
            </button>
            <span>/</span>
            <button onClick={onBack} className="hover:text-white">
              Courses
            </button>
            <span>/</span>
            <span className="font-medium text-white">
              {course.subjects?.name}
            </span>
            <span>/</span>
            <span className="font-semibold text-white">{course.title}</span>
          </div>

          {/* Course Title */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {course.title}
          </motion.h1>

          {/* Description */}
          <p className="text-white/90 text-lg mb-6 max-w-3xl">
            {course.description}
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-6 text-white mb-6 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{course.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-5 h-5" />
              <span>{(course.students_count / 1000).toFixed(1)}k Students</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-5 h-5" />
              <span>{course.lessons_count} Lessons</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-5 h-5" />
              <span>{formatDuration(course.duration_minutes)}</span>
            </div>
          </div>

          {/* Instructor Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={course.instructor_avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {course.instructor_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-semibold">Instructor</p>
                <p className="text-white/80 text-sm">{course.instructor_bio}</p>
              </div>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Follow
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Continue Learning
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Curriculum */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Curriculum
                </h2>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">
                      {completedLessons} of {totalLessons}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                {/* Sections */}
                <div className="space-y-2">
                  {Object.entries(sections).map(([sectionName, sectionLessons]) => (
                    <Collapsible
                      key={sectionName}
                      open={openSections.includes(sectionName)}
                      onOpenChange={() => toggleSection(sectionName)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <span className="font-medium text-foreground">
                            {sectionName}
                          </span>
                          {openSections.includes(sectionName) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-1">
                          {(sectionLessons as any[]).map((lesson, index) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLesson(lesson.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                                selectedLesson === lesson.id
                                  ? "bg-primary/10 border border-primary/30"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              {index === 0 ? (
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.duration_minutes}:00
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Video and Tabs */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {/* Video Player Placeholder */}
            <Card className="mb-6 overflow-hidden">
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
                <button className="relative z-10 w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </button>
              </div>
            </Card>

            {/* Lesson Info Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {lessons[0]?.title || "Select a lesson"}
                </h2>
                <p className="text-muted-foreground">
                  {lessons[0]?.description || "Choose a lesson from the curriculum"}
                </p>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="lessons">Lessons</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6 space-y-6">
                    {/* About this course */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          About this course
                        </h3>
                      </div>
                      <p className="text-muted-foreground">{course.description}</p>
                    </div>

                    {/* What You'll Learn */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          What You'll Learn
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {(course.learning_outcomes || []).map((outcome: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Requirements */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          Requirements
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {(course.requirements || []).map((req: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(course.tags || []).map((tag: string, i: number) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-primary border-primary/30"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="lessons" className="mt-6">
                    <div className="space-y-3">
                      {lessons.map((lesson, index) => (
                        <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">
                                {lesson.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {lesson.description}
                              </p>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {lesson.duration_minutes} min
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No notes yet. Start taking notes while watching lessons!</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card
              className="mb-6"
              style={{
                background:
                  "linear-gradient(135deg, hsl(260 80% 60%) 0%, hsl(220 80% 60%) 100%)",
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">
                    AI Recommendations
                  </h3>
                </div>
                <p className="text-white/80 mb-4">
                  Based on your progress, we recommend these tests
                </p>
                <Button
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Chemistry Final Exam
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Student Reviews */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-primary mb-6">
                  Student Reviews & Ratings
                </h2>

                {/* Rating Summary */}
                <div className="bg-primary/5 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Average Rating */}
                    <div className="text-center">
                      <div className="text-5xl font-bold text-foreground mb-2">
                        {course.rating?.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(course.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground">
                        Based on {totalReviews} reviews
                      </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingDistribution[rating - 1];
                        const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground w-8">
                              {rating}
                              <Star className="w-3 h-3 inline ml-0.5 text-yellow-400 fill-yellow-400" />
                            </span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {percent.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground">
                                  User
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground/30"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <button className="flex items-center gap-1 hover:text-primary">
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-sm">{review.likes_count}</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-primary">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm">Reply</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.review_text}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
