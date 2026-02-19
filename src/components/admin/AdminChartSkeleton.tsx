import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminChartSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="h-[280px]">
            <div className="flex h-full flex-col justify-end gap-1">
              {/* Simulated bar chart skeleton */}
              <div className="flex items-end gap-2 h-[220px]">
                {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 65].map((h, idx) => (
                  <Skeleton
                    key={idx}
                    className="flex-1 rounded-t-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between pt-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-3 w-8" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
