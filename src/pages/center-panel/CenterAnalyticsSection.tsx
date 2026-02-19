import { FC } from 'react';
import { useMyCenter, useMyCenterCourses, useMyCenterTests, useMyCenterEnrollments, useCenterAnalytics } from '@/hooks/useCenterData';
import { CenterAnalyticsTab } from '@/components/center/CenterAnalyticsTab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const CenterAnalyticsSection: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = useCenterAnalytics(center?.id, 30);
  const { data: courses } = useMyCenterCourses(center?.id);
  const { data: tests } = useMyCenterTests(center?.id);
  const { data: enrollments } = useMyCenterEnrollments(center?.id);

  if (centerLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load analytics</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchAnalytics()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CenterAnalyticsTab
      analytics={analyticsLoading ? [] : (analytics ?? [])}
      coursesCount={courses?.length ?? 0}
      testsCount={tests?.length ?? 0}
      studentsCount={enrollments?.length ?? 0}
    />
  );
};

export default CenterAnalyticsSection;
