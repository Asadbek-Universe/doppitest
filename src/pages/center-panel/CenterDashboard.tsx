import { FC, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Trophy, Video, TrendingUp } from 'lucide-react';
import {
  useMyCenter,
  useMyCenterCourses,
  useMyCenterEnrollments,
  useCenterOlympiads,
  useCenterReels,
  useCenterAnalytics,
} from '@/hooks/useCenterData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const CenterDashboard: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: courses, isLoading: coursesLoading } = useMyCenterCourses(center?.id);
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyCenterEnrollments(center?.id);
  const { data: olympiads, isLoading: olympiadsLoading } = useCenterOlympiads(center?.id);
  const { data: reels, isLoading: reelsLoading } = useCenterReels(center?.id);
  const { data: analytics = [], isLoading: analyticsLoading } = useCenterAnalytics(center?.id, 14);

  const isLoading = centerLoading;
  const coursesList = courses ?? [];

  const activeCourses = useMemo(
    () => coursesList.filter((c) => (c as { approval_status?: string }).approval_status === 'published').length,
    [coursesList]
  );
  const activeOlympiads = useMemo(
    () => (olympiads ?? []).filter((o) => (o as { is_published?: boolean }).is_published).length,
    [olympiads]
  );
  const totalEnrollments = enrollments?.length ?? 0;
  const uniqueStudents = useMemo(() => {
    const set = new Set((enrollments ?? []).map((e) => (e as { user_id?: string }).user_id).filter(Boolean));
    return set.size;
  }, [enrollments]);
  const centerStatus = (center as { status?: string })?.status ?? 'active';

  const chartData = useMemo(
    () =>
      (analytics as { date?: string; enrollments?: number; test_completions?: number; video_views?: number }[]).map(
        (d) => ({
          date: d.date?.slice(5) ?? '',
          enrollments: d.enrollments ?? 0,
          completions: d.test_completions ?? 0,
          views: d.video_views ?? 0,
        })
      ),
    [analytics]
  );

  if (isLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: enrollmentsLoading ? '…' : uniqueStudents, icon: Users, href: null },
    { label: 'Active Courses', value: coursesLoading ? '…' : `${activeCourses} / ${coursesList.length}`, icon: BookOpen, href: '/center-panel/courses' },
    { label: 'Olympiads', value: olympiadsLoading ? '…' : (olympiads?.length ?? 0), icon: Trophy, href: '/center-panel/olympiads' },
    { label: 'Reels', value: reelsLoading ? '…' : (reels?.length ?? 0), icon: Video, href: '/center-panel/reels' },
    { label: 'Total Enrollments', value: enrollmentsLoading ? '…' : totalEnrollments, icon: TrendingUp, href: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <LayoutDashboard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{center.name}</h1>
            <Badge
              variant={centerStatus === 'approved' || centerStatus === 'active' ? 'default' : 'secondary'}
              className={
                centerStatus === 'rejected' || centerStatus === 'suspended'
                  ? 'bg-destructive/10 text-destructive border-destructive'
                  : centerStatus === 'pending'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500'
                    : 'bg-green-500/10 text-green-600 border-green-500'
              }
            >
              {centerStatus === 'pending' ? 'Pending' : centerStatus === 'approved' || centerStatus === 'active' ? 'Active' : centerStatus}
            </Badge>
          </div>
          <p className="text-muted-foreground">Center Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const card = (
            <Card className={stat.href ? 'hover:border-primary/50 transition-colors' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl font-bold truncate">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {stat.href ? <Link to={stat.href} className="block">{card}</Link> : card}
            </motion.div>
          );
        })}
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Enrollments" />
                  <Area type="monotone" dataKey="completions" stroke="#22c55e" fill="rgba(34,197,94,0.2)" name="Test completions" />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="rgba(59,130,246,0.2)" name="Video views" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Courses</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/center-panel/courses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : coursesList.length === 0 ? (
              <p className="text-muted-foreground">No courses yet. Create your first course.</p>
            ) : (
              <div className="space-y-2">
                {coursesList.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{course.title}</span>
                    <span className="text-muted-foreground">{course.students_count ?? 0} students</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CenterDashboard;
