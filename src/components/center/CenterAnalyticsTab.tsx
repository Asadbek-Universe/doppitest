import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Users, CheckCircle, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  date: string;
  profile_views: number;
  course_views: number;
  test_views: number;
  video_views: number;
  enrollments: number;
  test_completions: number;
  revenue: number;
}

interface CenterAnalyticsTabProps {
  analytics: AnalyticsData[];
  coursesCount: number;
  testsCount: number;
  studentsCount: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export const CenterAnalyticsTab: FC<CenterAnalyticsTabProps> = ({
  analytics,
  coursesCount,
  testsCount,
  studentsCount,
}) => {
  const [period, setPeriod] = useState('7d');

  // Calculate totals
  const totals = analytics.reduce(
    (acc, day) => ({
      profileViews: acc.profileViews + day.profile_views,
      courseViews: acc.courseViews + day.course_views,
      testViews: acc.testViews + day.test_views,
      videoViews: acc.videoViews + day.video_views,
      enrollments: acc.enrollments + day.enrollments,
      testCompletions: acc.testCompletions + day.test_completions,
      revenue: acc.revenue + day.revenue,
    }),
    { profileViews: 0, courseViews: 0, testViews: 0, videoViews: 0, enrollments: 0, testCompletions: 0, revenue: 0 }
  );

  // Calculate conversion rates
  const enrollmentRate = totals.courseViews > 0 ? ((totals.enrollments / totals.courseViews) * 100).toFixed(1) : '0';
  const completionRate = totals.testViews > 0 ? ((totals.testCompletions / totals.testViews) * 100).toFixed(1) : '0';

  const statCards = [
    { label: 'Profile Views', value: totals.profileViews, icon: Eye, change: '+12%' },
    { label: 'Enrollments', value: totals.enrollments, icon: Users, change: '+8%' },
    { label: 'Test Completions', value: totals.testCompletions, icon: CheckCircle, change: '+15%' },
    { label: 'Revenue', value: `${totals.revenue.toLocaleString()} UZS`, icon: DollarSign, change: '+5%' },
  ];

  // Chart data formatting
  const chartData = analytics.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: day.profile_views + day.course_views + day.test_views + day.video_views,
    enrollments: day.enrollments,
    completions: day.test_completions,
    revenue: day.revenue,
  }));

  const pieData = [
    { name: 'Profile', value: totals.profileViews },
    { name: 'Courses', value: totals.courseViews },
    { name: 'Tests', value: totals.testViews },
    { name: 'Videos', value: totals.videoViews },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                </div>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Views & Engagement
                </CardTitle>
                <CardDescription>Daily views and enrollments trend</CardDescription>
              </div>
              <Tabs value={period} onValueChange={setPeriod}>
                <TabsList className="h-8">
                  <TabsTrigger value="7d" className="text-xs px-2">7D</TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs px-2">30D</TabsTrigger>
                  <TabsTrigger value="90d" className="text-xs px-2">90D</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="enrollments"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Views by Type
              </CardTitle>
              <CardDescription>Distribution of views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Views → Enrollments → Revenue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Course Views</span>
                  <span className="font-medium">{totals.courseViews}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enrollments ({enrollmentRate}% rate)</span>
                  <span className="font-medium">{totals.enrollments}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-2"
                    style={{ width: `${Math.min(parseFloat(enrollmentRate) * 5, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Revenue</span>
                  <span className="font-medium">{totals.revenue.toLocaleString()} UZS</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-3"
                    style={{ width: `${Math.min(totals.revenue / 1000, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>Effectiveness of your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Courses', value: coursesCount, completions: studentsCount },
                    { name: 'Tests', value: testsCount, completions: totals.testCompletions },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completions" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Count
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-chart-2" />
                  Completions
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};