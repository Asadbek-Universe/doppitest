import { FC, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  User,
  MapPin,
  Calendar,
  BookOpen,
  FileText,
  Bookmark,
  Activity,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useUserTestAttempts,
  useUserCourseEnrollments,
  useUserSavedItems,
  useUserActivityLogs,
} from '@/hooks/useUserDetails';
import { toast } from 'sonner';

type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  grade: string | null;
  gender: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  onboarding_completed: boolean | null;
};

type UserDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  currentRole: 'admin' | 'center' | 'user';
  onRoleChange: (userId: string, role: 'admin' | 'center' | 'user') => Promise<void>;
};

export const UserDetailsDrawer: FC<UserDetailsDrawerProps> = ({
  open,
  onOpenChange,
  user,
  currentRole,
  onRoleChange,
}) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isChangingRole, setIsChangingRole] = useState(false);

  const { data: testAttempts, isLoading: attemptsLoading } = useUserTestAttempts(user?.user_id ?? null);
  const { data: enrollments, isLoading: enrollmentsLoading } = useUserCourseEnrollments(user?.user_id ?? null);
  const { data: savedItems, isLoading: savedLoading } = useUserSavedItems(user?.user_id ?? null);
  const { data: activityLogs, isLoading: logsLoading } = useUserActivityLogs(user?.user_id ?? null);

  const handleRoleChange = async () => {
    if (!user || selectedRole === currentRole) return;
    setIsChangingRole(true);
    try {
      await onRoleChange(user.user_id, selectedRole);
      toast.success(`Role changed to ${selectedRole}`);
    } catch {
      toast.error('Failed to change role');
    } finally {
      setIsChangingRole(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'center':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_registered':
        return <User className="h-3.5 w-3.5 text-green-500" />;
      case 'role_assigned':
        return <Shield className="h-3.5 w-3.5 text-blue-500" />;
      case 'role_removed':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'test_created':
        return <FileText className="h-3.5 w-3.5 text-purple-500" />;
      case 'course_created':
        return <BookOpen className="h-3.5 w-3.5 text-indigo-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name ?? ''} />
              <AvatarFallback className="text-lg">
                {user.display_name?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl truncate">{user.display_name || 'Unnamed User'}</SheetTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {user.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.city}
                  </span>
                )}
                {user.grade && <Badge variant="outline">{user.grade}</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getRoleBadgeVariant(currentRole)}>{currentRole}</Badge>
                {user.onboarding_completed && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Onboarded
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex items-center gap-2 py-3 border-y bg-muted/30 -mx-6 px-6">
          <span className="text-sm font-medium">Change role:</span>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as typeof selectedRole)}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={selectedRole === currentRole || isChangingRole}
            onClick={handleRoleChange}
          >
            {isChangingRole ? 'Saving...' : 'Apply'}
          </Button>
        </div>

        <Tabs defaultValue="attempts" className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="attempts" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-xs">
              <Bookmark className="h-3.5 w-3.5 mr-1" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              <Activity className="h-3.5 w-3.5 mr-1" />
              Logs
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
            <TabsContent value="attempts" className="mt-0">
              {attemptsLoading ? (
                <LoadingSkeleton count={4} />
              ) : testAttempts?.length === 0 ? (
                <EmptyState message="No test attempts yet" />
              ) : (
                <div className="space-y-3">
                  {testAttempts?.map((attempt) => (
                    <div key={attempt.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{attempt.tests?.title ?? 'Unknown test'}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {attempt.tests?.subjects?.name ?? 'No subject'}
                          </div>
                        </div>
                        <Badge variant={attempt.status === 'completed' ? 'default' : 'secondary'}>
                          {attempt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {attempt.score !== null && (
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {attempt.score}%
                          </span>
                        )}
                        {attempt.correct_answers !== null && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {attempt.correct_answers} correct
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(attempt.started_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              {enrollmentsLoading ? (
                <LoadingSkeleton count={4} />
              ) : enrollments?.length === 0 ? (
                <EmptyState message="No course enrollments" />
              ) : (
                <div className="space-y-3">
                  {enrollments?.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {enrollment.courses?.title ?? 'Unknown course'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {enrollment.courses?.subjects?.name ?? 'No subject'}
                          </div>
                        </div>
                        {enrollment.completed_at ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In progress</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Enrolled {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              {savedLoading ? (
                <LoadingSkeleton count={4} />
              ) : savedItems?.length === 0 ? (
                <EmptyState message="No saved items" />
              ) : (
                <div className="space-y-2">
                  {savedItems?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="rounded-lg bg-muted p-2">
                        {item.item_type === 'test' && <FileText className="h-4 w-4" />}
                        {item.item_type === 'course' && <BookOpen className="h-4 w-4" />}
                        {item.item_type === 'reel' && <GraduationCap className="h-4 w-4" />}
                        {item.item_type === 'center' && <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium capitalize">{item.item_type}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          ID: {item.item_id.slice(0, 8)}...
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              {logsLoading ? (
                <LoadingSkeleton count={6} />
              ) : activityLogs?.length === 0 ? (
                <EmptyState message="No activity logs" />
              ) : (
                <div className="relative">
                  <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-4">
                    {activityLogs?.map((log) => (
                      <div key={log.id} className="flex gap-3 relative">
                        <div className="relative z-10 rounded-full bg-background border p-1.5">
                          {getActivityIcon(log.action_type)}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="text-sm font-medium">
                            {log.action_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                          {log.details && (
                            <div className="text-xs bg-muted rounded px-2 py-1 mt-1 font-mono">
                              {JSON.stringify(log.details, null, 0).slice(0, 80)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
            Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
          </div>
          <div className="font-mono text-[10px] opacity-60">ID: {user.user_id}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

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
      <FileText className="h-6 w-6 text-muted-foreground" />
    </div>
    <div className="text-sm text-muted-foreground">{message}</div>
  </div>
);
