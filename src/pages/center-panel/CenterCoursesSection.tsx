import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Edit2, AlertCircle } from 'lucide-react';
import { useMyCenter, useMyCenterCourses, useCreateCourse, useUpdateCourse } from '@/hooks/useCenterData';
import { useSubjects } from '@/hooks/useCourses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CourseCreationWizard } from '@/components/center/CourseCreationWizard';

export const CenterCoursesSection: FC = () => {
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: courses, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useMyCenterCourses(center?.id);
  const { data: subjects } = useSubjects();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const [showWizard, setShowWizard] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    instructor_name: '',
    is_published: false,
  });

  const list = courses ?? [];

  const openCreate = () => {
    setShowWizard(true);
  };

  const openEdit = (course: { id: string; title: string; description?: string | null; subject_id?: string | null; instructor_name?: string; is_published?: boolean }) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      description: course.description ?? '',
      subject_id: course.subject_id ?? '',
      instructor_name: course.instructor_name ?? '',
      is_published: course.is_published ?? false,
    });
    setDialogOpen('edit');
  };

  const handleSubmit = async () => {
    if (!center?.id) return;
    if (!form.title.trim()) {
      toast.error('Course title is required');
      return;
    }
    try {
      if (editingId) {
        await updateCourse.mutateAsync({
          courseId: editingId,
          centerId: center.id,
          title: form.title,
          description: form.description || undefined,
          subject_id: form.subject_id || null,
          instructor_name: form.instructor_name || undefined,
          is_published: form.is_published,
        });
        toast.success('Course updated');
      } else {
        await createCourse.mutateAsync({
          center_id: center.id,
          title: form.title,
          description: form.description || undefined,
          subject_id: form.subject_id || undefined,
          instructor_name: form.instructor_name || undefined,
        });
        toast.success('Course created');
      }
      setDialogOpen(null);
    } catch {
      toast.error(editingId ? 'Failed to update course' : 'Failed to create course');
    }
  };

  const togglePublish = async (course: { id: string; is_published?: boolean }) => {
    if (!center?.id) return;
    try {
      await updateCourse.mutateAsync({
        courseId: course.id,
        centerId: center.id,
        is_published: !course.is_published,
      });
      toast.success(course.is_published ? 'Course set to draft' : 'Course published');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (centerLoading || !center) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (showWizard && center?.id) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)}>← Back to courses</Button>
        </div>
        <CourseCreationWizard
          centerId={center.id}
          onClose={() => setShowWizard(false)}
          onSuccess={() => { refetchCourses(); setShowWizard(false); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Courses
        </h1>
        <p className="text-muted-foreground">Manage your center&apos;s courses. Draft courses are only visible here until published.</p>
      </div>

      {coursesError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load courses</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchCourses()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>All courses created by your center. Publish to make them visible to students.</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create course
            </Button>
            <Dialog open={dialogOpen === 'edit'} onOpenChange={(o) => !o && setDialogOpen(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit course' : 'Create new course'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Course title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {(subjects ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {editingId && (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">Published</p>
                        <p className="text-xs text-muted-foreground">Visible to students</p>
                      </div>
                      <Button
                        variant={form.is_published ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setForm({ ...form, is_published: !form.is_published })}
                      >
                        {form.is_published ? 'Published' : 'Draft'}
                      </Button>
                    </div>
                  )}
                  <Button onClick={handleSubmit} disabled={createCourse.isPending || updateCourse.isPending} className="w-full">
                    {createCourse.isPending || updateCourse.isPending ? 'Saving...' : editingId ? 'Save changes' : 'Create course'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading courses…</div>
            ) : list.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No courses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first course to offer it to students.</p>
                <Button onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first course
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{(course.subjects as { name?: string } | null)?.name ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant={course.is_published ? 'default' : 'secondary'}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>{course.students_count ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => togglePublish(course)}>
                          {course.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(course)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CenterCoursesSection;
