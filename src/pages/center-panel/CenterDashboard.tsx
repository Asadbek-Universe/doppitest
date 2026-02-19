import { FC } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, FileText, Users } from 'lucide-react';
import { useMyCenter, useMyCenterCourses, useMyCenterTests, useMyCenterEnrollments } from '@/hooks/useCenterData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const CenterDashboard: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: courses, isLoading: coursesLoading } = useMyCenterCourses(center?.id);
  const { data: tests, isLoading: testsLoading } = useMyCenterTests(center?.id);
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyCenterEnrollments(center?.id);

  const isLoading = centerLoading;
  const coursesList = courses ?? [];
  const testsList = tests ?? [];

  if (isLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Courses', value: coursesLoading ? '…' : coursesList.length, icon: BookOpen, href: '/center-panel/courses' },
    { label: 'Tests', value: testsLoading ? '…' : testsList.length, icon: FileText, href: '/center-panel/tests' },
    { label: 'Students', value: enrollmentsLoading ? '…' : (enrollments?.length ?? 0), icon: Users, href: null },
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
            <Badge className="bg-green-500/10 text-green-600 border-green-500">Active</Badge>
          </div>
          <p className="text-muted-foreground">Center Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const card = (
            <Card className={stat.href ? 'hover:border-primary/50 transition-colors' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Tests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/center-panel/tests">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {testsLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : testsList.length === 0 ? (
              <p className="text-muted-foreground">No tests yet. Create your first test.</p>
            ) : (
              <div className="space-y-2">
                {testsList.slice(0, 5).map((test) => (
                  <div key={test.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{test.title}</span>
                    <span className="text-muted-foreground">{test.completions ?? 0} completions</span>
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
