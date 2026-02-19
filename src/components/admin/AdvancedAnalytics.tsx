import { FC, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Download,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Activity,
  CheckCircle,
  BookOpen,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdvancedAnalytics,
  useHealthMetrics,
  type AggregationPeriod,
  type GroupBy,
} from '@/hooks/useAdvancedAnalytics';

type AdvancedAnalyticsProps = {
  from: Date;
  to: Date;
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(221 83% 53%)',
  'hsl(142 71% 45%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
];

export const AdvancedAnalytics: FC<AdvancedAnalyticsProps> = ({ from, to }) => {
  const [aggregation, setAggregation] = useState<AggregationPeriod>('daily');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const { data: analyticsData, isLoading: analyticsLoading } = useAdvancedAnalytics({
    from,
    to,
    aggregation,
    groupBy,
  });

  const { data: healthData, isLoading: healthLoading } = useHealthMetrics({ from, to });

  // Transform data for charts when grouping
  const chartData = useMemo(() => {
    if (!analyticsData) return [];

    if (groupBy === 'none') {
      // Aggregate all groups into single line
      const byPeriod = new Map<string, { period: string; attempts: number; enrollments: number }>();
      for (const point of analyticsData.timeseries) {
        if (!byPeriod.has(point.period)) {
          byPeriod.set(point.period, { period: point.period, attempts: 0, enrollments: 0 });
        }
        const p = byPeriod.get(point.period)!;
        p.attempts += point.attempts;
        p.enrollments += point.enrollments;
      }
      return Array.from(byPeriod.values());
    }

    // Pivot data for grouped view
    const byPeriod = new Map<string, Record<string, string | number>>();
    for (const point of analyticsData.timeseries) {
      if (!byPeriod.has(point.period)) {
        byPeriod.set(point.period, { period: point.period });
      }
      const p = byPeriod.get(point.period)!;
      p[`${point.group}_attempts`] = ((p[`${point.group}_attempts`] as number) || 0) + point.attempts;
      p[`${point.group}_enrollments`] =
        ((p[`${point.group}_enrollments`] as number) || 0) + point.enrollments;
    }
    return Array.from(byPeriod.values());
  }, [analyticsData, groupBy]);

  const exportCSV = () => {
    if (!analyticsData) return;

    const headers = ['Period', 'Group', 'Attempts', 'Completed Attempts', 'Enrollments', 'Completed Enrollments'];
    const rows = analyticsData.timeseries.map((row) => [
      row.period,
      row.group,
      row.attempts,
      row.completedAttempts,
      row.enrollments,
      row.completedEnrollments,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${from.toISOString().split('T')[0]}_${to.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Analytics
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={aggregation} onValueChange={(v) => setAggregation(v as AggregationPeriod)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Group by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No grouping</SelectItem>
                  <SelectItem value="subject">By Subject</SelectItem>
                  <SelectItem value="center">By Center</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!analyticsData}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : groupBy === 'none' ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attemptsFillAdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="enrollmentsFillAdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tickMargin={8} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="attempts"
                    name="Test Attempts"
                    stroke="hsl(var(--primary))"
                    fill="url(#attemptsFillAdv)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="enrollments"
                    name="Enrollments"
                    stroke="hsl(var(--accent))"
                    fill="url(#enrollmentsFillAdv)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tickMargin={8} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  {analyticsData?.groups.slice(0, 6).map((group, idx) => (
                    <Bar
                      key={group}
                      dataKey={`${group}_attempts`}
                      name={`${group} attempts`}
                      fill={COLORS[idx % COLORS.length]}
                      stackId="attempts"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Group legend */}
          {groupBy !== 'none' && analyticsData && (
            <div className="flex flex-wrap gap-2 mt-4">
              {analyticsData.groups.slice(0, 6).map((group, idx) => (
                <Badge
                  key={group}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: COLORS[idx % COLORS.length] }}
                >
                  {group}
                </Badge>
              ))}
              {analyticsData.groups.length > 6 && (
                <Badge variant="secondary" className="text-xs">
                  +{analyticsData.groups.length - 6} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : healthData ? (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Retention Rate */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Retention Rate</span>
                  </div>
                  <span className="text-2xl font-bold">{healthData.retentionRate}%</span>
                </div>
                <Progress value={healthData.retentionRate} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Users who returned in the second half of the period
                </p>
              </div>

              {/* Test Completion Rate */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Test Completion</span>
                  </div>
                  <span className="text-2xl font-bold">{healthData.testCompletionRate}%</span>
                </div>
                <Progress value={healthData.testCompletionRate} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {healthData.completedAttempts} of {healthData.totalAttempts} attempts completed
                </p>
              </div>

              {/* Course Completion Rate */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Course Completion</span>
                  </div>
                  <span className="text-2xl font-bold">{healthData.courseCompletionRate}%</span>
                </div>
                <Progress value={healthData.courseCompletionRate} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {healthData.completedEnrollments} of {healthData.totalEnrollments} enrollments completed
                </p>
              </div>
            </div>
          ) : null}

          {/* Summary stats */}
          {healthData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{healthData.totalUsers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{healthData.activeUsersInPeriod.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Active in Period</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{healthData.totalAttempts.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Test Attempts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{healthData.totalEnrollments.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Enrollments</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
