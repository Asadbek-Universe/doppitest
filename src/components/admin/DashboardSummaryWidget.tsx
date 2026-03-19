import { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  Building2,
  Activity,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  UserCheck,
  GraduationCap,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { AdminDataError } from './AdminDataError';

type Props = {
  onNavigateToPending?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToActivity?: () => void;
  onNavigateToCenters?: () => void;
};

export const DashboardSummaryWidget: FC<Props> = ({
  onNavigateToPending,
  onNavigateToUsers,
  onNavigateToActivity,
  onNavigateToCenters,
}) => {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_registered':
        return <UserPlus className="h-3 w-3 text-green-500" />;
      case 'role_assigned':
        return <UserCheck className="h-3 w-3 text-blue-500" />;
      case 'role_removed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'center_verified':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'center_unverified':
        return <XCircle className="h-3 w-3 text-orange-500" />;
      case 'course_created':
        return <GraduationCap className="h-3 w-3 text-purple-500" />;
      case 'test_created':
        return <ClipboardList className="h-3 w-3 text-indigo-500" />;
      default:
        return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      user_registered: 'User Registered',
      role_assigned: 'Role Assigned',
      role_removed: 'Role Removed',
      center_verified: 'Center Verified',
      center_unverified: 'Center Unverified',
      course_created: 'Course Created',
      test_created: 'Test Created',
    };
    return labels[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-40" />
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <AdminDataError
        title="Failed to load dashboard summary"
        message="Unable to fetch today's activity data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* New Users (last 30 days) */}
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">New Users (30d)</h3>
            <p className="mt-1 text-3xl font-bold tracking-tight">{data?.newUsersRange.count ?? 0}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/80">registered in the last 30 days</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <UserPlus className="h-5 w-5 text-green-500" />
          </div>
        </div>
        
        {(data?.newUsersRange.items?.length ?? 0) > 0 ? (
          <ScrollArea className="mt-4 h-[88px]">
            <div className="space-y-1.5">
              {data?.newUsersRange.items.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <span className="truncate max-w-[140px] font-medium">
                    {user.display_name || 'No name'}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground italic">No new users in the last 30 days</p>
        )}

        {onNavigateToUsers && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-between text-xs"
            onClick={onNavigateToUsers}
          >
            View all users
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Pending Verifications */}
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Pending Verifications</h3>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-3xl font-bold tracking-tight">{data?.pendingVerifications.count ?? 0}</p>
              {(data?.pendingVerifications.count ?? 0) > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  Needs attention
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground/80">centers awaiting approval</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
        </div>

        {(data?.pendingVerifications.items?.length ?? 0) > 0 ? (
          <ScrollArea className="mt-4 h-[88px]">
            <div className="space-y-1.5">
              {data?.pendingVerifications.items.map((center) => (
                <div
                  key={center.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[120px] font-medium">{center.name}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(center.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            All centers verified
          </div>
        )}

        {onNavigateToPending && (data?.pendingVerifications.count ?? 0) > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-between text-xs"
            onClick={onNavigateToPending}
          >
            Review pending
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Centers pending onboarding */}
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Pending onboarding</h3>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-3xl font-bold tracking-tight">{data?.centersPendingOnboarding?.count ?? 0}</p>
              {(data?.centersPendingOnboarding?.count ?? 0) > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  Incomplete
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground/80">centers have not completed setup</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <ListTodo className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        {(data?.centersPendingOnboarding?.items?.length ?? 0) > 0 ? (
          <ScrollArea className="mt-4 h-[88px]">
            <div className="space-y-1.5">
              {data?.centersPendingOnboarding?.items?.map((center: { id: string; name: string; created_at: string }) => (
                <div
                  key={center.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <span className="truncate max-w-[140px] font-medium">{center.name || 'Unnamed'}</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(center.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground italic">All centers completed onboarding</p>
        )}
        {onNavigateToCenters && (data?.centersPendingOnboarding?.count ?? 0) > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-between text-xs"
            onClick={onNavigateToCenters}
          >
            View centers
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Recent Activity */}
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
            <div className="mt-2 flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold">{data?.rangeStats.newCourses ?? 0}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <BookOpen className="h-2.5 w-2.5" /> Courses
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{data?.rangeStats.newTests ?? 0}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <FileText className="h-2.5 w-2.5" /> Tests
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{data?.rangeStats.activeAttempts ?? 0}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" /> Active
                </p>
              </div>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
        </div>

        <ScrollArea className="mt-4 h-[72px]">
          <div className="space-y-1.5">
            {data?.recentActivity?.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getActivityIcon(log.action_type)}
                  <span className="truncate max-w-[100px]">
                    {getActivityLabel(log.action_type)}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {onNavigateToActivity && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-between text-xs"
            onClick={onNavigateToActivity}
          >
            View all activity
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
