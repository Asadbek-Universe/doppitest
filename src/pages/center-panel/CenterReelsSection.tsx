import { FC } from 'react';
import { useMyCenter, useCenterReels, useCenterSubscription } from '@/hooks/useCenterData';
import { useSubjects } from '@/hooks/useCourses';
import { CenterReelsTab } from '@/components/center/CenterReelsTab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const CenterReelsSection: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: reels, isLoading: reelsLoading, isError: reelsError, refetch: refetchReels } = useCenterReels(center?.id);
  const { data: subscription } = useCenterSubscription(center?.id);
  const { data: subjects } = useSubjects();

  if (centerLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (reelsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Videos (Reels)</h1>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load videos</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchReels()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Videos (Reels)</h1>
        <p className="text-muted-foreground">Upload short videos. Draft reels are hidden from the user feed.</p>
      </div>
      <CenterReelsTab
        centerId={center.id}
        reels={reelsLoading ? [] : (reels ?? [])}
        subjects={subjects ?? []}
        maxReels={subscription?.max_videos ?? 10}
      />
    </div>
  );
};

export default CenterReelsSection;
