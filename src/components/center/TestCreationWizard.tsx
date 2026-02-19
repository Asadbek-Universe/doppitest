import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronRight, ChevronLeft, ListChecks, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTest, useUpdateTest } from '@/hooks/useCenterData';
import { useTestQuestions } from '@/hooks/useQuestionManagement';
import { useSubjects } from '@/hooks/useCourses';
import { QuestionManager } from '@/components/QuestionManager';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Basic info', icon: FileText },
  { id: 2, title: 'Questions', icon: ListChecks },
  { id: 3, title: 'Settings', icon: Settings },
];

const DIFFICULTY = [
  { value: 1, label: 'Easy' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Hard' },
  { value: 4, label: 'Very hard' },
  { value: 5, label: 'Expert' },
];

interface TestCreationWizardProps {
  centerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TestCreationWizard: FC<TestCreationWizardProps> = ({
  centerId,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [testId, setTestId] = useState<string | null>(null);
  const [basic, setBasic] = useState({
    title: '',
    description: '',
    subject_id: '',
    difficulty: 2,
    duration_minutes: 30,
    total_marks: 100,
  });
  const [settings, setSettings] = useState({
    shuffle_questions: true,
    max_attempts: null as number | null,
    passing_score_percent: 60,
    is_published: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: subjects } = useSubjects();
  const { data: questions = [] } = useTestQuestions(testId);
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!basic.title.trim()) e.title = 'Test title is required';
    if (!basic.subject_id) e.subject_id = 'Subject is required';
    if (basic.duration_minutes < 1) e.duration_minutes = 'Duration must be at least 1 minute';
    if (basic.total_marks < 1) e.total_marks = 'Total marks must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const hasValidQuestions = (): boolean => {
    if (!questions.length) return false;
    for (const q of questions) {
      const opts = (q as { question_options?: { is_correct: boolean }[] }).question_options ?? [];
      if (!opts.some((o) => o.is_correct)) return false;
    }
    return true;
  };

  const canPublish = (): boolean => {
    if (!basic.title.trim() || !basic.subject_id) return false;
    if (questions.length === 0) return false;
    if (!hasValidQuestions()) return false;
    return true;
  };

  const handleSaveDraft = async () => {
    if (!testId) {
      if (!validateStep1()) return;
      try {
        const test = await createTest.mutateAsync({
          center_id: centerId,
          title: basic.title,
          description: basic.description || undefined,
          subject_id: basic.subject_id || undefined,
          difficulty: basic.difficulty,
          duration_minutes: basic.duration_minutes,
          questions_count: 0,
          total_marks: basic.total_marks,
          shuffle_questions: settings.shuffle_questions,
          max_attempts: settings.max_attempts,
          passing_score_percent: settings.passing_score_percent,
          is_published: false,
        });
        setTestId(test.id);
        toast.success('Draft saved. Add questions in the next step.');
      } catch {
        toast.error('Failed to save draft');
      }
      return;
    }
    try {
      await updateTest.mutateAsync({
        testId,
        centerId,
        title: basic.title,
        description: basic.description || undefined,
        subject_id: basic.subject_id || null,
        difficulty: basic.difficulty,
        duration_minutes: basic.duration_minutes,
        total_marks: basic.total_marks,
        questions_count: questions.length,
        shuffle_questions: settings.shuffle_questions,
        max_attempts: settings.max_attempts,
        passing_score_percent: settings.passing_score_percent,
        is_published: false,
      });
      toast.success('Draft saved');
    } catch {
      toast.error('Failed to save draft');
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      if (!testId) {
        try {
          const test = await createTest.mutateAsync({
            center_id: centerId,
            title: basic.title,
            description: basic.description || undefined,
            subject_id: basic.subject_id || undefined,
            difficulty: basic.difficulty,
            duration_minutes: basic.duration_minutes,
            questions_count: 0,
            total_marks: basic.total_marks,
            shuffle_questions: settings.shuffle_questions,
            max_attempts: settings.max_attempts,
            passing_score_percent: settings.passing_score_percent,
            is_published: false,
          });
          setTestId(test.id);
        } catch {
          toast.error('Failed to create test');
          return;
        }
      } else {
        await updateTest.mutateAsync({
          testId,
          centerId,
          title: basic.title,
          description: basic.description || undefined,
          subject_id: basic.subject_id || null,
          difficulty: basic.difficulty,
          duration_minutes: basic.duration_minutes,
          total_marks: basic.total_marks,
        });
      }
      setStep(2);
      setErrors({});
      return;
    }
    if (step === 2) {
      if (questions.length === 0) {
        toast.error('Add at least one question before continuing.');
        return;
      }
      if (!hasValidQuestions()) {
        toast.error('Every question must have at least one correct answer.');
        return;
      }
      await updateTest.mutateAsync({
        testId: testId!,
        centerId,
        questions_count: questions.length,
      });
      setStep(3);
      return;
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
    setErrors({});
  };

  const handlePublish = async () => {
    if (!canPublish()) {
      toast.error('Add at least one question with a correct answer before publishing.');
      return;
    }
    if (!testId) return;
    try {
      await updateTest.mutateAsync({
        testId,
        centerId,
        questions_count: questions.length,
        shuffle_questions: settings.shuffle_questions,
        max_attempts: settings.max_attempts,
        passing_score_percent: settings.passing_score_percent,
        is_published: true,
      });
      toast.success('Test published');
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to publish');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle>Create test</CardTitle>
        <CardDescription>Step {step} of {STEPS.length}. Add questions and set passing rules.</CardDescription>
        <Progress value={(step / STEPS.length) * 100} className="h-2 mt-2" />
        <div className="flex gap-2 mt-4 flex-wrap">
          {STEPS.map((s) => (
            <Button
              key={s.id}
              variant={step === s.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStep(s.id)}
              disabled={s.id > step && !testId}
            >
              {s.id}. {s.title}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Test title *</Label>
                <Input
                  value={basic.title}
                  onChange={(e) => setBasic((b) => ({ ...b, title: e.target.value }))}
                  placeholder="e.g. Algebra Basics Quiz"
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={basic.subject_id} onValueChange={(v) => setBasic((b) => ({ ...b, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {(subjects ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.subject_id && <p className="text-sm text-destructive">{errors.subject_id}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={basic.description}
                  onChange={(e) => setBasic((b) => ({ ...b, description: e.target.value }))}
                  placeholder="What does this test cover?"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={String(basic.difficulty)} onValueChange={(v) => setBasic((b) => ({ ...b, difficulty: parseInt(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time limit (minutes) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={basic.duration_minutes}
                    onChange={(e) => setBasic((b) => ({ ...b, duration_minutes: parseInt(e.target.value) || 30 }))}
                  />
                  {errors.duration_minutes && <p className="text-sm text-destructive">{errors.duration_minutes}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total marks</Label>
                <Input
                  type="number"
                  min={1}
                  value={basic.total_marks}
                  onChange={(e) => setBasic((b) => ({ ...b, total_marks: parseInt(e.target.value) || 100 }))}
                />
                {errors.total_marks && <p className="text-sm text-destructive">{errors.total_marks}</p>}
              </div>
            </motion.div>
          )}

          {step === 2 && testId && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">Add at least one question. Each question must have at least one correct answer.</p>
              <div className="rounded-lg border p-4 bg-muted/30">
                <QuestionManager testId={testId} testTitle={basic.title} />
              </div>
              {questions.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Questions: {questions.length}. {hasValidQuestions() ? (
                    <span className="text-green-600">All have a correct answer.</span>
                  ) : (
                    <span className="text-amber-600">Some questions have no correct answer.</span>
                  )}
                </p>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Randomize questions</p>
                  <p className="text-xs text-muted-foreground">Shuffle order for each attempt</p>
                </div>
                <Switch
                  checked={settings.shuffle_questions}
                  onCheckedChange={(c) => setSettings((s) => ({ ...s, shuffle_questions: c }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max attempts per user (empty = unlimited)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={settings.max_attempts ?? ''}
                  onChange={(e) => setSettings((s) => ({ ...s, max_attempts: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Passing score (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.passing_score_percent}
                  onChange={(e) => setSettings((s) => ({ ...s, passing_score_percent: parseInt(e.target.value) || 0 }))}
                />
              </div>
              {canPublish() ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Test has questions with correct answers. You can publish.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Add at least one question with a correct answer to enable Publish.</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {step > 1 && <Button variant="outline" onClick={handleBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSaveDraft} disabled={createTest.isPending || updateTest.isPending}>
              Save draft
            </Button>
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={createTest.isPending || (step === 2 && !testId)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={!canPublish() || updateTest.isPending}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
