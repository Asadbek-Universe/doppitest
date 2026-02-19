import { FC } from 'react';
import { useMyCenter, useCenterSeoSettings, useCenterSubscription } from '@/hooks/useCenterData';
import { CenterSeoTab } from '@/components/center/CenterSeoTab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const CenterSeoSection: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: seoSettings, isLoading: seoLoading, isError: seoError, refetch: refetchSeo } = useCenterSeoSettings(center?.id);
  const { data: subscription } = useCenterSubscription(center?.id);

  if (centerLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (seoError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">SEO</h1>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load SEO settings</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchSeo()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CenterSeoTab
      centerId={center.id}
      seoSettings={seoLoading ? null : seoSettings ?? null}
      subscription={subscription ? { seo_boost_level: subscription.seo_boost_level } : null}
    />
  );
};

export default CenterSeoSection;
