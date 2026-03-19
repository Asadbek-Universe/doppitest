import { FC } from 'react';
import { useMyCenter, useMyCenterCourses, useMyCenterTests, useCenterReels, useCenterSubscription } from '@/hooks/useCenterData';
import { CenterProfileTab } from '@/components/center/CenterProfileTab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const CenterProfileSection: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: courses } = useMyCenterCourses(center?.id);
  const { data: tests } = useMyCenterTests(center?.id);
  const { data: reels } = useCenterReels(center?.id);
  const { data: subscription } = useCenterSubscription(center?.id);

  if (centerLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Center profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your center&apos;s public information — separate from your personal account profile.</p>
      </div>
      <CenterProfileTab
        center={center}
        subscription={subscription ?? null}
        coursesCount={courses?.length ?? 0}
        testsCount={tests?.length ?? 0}
        reelsCount={reels?.length ?? 0}
      />
    </div>
  );
};

export default CenterProfileSection;
