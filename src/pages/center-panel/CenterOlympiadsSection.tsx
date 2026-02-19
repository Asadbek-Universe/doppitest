import { FC } from 'react';
import { useMyCenter, useCenterOlympiads, useCenterSubscription } from '@/hooks/useCenterData';
import { useSubjects } from '@/hooks/useCourses';
import { CenterOlympiadsTab } from '@/components/center/CenterOlympiadsTab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const CenterOlympiadsSection: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: olympiads, isLoading: olympiadsLoading, isError: olympiadsError, refetch: refetchOlympiads } = useCenterOlympiads(center?.id);
  const { data: subscription } = useCenterSubscription(center?.id);
  const { data: subjects } = useSubjects();

  if (centerLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (olympiadsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Olympiads</h1>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load olympiads</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchOlympiads()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olympiads</h1>
        <p className="text-muted-foreground">Create and manage olympiads. Submit for admin approval to publish.</p>
      </div>
      <CenterOlympiadsTab
        centerId={center.id}
        olympiads={olympiadsLoading ? [] : (olympiads ?? []).map((o) => ({ ...o, current_participants: o.current_participants ?? 0 }))}
        subjects={subjects ?? []}
        canCreate={subscription?.can_create_olympiads ?? false}
      />
    </div>
  );
};

export default CenterOlympiadsSection;
