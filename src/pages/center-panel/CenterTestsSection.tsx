import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Eye, AlertCircle, HelpCircle } from 'lucide-react';
import { useMyCenter, useMyCenterTests, useCreateTest, useUpdateTest } from '@/hooks/useCenterData';
import { QuestionManager } from '@/components/QuestionManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { TestCreationWizard } from '@/components/center/TestCreationWizard';

export const CenterTestsSection: FC = () => {
  const navigate = useNavigate();
  const { data: center, isLoading: centerLoading } = useMyCenter();
  const { data: tests, isLoading: testsLoading, isError: testsError, refetch: refetchTests } = useMyCenterTests(center?.id);
  const updateTest = useUpdateTest();

  const [showWizard, setShowWizard] = useState(false);
  const [manageTest, setManageTest] = useState<{ id: string; title: string } | null>(null);

  const list = tests ?? [];

  const togglePublish = async (test: { id: string; questions_count: number; is_published?: boolean }) => {
    if (!center?.id) return;
    if (test.questions_count === 0) {
      toast.error('Add at least one question before publishing.');
      return;
    }
    try {
      await updateTest.mutateAsync({
        testId: test.id,
        centerId: center.id,
        is_published: !test.is_published,
      });
      toast.success(test.is_published ? 'Test set to draft' : 'Test published');
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

  if (manageTest) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setManageTest(null)}>
          ← Back to tests
        </Button>
        <QuestionManager testId={manageTest.id} testTitle={manageTest.title} centerId={center.id} />
      </div>
    );
  }

  if (showWizard && center?.id) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)}>← Back to tests</Button>
        <TestCreationWizard
          centerId={center.id}
          onClose={() => setShowWizard(false)}
          onSuccess={() => { refetchTests(); setShowWizard(false); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Tests
        </h1>
        <p className="text-muted-foreground">Manage tests and questions. Tests with no questions cannot be published.</p>
      </div>

      {testsError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load tests</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchTests()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Tests</CardTitle>
              <CardDescription>Add questions before publishing. Incomplete tests are only visible here.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create test
            </Button>
          </CardHeader>
          <CardContent>
            {testsLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading tests…</div>
            ) : list.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No tests yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create a test and add questions to publish it to students.</p>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first test
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((test) => {
                    const incomplete = (test.questions_count ?? 0) === 0;
                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>{(test.subjects as { name?: string } | null)?.name ?? '-'}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            {test.questions_count ?? 0}
                            {incomplete && (
                              <Badge variant="secondary" className="ml-1 gap-0.5">
                                <HelpCircle className="w-3 h-3" />
                                Incomplete
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={test.is_published ? 'default' : 'secondary'}>
                            {test.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setManageTest({ id: test.id, title: test.title })}>
                            Questions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePublish(test)}
                            disabled={incomplete && !test.is_published}
                            title={incomplete ? 'Add at least one question to publish' : undefined}
                          >
                            {test.is_published ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/tests?preview=${test.id}`)} title="Preview (read-only)">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CenterTestsSection;
