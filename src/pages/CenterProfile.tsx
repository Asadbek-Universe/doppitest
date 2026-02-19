import { FC, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  ArrowLeft,
  Play,
  Trophy,
  Calendar,
  Video,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  usePublicCenter,
  usePublicCenterCourses,
  usePublicCenterTests,
  usePublicCenterReviews,
  usePublicCenterReels,
  usePublicCenterOlympiads,
} from '@/hooks/usePublicCenter';
import { useEnrollCourse, useEnrollmentStatus } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const CenterProfile: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [enrollingCourse, setEnrollingCourse] = useState<{ id: string; title: string } | null>(null);
  
  const { data: center, isLoading: centerLoading } = usePublicCenter(id);
  const { data: courses } = usePublicCenterCourses(id);
  const { data: tests } = usePublicCenterTests(id);
  const { data: reviews } = usePublicCenterReviews(id);
  const { data: reels } = usePublicCenterReels(id);
  const { data: olympiads } = usePublicCenterOlympiads(id);
  
  const enrollMutation = useEnrollCourse();

  const handleEnrollClick = (course: { id: string; title: string }) => {
    if (!user) {
      toast.error('Please sign in to enroll in courses');
      return;
    }
    setEnrollingCourse(course);
  };

  // Course card with enrollment button
  const CourseEnrollCard: FC<{
    course: NonNullable<typeof courses>[number];
    index: number;
    userId?: string;
    onEnrollClick: (course: { id: string; title: string }) => void;
  }> = ({ course, index, userId, onEnrollClick }) => {
    const { data: enrollment, isLoading: enrollmentLoading } = useEnrollmentStatus(course.id, userId);
    const isEnrolled = !!enrollment;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="hover:shadow-lg transition-shadow group overflow-hidden">
          <div className="relative h-32 bg-muted overflow-hidden">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary/50" />
              </div>
            )}
            {course.is_free && (
              <Badge className="absolute top-2 right-2 bg-green-500">Free</Badge>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold line-clamp-1 mb-1 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            {course.subjects?.name && (
              <Badge variant="secondary" className="mb-2 text-xs">
                {course.subjects.name}
              </Badge>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {course.students_count ?? 0}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500" />
                {course.rating?.toFixed(1) ?? '-'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.duration_minutes ?? 0} min
              </div>
            </div>
            {isEnrolled ? (
              <Link to={`/courses/${course.id}`}>
                <Button size="sm" className="w-full" variant="secondary">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Continue Learning
                </Button>
              </Link>
            ) : (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onEnrollClick({ id: course.id, title: course.title })}
                disabled={enrollmentLoading}
              >
                Enroll Now
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const handleConfirmEnroll = async () => {
    if (!enrollingCourse || !user) return;
    
    try {
      await enrollMutation.mutateAsync({
        courseId: enrollingCourse.id,
        userId: user.id,
      });
      toast.success(`Successfully enrolled in "${enrollingCourse.title}"`);
      setEnrollingCourse(null);
    } catch (error) {
      toast.error('Failed to enroll. Please try again.');
    }
  };

  // Calculate average rating from reviews
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const totalStudents = courses?.reduce((sum, c) => sum + (c.students_count ?? 0), 0) ?? 0;

  if (centerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Center Not Found</h1>
            <p className="text-muted-foreground mb-6">The center you're looking for doesn't exist.</p>
            <Link to="/centers">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Centers
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/5">
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
          {/* Center Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo */}
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-card border-4 border-background shadow-xl overflow-hidden flex-shrink-0">
                {center.logo_url ? (
                  <img src={center.logo_url} alt={center.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-primary-foreground">
                      {center.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{center.name}</h1>
                  {center.is_verified && (
                    <Badge className="bg-green-500/10 text-green-600 gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                {center.city && (
                  <div className="flex items-center gap-1 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{center.city}{center.address && `, ${center.address}`}</span>
                  </div>
                )}

                {center.description && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">{center.description}</p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold">{averageRating}</span>
                    <span className="text-muted-foreground">({reviews?.length ?? 0} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{totalStudents.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{courses?.length ?? 0} courses</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>{tests?.length ?? 0} tests</span>
                  </div>
                </div>
              </div>

              {/* Contact Button */}
              <div className="flex gap-2 flex-shrink-0">
                <Button>Contact Center</Button>
              </div>
            </div>
          </motion.div>

          {/* Content Tabs */}
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="olympiads">Olympiads</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses">
              {courses && courses.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course, index) => (
                    <CourseEnrollCard 
                      key={course.id}
                      course={course}
                      index={index}
                      userId={user?.id}
                      onEnrollClick={handleEnrollClick}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Courses Yet</h3>
                    <p className="text-muted-foreground">This center hasn't published any courses yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="tests">
              {tests && tests.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tests.map((test, index) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            {test.is_free && (
                              <Badge className="bg-green-500">Free</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold line-clamp-1 mb-1">{test.title}</h3>
                          {test.subjects?.name && (
                            <Badge variant="secondary" className="mb-3 text-xs">
                              {test.subjects.name}
                            </Badge>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{test.questions_count} questions</span>
                            <span>{test.duration_minutes} min</span>
                            <span>{test.completions ?? 0} taken</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Tests Yet</h3>
                    <p className="text-muted-foreground">This center hasn't published any tests yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Rating Summary */}
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-5xl font-bold mb-2">{averageRating}</div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(parseFloat(averageRating))
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm">{reviews?.length ?? 0} reviews</p>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="md:col-span-2 space-y-4">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarImage src={(review.profiles as { avatar_url?: string })?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {((review.profiles as { display_name?: string })?.display_name || 'U').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">
                                    {(review.profiles as { display_name?: string })?.display_name || 'Anonymous'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    for {(review.courses as { title?: string })?.title}
                                  </span>
                                </div>
                                {review.review_text && (
                                  <p className="text-sm text-muted-foreground">{review.review_text}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                        <p className="text-muted-foreground">Be the first to leave a review!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              {reels && reels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {reels.map((reel, index) => (
                    <motion.div
                      key={reel.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative rounded-xl overflow-hidden bg-muted aspect-[9/16] cursor-pointer"
                    >
                      {reel.thumbnail_url ? (
                        <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <h4 className="font-medium text-sm line-clamp-2">{reel.title}</h4>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span>{reel.views_count} views</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Videos Yet</h3>
                    <p className="text-muted-foreground">This center hasn't posted any videos yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Olympiads Tab */}
            <TabsContent value="olympiads">
              {olympiads && olympiads.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {olympiads.map((olympiad, index) => (
                    <motion.div
                      key={olympiad.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/10">
                              <Trophy className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{olympiad.title}</h3>
                              {olympiad.subjects?.name && (
                                <Badge variant="secondary" className="mb-2 text-xs">
                                  {olympiad.subjects.name}
                                </Badge>
                              )}
                              {olympiad.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {olympiad.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(olympiad.start_date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {olympiad.current_participants}
                                  {olympiad.max_participants && ` / ${olympiad.max_participants}`}
                                </div>
                              </div>
                            </div>
                            <Button size="sm">Register</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Olympiads</h3>
                    <p className="text-muted-foreground">No upcoming olympiads from this center.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {center.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Address</p>
                          <p className="text-muted-foreground">{center.address}</p>
                          {center.city && <p className="text-muted-foreground">{center.city}</p>}
                        </div>
                      </div>
                    )}
                    {center.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <a href={`tel:${center.phone}`} className="text-muted-foreground hover:text-primary">
                            {center.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {center.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Email</p>
                          <a href={`mailto:${center.email}`} className="text-muted-foreground hover:text-primary">
                            {center.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {center.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Website</p>
                          <a
                            href={center.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            {center.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {!center.address && !center.phone && !center.email && !center.website && (
                      <p className="text-muted-foreground">No contact information available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Send a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Your Name</label>
                        <input
                          type="text"
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <input
                          type="email"
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Message</label>
                        <textarea
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-[100px]"
                          placeholder="Your message..."
                        />
                      </div>
                      <Button className="w-full">Send Message</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={!!enrollingCourse} onOpenChange={(open) => !open && setEnrollingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in Course</DialogTitle>
            <DialogDescription>
              You're about to enroll in "{enrollingCourse?.title}". Once enrolled, you'll have full access to all course materials.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEnrollingCourse(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmEnroll}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CenterProfile;