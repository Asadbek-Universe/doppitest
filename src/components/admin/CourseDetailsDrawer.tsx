import { FC } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Calendar,
  DollarSign,
  Gift,
  PlayCircle,
  FileText,
  CheckCircle,
  User,
  Layers,
  TrendingUp,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLessons, useCourseReviews } from '@/hooks/useCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Subject {
  id?: string;
  name: string;
  color?: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  instructor_avatar?: string | null;
  instructor_bio?: string | null;
  thumbnail_url: string | null;
  students_count: number | null;
  rating: number | null;
  duration_minutes: number | null;
  lessons_count: number | null;
  is_free: boolean | null;
  price: number | null;
  created_at: string;
  subjects: Subject | null;
  learning_outcomes?: string[] | null;
  requirements?: string[] | null;
  tags?: string[] | null;
}

interface CourseDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

// Hook to fetch enrollment stats
const useEnrollmentStats = (courseId: string | null) => {
  return useQuery({
    queryKey: ['admin-enrollment-stats', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('enrolled_at, completed_at')
        .eq('course_id', courseId);

      if (error) throw error;

      const total = enrollments?.length || 0;
      const completed = enrollments?.filter(e => e.completed_at)?.length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get enrollments by month (last 6 months)
      const now = new Date();
      const monthlyData: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = format(monthDate, 'MMM');
        const monthStart = monthDate.toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString();
        
        const count = enrollments?.filter(e => {
          const enrolledAt = new Date(e.enrolled_at);
          return enrolledAt >= new Date(monthStart) && enrolledAt <= new Date(monthEnd);
        }).length || 0;
        
        monthlyData.push({ month: monthName, count });
      }

      return { total, completed, completionRate, monthlyData };
    },
    enabled: !!courseId,
  });
};

export const CourseDetailsDrawer: FC<CourseDetailsDrawerProps> = ({
  open,
  onOpenChange,
  course,
}) => {
  const { data: lessonsData, isLoading: lessonsLoading } = useLessons(course?.id ?? '');
  const { data: reviews, isLoading: reviewsLoading } = useCourseReviews(course?.id ?? '');
  const { data: enrollmentStats, isLoading: statsLoading } = useEnrollmentStats(course?.id ?? null);

  if (!course) return null;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sections = lessonsData?.sections || {};
  const sectionNames = Object.keys(sections);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-border rounded-xl">
              <AvatarImage src={course.thumbnail_url ?? undefined} alt={course.title} className="object-cover" />
              <AvatarFallback className="text-lg rounded-xl bg-primary/10 text-primary">
                {getInitials(course.title)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl leading-tight line-clamp-2">
                {course.title}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>{course.instructor_name}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {course.is_free ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    <Gift className="h-3 w-3 mr-1" />
                    Free
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {course.price?.toLocaleString() || 'Paid'}
                  </Badge>
                )}
                {course.subjects && (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${course.subjects.color}15`,
                      borderColor: `${course.subjects.color}30`,
                      color: course.subjects.color || undefined,
                    }}
                  >
                    {course.subjects.name}
                  </Badge>
                )}
                {course.rating && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {course.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 py-4">
          <StatCard icon={Users} label="Students" value={course.students_count || 0} />
          <StatCard icon={PlayCircle} label="Lessons" value={lessonsData?.lessons?.length || course.lessons_count || 0} loading={lessonsLoading} />
          <StatCard icon={Clock} label="Duration" value={formatDuration(course.duration_minutes)} isText />
          <StatCard icon={FileText} label="Reviews" value={reviews?.length || 0} loading={reviewsLoading} />
        </div>

        {/* Enrollment Stats */}
        {!statsLoading && enrollmentStats && (
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Completion Rate
              </span>
              <span className="text-sm font-bold text-primary">{enrollmentStats.completionRate}%</span>
            </div>
            <Progress value={enrollmentStats.completionRate} className="h-2" />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{enrollmentStats.completed} completed</span>
              <span>{enrollmentStats.total} total enrolled</span>
            </div>
          </div>
        )}

        <Tabs defaultValue="lessons" className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="lessons" className="text-xs">
              <Layers className="h-3.5 w-3.5 mr-1" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">
              <Star className="h-3.5 w-3.5 mr-1" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Details
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
            <TabsContent value="lessons" className="mt-0">
              {lessonsLoading ? (
                <LoadingSkeleton count={4} />
              ) : sectionNames.length === 0 ? (
                <EmptyState message="No lessons yet" />
              ) : (
                <div className="space-y-4">
                  {sectionNames.map((sectionName, sectionIdx) => (
                    <div key={sectionName} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {sectionIdx + 1}
                        </div>
                        <h4 className="font-medium text-sm">{sectionName}</h4>
                        <span className="text-xs text-muted-foreground">
                          ({sections[sectionName].length} lessons)
                        </span>
                      </div>
                      <div className="ml-3 border-l-2 border-border pl-4 space-y-2">
                        {sections[sectionName].map((lesson, lessonIdx) => (
                          <div
                            key={lesson.id}
                            className="rounded-lg border p-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                              {lessonIdx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{lesson.title}</div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                {lesson.duration_minutes && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {lesson.duration_minutes}m
                                  </span>
                                )}
                                {lesson.is_free && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-500/10 text-green-700 border-green-200">
                                    Free Preview
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {lesson.video_url && (
                              <PlayCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              {reviewsLoading ? (
                <LoadingSkeleton count={4} />
              ) : !reviews?.length ? (
                <EmptyState message="No reviews yet" />
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {review.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-0 space-y-4">
              {course.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                </div>
              )}

              {course.learning_outcomes && course.learning_outcomes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">What you'll learn</h4>
                  <ul className="space-y-1.5">
                    {course.learning_outcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.requirements && course.requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="space-y-1.5">
                    {course.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-2" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.tags && course.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {course.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {course.instructor_bio && (
                <div>
                  <h4 className="text-sm font-medium mb-2">About the Instructor</h4>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={course.instructor_avatar ?? undefined} />
                      <AvatarFallback>{getInitials(course.instructor_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{course.instructor_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{course.instructor_bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <Separator className="my-4" />
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created {format(new Date(course.created_at), 'MMM d, yyyy')}
          </div>
          <div className="font-mono text-[10px] opacity-60">ID: {course.id}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const StatCard: FC<{
  icon: typeof BookOpen;
  label: string;
  value: number | string;
  loading?: boolean;
  isText?: boolean;
}> = ({ icon: Icon, label, value, loading, isText }) => (
  <Card className="p-0">
    <CardContent className="p-2 text-center">
      {loading ? (
        <Skeleton className="h-6 w-8 mx-auto" />
      ) : (
        <div className={`font-semibold ${isText ? 'text-sm' : 'text-lg'}`}>{value}</div>
      )}
      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
    </CardContent>
  </Card>
);

const LoadingSkeleton: FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-16 rounded-lg" />
    ))}
  </div>
);

const EmptyState: FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-muted p-4 mb-3">
      <BookOpen className="h-6 w-6 text-muted-foreground" />
    </div>
    <div className="text-sm text-muted-foreground">{message}</div>
  </div>
);
