import { FC, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Building2,
  MapPin,
  Calendar,
  BookOpen,
  FileText,
  Video,
  Trophy,
  Users,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  Globe,
  Phone,
  Mail,
  Crown,
  Shield,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  useCenterCourses,
  useCenterTests,
  useCenterReels,
  useCenterOlympiads,
  useCenterAnalyticsSummary,
  useCenterSubscription,
} from '@/hooks/useCenterDetails';
import { toast } from 'sonner';

type Center = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  contact_phone?: string | null;
  website: string | null;
  is_verified: boolean | null;
  followers_count: number;
  student_count: number | null;
  founded_year: number | null;
  specializations: string[] | null;
  created_at: string;
  // New approval fields (optional for backwards compatibility)
  status?: 'pending' | 'approved' | 'rejected' | 'active' | null;
  rejection_reason?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
};

type CenterDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: Center | null;
  onVerifyChange: (centerId: string, verified: boolean) => Promise<void>;
};

export const CenterDetailsDrawer: FC<CenterDetailsDrawerProps> = ({
  open,
  onOpenChange,
  center,
  onVerifyChange,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: courses, isLoading: coursesLoading } = useCenterCourses(center?.id ?? null);
  const { data: tests, isLoading: testsLoading } = useCenterTests(center?.id ?? null);
  const { data: reels, isLoading: reelsLoading } = useCenterReels(center?.id ?? null);
  const { data: olympiads, isLoading: olympiadsLoading } = useCenterOlympiads(center?.id ?? null);
  const { data: analytics } = useCenterAnalyticsSummary(center?.id ?? null);
  const { data: subscription } = useCenterSubscription(center?.id ?? null);

  const handleVerifyToggle = async () => {
    if (!center) return;
    setIsVerifying(true);
    try {
      await onVerifyChange(center.id, !center.is_verified);
      toast.success(center.is_verified ? 'Center unverified' : 'Center verified');
    } catch {
      toast.error('Failed to update verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'default';
      case 'pro':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!center) return null;

  const contentCounts = {
    courses: courses?.length ?? 0,
    tests: tests?.length ?? 0,
    reels: reels?.length ?? 0,
    olympiads: olympiads?.length ?? 0,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-border rounded-xl">
              <AvatarImage src={center.logo_url ?? undefined} alt={center.name} />
              <AvatarFallback className="text-lg rounded-xl">
                {center.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl truncate flex items-center gap-2">
                {center.name}
                {center.is_verified && (
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                )}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {center.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {center.city}
                  </span>
                )}
                {center.founded_year && (
                  <span className="text-xs">Est. {center.founded_year}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={center.is_verified ? 'default' : 'secondary'}>
                  {center.is_verified ? 'Verified' : 'Pending'}
                </Badge>
                {subscription && (
                  <Badge variant={getTierBadgeVariant(subscription.tier)}>
                    <Crown className="h-3 w-3 mr-1" />
                    {subscription.tier}
                  </Badge>
                )}
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {center.followers_count} followers
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex items-center gap-2 py-3 border-y bg-muted/30 -mx-6 px-6">
          <span className="text-sm font-medium">Verification:</span>
          <Button
            size="sm"
            variant={center.is_verified ? 'outline' : 'default'}
            disabled={isVerifying}
            onClick={handleVerifyToggle}
          >
            {isVerifying ? (
              'Updating...'
            ) : center.is_verified ? (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Unverify
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Verify
              </>
            )}
          </Button>
        </div>

        {/* Content counts */}
        <div className="grid grid-cols-4 gap-2 py-4">
          <StatCard icon={BookOpen} label="Courses" value={contentCounts.courses} loading={coursesLoading} />
          <StatCard icon={FileText} label="Tests" value={contentCounts.tests} loading={testsLoading} />
          <StatCard icon={Video} label="Reels" value={contentCounts.reels} loading={reelsLoading} />
          <StatCard icon={Trophy} label="Olympiads" value={contentCounts.olympiads} loading={olympiadsLoading} />
        </div>

        {/* Analytics summary */}
        {analytics && (
          <div className="grid grid-cols-3 gap-2 pb-4">
            <div className="rounded-lg border p-2 text-center">
              <div className="text-lg font-semibold">{analytics.totals.profile_views}</div>
              <div className="text-xs text-muted-foreground">Profile views</div>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <div className="text-lg font-semibold">{analytics.totals.enrollments}</div>
              <div className="text-xs text-muted-foreground">Enrollments</div>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <div className="text-lg font-semibold">{analytics.totals.test_completions}</div>
              <div className="text-xs text-muted-foreground">Completions</div>
            </div>
          </div>
        )}

        <Tabs defaultValue="courses" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="courses" className="text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="reels" className="text-xs">
              <Video className="h-3.5 w-3.5 mr-1" />
              Reels
            </TabsTrigger>
            <TabsTrigger value="olympiads" className="text-xs">
              <Trophy className="h-3.5 w-3.5 mr-1" />
              Olympiads
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
            <TabsContent value="courses" className="mt-0">
              {coursesLoading ? (
                <LoadingSkeleton count={4} />
              ) : courses?.length === 0 ? (
                <EmptyState message="No courses yet" />
              ) : (
                <div className="space-y-3">
                  {courses?.map((course) => (
                    <div key={course.id} className="rounded-lg border p-3">
                      <div className="font-medium truncate">{course.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {course.subjects?.name ?? 'No subject'}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.students_count ?? 0} students
                        </span>
                        {course.rating && (
                          <span>⭐ {course.rating.toFixed(1)}</span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tests" className="mt-0">
              {testsLoading ? (
                <LoadingSkeleton count={4} />
              ) : tests?.length === 0 ? (
                <EmptyState message="No tests yet" />
              ) : (
                <div className="space-y-3">
                  {tests?.map((test) => (
                    <div key={test.id} className="rounded-lg border p-3">
                      <div className="font-medium truncate">{test.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {test.subjects?.name ?? 'No subject'}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {test.completions ?? 0} completions
                        </span>
                        {test.rating && (
                          <span>⭐ {test.rating.toFixed(1)}</span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reels" className="mt-0">
              {reelsLoading ? (
                <LoadingSkeleton count={4} />
              ) : reels?.length === 0 ? (
                <EmptyState message="No reels yet" />
              ) : (
                <div className="space-y-3">
                  {reels?.map((reel) => (
                    <div key={reel.id} className="rounded-lg border p-3">
                      <div className="font-medium truncate">{reel.title}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {reel.views_count} views
                        </span>
                        <span>❤️ {reel.likes_count}</span>
                        <span>
                          {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="olympiads" className="mt-0">
              {olympiadsLoading ? (
                <LoadingSkeleton count={4} />
              ) : olympiads?.length === 0 ? (
                <EmptyState message="No olympiads yet" />
              ) : (
                <div className="space-y-3">
                  {olympiads?.map((olympiad) => (
                    <div key={olympiad.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium truncate">{olympiad.title}</div>
                        <Badge variant={olympiad.status === 'active' ? 'default' : 'secondary'}>
                          {olympiad.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {olympiad.current_participants ?? 0} participants
                        </span>
                        <span>
                          {format(new Date(olympiad.start_date), 'MMM d')} - {format(new Date(olympiad.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <Separator className="my-4" />
        
        {/* Contact info */}
        <div className="space-y-2 text-sm">
          {center.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {center.email}
            </div>
          )}
          {center.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {center.phone}
            </div>
          )}
          {center.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <a href={center.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                {center.website}
              </a>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Joined {format(new Date(center.created_at), 'MMM d, yyyy')}
          </div>
          <div className="font-mono text-[10px] opacity-60">ID: {center.id}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const StatCard: FC<{ icon: typeof BookOpen; label: string; value: number; loading: boolean }> = ({
  icon: Icon,
  label,
  value,
  loading,
}) => (
  <Card className="p-0">
    <CardContent className="p-2 text-center">
      {loading ? (
        <Skeleton className="h-6 w-8 mx-auto" />
      ) : (
        <div className="text-lg font-semibold">{value}</div>
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
      <Building2 className="h-6 w-6 text-muted-foreground" />
    </div>
    <div className="text-sm text-muted-foreground">{message}</div>
  </div>
);
