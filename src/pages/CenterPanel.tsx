import { FC, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  BookOpen,
  FileText,
  Users,
  Plus,
  LayoutDashboard,
  Settings,
  ArrowLeft,
  BarChart3,
  Trophy,
  Video,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsCenter } from '@/hooks/useUserRole';
import {
  useMyCenter,
  useMyCenterCourses,
  useMyCenterTests,
  useMyCenterEnrollments,
  useCreateCenter,
  useCreateCourse,
  useCreateTest,
  useCenterSubscription,
  useCenterAnalytics,
  useCenterSeoSettings,
  useCenterOlympiads,
  useCenterReels,
} from '@/hooks/useCenterData';
import { useMyCenterStatus, useCenterSubscriptionStatus } from '@/hooks/useCenterStatus';
import { useSubjects } from '@/hooks/useCourses';
import { Navbar } from '@/components/Navbar';
import { QuestionManager } from '@/components/QuestionManager';
import { CenterProfileTab } from '@/components/center/CenterProfileTab';
import { CenterAnalyticsTab } from '@/components/center/CenterAnalyticsTab';
import { CenterSeoTab } from '@/components/center/CenterSeoTab';
import { CenterOlympiadsTab } from '@/components/center/CenterOlympiadsTab';
import { CenterReelsTab } from '@/components/center/CenterReelsTab';
import { CenterPendingScreen } from '@/components/center/CenterPendingScreen';
import { CenterRejectedScreen } from '@/components/center/CenterRejectedScreen';
import { TariffSelectionScreen } from '@/components/center/TariffSelectionScreen';
import { TariffApprovalWaitingScreen } from '@/components/center/TariffApprovalWaitingScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const CenterPanel: FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isCenter, isLoading: roleLoading } = useIsCenter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Status-based queries
  const { data: centerStatus, isLoading: statusLoading } = useMyCenterStatus();
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useCenterSubscriptionStatus(centerStatus?.id);

  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: courses } = useMyCenterCourses(center?.id);
  const { data: tests } = useMyCenterTests(center?.id);
  const { data: enrollments } = useMyCenterEnrollments(center?.id);
  const { data: subjects } = useSubjects();
  const { data: subscription } = useCenterSubscription(center?.id);
  const { data: analytics } = useCenterAnalytics(center?.id, 30);
  const { data: seoSettings } = useCenterSeoSettings(center?.id);
  const { data: olympiads } = useCenterOlympiads(center?.id);
  const { data: reels } = useCenterReels(center?.id);

  const createCenter = useCreateCenter();
  const createCourse = useCreateCourse();
  const createTest = useCreateTest();

  const [centerForm, setCenterForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    instructor_name: '',
  });

  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    duration_minutes: 30,
    questions_count: 10,
    difficulty: 2,
  });

  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<{ id: string; title: string } | null>(null);

  // Loading states
  const isLoadingAll = authLoading || roleLoading || centerLoading || statusLoading || subscriptionLoading;

  if (isLoadingAll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isCenter) {
    return <Navigate to="/" replace />;
  }

  // Status-based screens (after center exists)
  if (centerStatus) {
    // If center is pending, show pending screen
    if (centerStatus.status === 'pending') {
      return <CenterPendingScreen center={center!} />;
    }

    // If center is rejected, show rejected screen
    if (centerStatus.status === 'rejected') {
      return <CenterRejectedScreen center={centerStatus} />;
    }

    // If center is approved but tariff not selected, show tariff selection
    if (centerStatus.status === 'approved' && subscriptionStatus && !subscriptionStatus.tariff_selected) {
      return <TariffSelectionScreen centerName={centerStatus.name} subscription={subscriptionStatus} />;
    }

    // If tariff is selected but center is still 'approved' (not 'active'), show waiting screen
    if (centerStatus.status === 'approved' && subscriptionStatus && subscriptionStatus.tariff_selected) {
      return <TariffApprovalWaitingScreen centerName={centerStatus.name} subscription={subscriptionStatus} />;
    }
  }

  const handleCreateCenter = async () => {
    if (!centerForm.name) {
      toast.error('Center name is required');
      return;
    }
    try {
      await createCenter.mutateAsync(centerForm);
      toast.success('Center created successfully');
      setDialogOpen(null);
    } catch {
      toast.error('Failed to create center');
    }
  };

  const handleCreateCourse = async () => {
    if (!center?.id || !courseForm.title) {
      toast.error('Course title is required');
      return;
    }
    try {
      await createCourse.mutateAsync({
        ...courseForm,
        center_id: center.id,
        subject_id: courseForm.subject_id || undefined,
      });
      toast.success('Course created successfully');
      setCourseForm({ title: '', description: '', subject_id: '', instructor_name: '' });
      setDialogOpen(null);
    } catch {
      toast.error('Failed to create course');
    }
  };

  const handleCreateTest = async () => {
    if (!center?.id || !testForm.title) {
      toast.error('Test title is required');
      return;
    }
    try {
      await createTest.mutateAsync({
        ...testForm,
        center_id: center.id,
        subject_id: testForm.subject_id || undefined,
      });
      toast.success('Test created successfully');
      setTestForm({ title: '', description: '', subject_id: '', duration_minutes: 30, questions_count: 10, difficulty: 2 });
      setDialogOpen(null);
    } catch {
      toast.error('Failed to create test');
    }
  };

  // If no center exists, show setup screen
  if (!center) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Your Center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Center Name *</Label>
                  <Input
                    id="name"
                    value={centerForm.name}
                    onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                    placeholder="Your center name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={centerForm.description}
                    onChange={(e) => setCenterForm({ ...centerForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={centerForm.city}
                      onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={centerForm.phone}
                      onChange={(e) => setCenterForm({ ...centerForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreateCenter} disabled={createCenter.isPending}>
                  {createCenter.isPending ? 'Creating...' : 'Create Center'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  const statCards = [
    { label: 'Courses', value: courses?.length ?? 0, icon: BookOpen },
    { label: 'Tests', value: tests?.length ?? 0, icon: FileText },
    { label: 'Students', value: enrollments?.length ?? 0, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{center.name}</h1>
                {centerStatus?.status === 'active' ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500">Active</Badge>
                ) : center.is_verified ? (
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500">Verified</Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>
                )}
              </div>
              <p className="text-muted-foreground">Center Dashboard</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
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
              </motion.div>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="reels">Videos</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="olympiads">Olympiads</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courses?.slice(0, 5).map((course) => (
                      <div key={course.id} className="flex justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{course.title}</span>
                        <span className="text-muted-foreground">{course.students_count ?? 0} students</span>
                      </div>
                    )) || <p className="text-muted-foreground">No courses yet</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tests?.slice(0, 5).map((test) => (
                      <div key={test.id} className="flex justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{test.title}</span>
                        <span className="text-muted-foreground">{test.completions ?? 0} completions</span>
                      </div>
                    )) || <p className="text-muted-foreground">No tests yet</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profile">
              <CenterProfileTab
                center={center}
                subscription={subscription}
                coursesCount={courses?.length ?? 0}
                testsCount={tests?.length ?? 0}
                reelsCount={reels?.length ?? 0}
              />
            </TabsContent>

            <TabsContent value="courses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Courses</CardTitle>
                  <Dialog open={dialogOpen === 'create-course'} onOpenChange={(open) => setDialogOpen(open ? 'create-course' : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Course</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Select value={courseForm.subject_id} onValueChange={(value) => setCourseForm({ ...courseForm, subject_id: value })}>
                            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                            <SelectContent>
                              {subjects?.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleCreateCourse} disabled={createCourse.isPending}>
                          {createCourse.isPending ? 'Creating...' : 'Create Course'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses?.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{course.subjects?.name || '-'}</TableCell>
                          <TableCell>{course.students_count ?? 0}</TableCell>
                          <TableCell>{course.rating?.toFixed(1) ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tests">
              {selectedTest ? (
                <Card>
                  <CardHeader>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTest(null)}>
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Tests
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <QuestionManager testId={selectedTest.id} testTitle={selectedTest.title} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Your Tests</CardTitle>
                    <Dialog open={dialogOpen === 'create-test'} onOpenChange={(open) => setDialogOpen(open ? 'create-test' : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Test
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Test</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select value={testForm.subject_id} onValueChange={(value) => setTestForm({ ...testForm, subject_id: value })}>
                              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                              <SelectContent>
                                {subjects?.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Duration (min)</Label>
                              <Input type="number" value={testForm.duration_minutes} onChange={(e) => setTestForm({ ...testForm, duration_minutes: parseInt(e.target.value) || 30 })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Questions</Label>
                              <Input type="number" value={testForm.questions_count} onChange={(e) => setTestForm({ ...testForm, questions_count: parseInt(e.target.value) || 10 })} />
                            </div>
                          </div>
                          <Button onClick={handleCreateTest} disabled={createTest.isPending}>
                            {createTest.isPending ? 'Creating...' : 'Create Test'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Questions</TableHead>
                          <TableHead>Completions</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tests?.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell className="font-medium">{test.title}</TableCell>
                            <TableCell>{test.subjects?.name || '-'}</TableCell>
                            <TableCell>{test.questions_count}</TableCell>
                            <TableCell>{test.completions ?? 0}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => setSelectedTest({ id: test.id, title: test.title })}>
                                <Settings className="w-4 h-4 mr-1" />
                                Questions
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reels">
              <CenterReelsTab
                centerId={center.id}
                reels={reels || []}
                subjects={subjects || []}
                maxReels={subscription?.max_videos ?? 10}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <CenterAnalyticsTab
                analytics={analytics || []}
                coursesCount={courses?.length ?? 0}
                testsCount={tests?.length ?? 0}
                studentsCount={enrollments?.length ?? 0}
              />
            </TabsContent>

            <TabsContent value="olympiads">
              <CenterOlympiadsTab
                centerId={center.id}
                olympiads={olympiads || []}
                subjects={subjects || []}
                canCreate={subscription?.can_create_olympiads ?? false}
              />
            </TabsContent>

            <TabsContent value="seo">
              <CenterSeoTab
                centerId={center.id}
                seoSettings={seoSettings}
                subscription={subscription}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default CenterPanel;