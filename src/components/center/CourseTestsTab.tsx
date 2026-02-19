import { FC, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  GripVertical,
  FileText,
  AlertCircle,
  CheckCircle2,
  Award,
  Layers,
} from 'lucide-react';
import {
  useCourseTests,
  useAddTestToCourse,
  useRemoveTestFromCourse,
  useUpdateCourseTestOrder,
  useUpdateCourseTest,
  useMyCenterTests,
} from '@/hooks/useCenterData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface CourseTestsTabProps {
  courseId: string;
  centerId: string;
}

interface CourseTest {
  id: string;
  course_id: string;
  test_id: string;
  test_order: number;
  test_type: 'practice' | 'final' | 'quiz' | 'diagnostic';
  is_required: boolean;
  created_at: string;
  updated_at: string;
  tests?: {
    id: string;
    title: string;
    description?: string;
    subject_id?: string;
    subjects?: { name: string };
    questions_count: number;
    is_published: boolean;
    total_marks?: number;
  };
}

export const CourseTestsTab: FC<CourseTestsTabProps> = ({ courseId, centerId }) => {
  const { data: courseTests = [] } = useCourseTests(courseId);
  const { data: availableTests = [] } = useMyCenterTests(centerId);
  const addTestToCourse = useAddTestToCourse();
  const removeTestFromCourse = useRemoveTestFromCourse();
  const updateTestOrder = useUpdateCourseTestOrder();
  const updateCourseTest = useUpdateCourseTest();

  const [addTestDialogOpen, setAddTestDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [testType, setTestType] = useState<'practice' | 'final' | 'quiz' | 'diagnostic'>('practice');
  const [isRequired, setIsRequired] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Filter tests that are not already added
  const unaddedTests = useMemo(() => {
    const courseTestIds = (courseTests as unknown as CourseTest[]).map(ct => ct.test_id);
    return availableTests.filter(t => !courseTestIds.includes(t.id));
  }, [availableTests, courseTests]);

  const handleAddTest = async () => {
    if (!selectedTestId) {
      toast.error('Please select a test');
      return;
    }

    const test = unaddedTests.find(t => t.id === selectedTestId);
    if (!test) {
      toast.error('Test not found');
      return;
    }

    try {
      await addTestToCourse.mutateAsync({
        courseId,
        testId: selectedTestId,
        testType,
        isRequired,
      });
      toast.success('Test added to course');
      setSelectedTestId('');
      setTestType('practice');
      setIsRequired(false);
      setAddTestDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add test');
    }
  };

  const handleRemoveTest = async (courseTestId: string) => {
    try {
      await removeTestFromCourse.mutateAsync({
        courseTestId,
        courseId,
      });
      toast.success('Test removed from course');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove test');
    }
  };

  const handleReorderTests = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= courseTests.length) return;

    const tests = (courseTests as unknown as CourseTest[]);
    const newTests = [...tests];
    const [moved] = newTests.splice(fromIndex, 1);
    newTests.splice(toIndex, 0, moved);

    // Update all test orders
    for (const [index, courseTest] of newTests.entries()) {
      try {
        await updateTestOrder.mutateAsync({
          courseId,
          courseTestId: courseTest.id,
          newOrder: index,
        });
      } catch (error) {
        toast.error('Failed to reorder tests');
        return;
      }
    }
  };

  const handleUpdateTestType = async (courseTestId: string, newType: string) => {
    try {
      await updateCourseTest.mutateAsync({
        courseTestId,
        courseId,
        testType: newType as 'practice' | 'final' | 'quiz' | 'diagnostic',
      });
      toast.success('Test type updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update test');
    }
  };

  const handleToggleRequired = async (courseTestId: string, required: boolean) => {
    try {
      await updateCourseTest.mutateAsync({
        courseTestId,
        courseId,
        isRequired: !required,
      });
      toast.success(required ? 'Test is now optional' : 'Test is now required');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update test');
    }
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'final':
        return <Award className="w-4 h-4" />;
      case 'quiz':
        return <Layers className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'final':
        return 'bg-red-100 text-red-800';
      case 'quiz':
        return 'bg-blue-100 text-blue-800';
      case 'diagnostic':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tests</h3>
          <p className="text-sm text-muted-foreground">
            {courseTests.length === 0
              ? 'No tests added to this course yet'
              : `${courseTests.length} test${courseTests.length !== 1 ? 's' : ''} added`}
          </p>
        </div>
        <Dialog open={addTestDialogOpen} onOpenChange={setAddTestDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={unaddedTests.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Test to Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="test-select">Select Test *</Label>
                {unaddedTests.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    All tests have been added to this course. Create a new test to add it.
                  </div>
                ) : (
                  <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                    <SelectTrigger id="test-select">
                      <SelectValue placeholder="Select a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {unaddedTests.map(test => (
                        <SelectItem key={test.id} value={test.id}>
                          <div className="flex items-center gap-2">
                            <span>{test.title}</span>
                            {!test.is_published && (
                              <Badge variant="secondary" className="text-xs">Draft</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({test.questions_count} Q's)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedTestId && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="test-type">Test Type</Label>
                    <Select
                      value={testType}
                      onValueChange={v => setTestType(v as 'practice' | 'final' | 'quiz' | 'diagnostic')}
                    >
                      <SelectTrigger id="test-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="final">Final Test</SelectItem>
                        <SelectItem value="diagnostic">Diagnostic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={isRequired}
                      onCheckedChange={c => setIsRequired(c === true)}
                    />
                    <label
                      htmlFor="required"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as required to complete course
                    </label>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTestDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddTest}
                disabled={addTestToCourse.isPending || !selectedTestId}
              >
                {addTestToCourse.isPending ? 'Adding...' : 'Add Test'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {courseTests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tests added yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add tests to structure your course with assessments
            </p>
            <Button
              size="sm"
              onClick={() => setAddTestDialogOpen(true)}
              disabled={unaddedTests.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add your first test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {(courseTests as unknown as CourseTest[]).map((courseTest, index) => {
              const test = courseTest.tests;
              return (
                <motion.div
                  key={courseTest.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-muted-foreground cursor-move">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{test?.title}</h4>
                      {!test?.is_published && (
                        <Badge variant="secondary" className="shrink-0 text-xs gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Draft
                        </Badge>
                      )}
                      {courseTest.is_required && (
                        <Badge className="shrink-0 text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Required
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{test?.questions_count ?? 0} questions</span>
                      {test?.total_marks && <span>• {test.total_marks} marks</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={courseTest.test_type}
                      onValueChange={v => handleUpdateTestType(courseTest.id, v)}
                    >
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practice">
                          <div className="flex items-center gap-1">
                            {getTestTypeIcon('practice')} Practice
                          </div>
                        </SelectItem>
                        <SelectItem value="quiz">
                          <div className="flex items-center gap-1">
                            {getTestTypeIcon('quiz')} Quiz
                          </div>
                        </SelectItem>
                        <SelectItem value="final">
                          <div className="flex items-center gap-1">
                            {getTestTypeIcon('final')} Final
                          </div>
                        </SelectItem>
                        <SelectItem value="diagnostic">
                          <div className="flex items-center gap-1">
                            {getTestTypeIcon('diagnostic')} Diagnostic
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRequired(courseTest.id, courseTest.is_required)}
                      title={courseTest.is_required ? 'Mark as optional' : 'Mark as required'}
                      className={courseTest.is_required ? 'text-green-600' : 'text-muted-foreground'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove test from course?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will only remove {test?.title} from this course. The test will still exist.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveTest(courseTest.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {courseTests.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Course Test Policy</p>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li>• Required tests must be passed to complete the course</li>
                  <li>• Practice tests are optional but recommended</li>
                  <li>• Tests are shown in the order listed above</li>
                  <li>• Students can only see published tests</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseTestsTab;
