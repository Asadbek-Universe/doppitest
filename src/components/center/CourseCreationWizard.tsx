import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Settings,
  Layers,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateCourse,
  useUpdateCourse,
  useCourseLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from '@/hooks/useCenterData';
import { useSubjects } from '@/hooks/useCourses';
import { CourseTestsTab } from '@/components/center/CourseTestsTab';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Basic info', icon: BookOpen },
  { id: 2, title: 'Lessons', icon: Layers },
  { id: 3, title: 'Tests', icon: FileText },
  { id: 4, title: 'Media', icon: ImageIcon },
  { id: 5, title: 'Settings', icon: Settings },
];

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'uz', label: "O'zbek" },
  { value: 'ru', label: 'Русский' },
];

export type ModuleLesson = {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
};

export type CourseWizardModule = {
  section_title: string;
  lessons: ModuleLesson[];
};

interface CourseCreationWizardProps {
  centerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CourseCreationWizard: FC<CourseCreationWizardProps> = ({
  centerId,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [basic, setBasic] = useState({
    title: '',
    description: '',
    subject_id: '',
    level: '' as '' | 'beginner' | 'intermediate' | 'advanced',
    language: 'en',
  });
  const [modules, setModules] = useState<CourseWizardModule[]>([
    { section_title: 'Introduction', lessons: [{ title: '', description: '', video_url: '', duration_minutes: 15 }] },
  ]);
  const [media, setMedia] = useState({ thumbnail_url: '' });
  const [settings, setSettings] = useState({ is_free: true, price: 0, is_published: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: subjects } = useSubjects();
  const { data: lessons = [] } = useCourseLessons(courseId);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!basic.title.trim()) e.title = 'Course title is required';
    if (!basic.subject_id) e.subject_id = 'Subject is required';
    if (!basic.level) e.level = 'Level is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (modules.length === 0) e.modules = 'Add at least one module';
    const hasLesson = modules.every((m) => m.lessons.length > 0 && m.lessons.some((l) => l.title.trim()));
    if (!hasLesson) e.lessons = 'Each module must have at least one lesson with a title';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    // Step 3 is Tests - no validation required, tests are optional
    return true;
  };

  const validateStep4 = (): boolean => {
    const e: Record<string, string> = {};
    if (!media.thumbnail_url?.trim()) e.thumbnail_url = 'Cover image URL is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canPublish = (): boolean => {
    if (!basic.title.trim() || !basic.subject_id || !basic.level) return false;
    if (modules.length === 0) return false;
    const hasValidLessons = modules.every(
      (m) => m.lessons.length > 0 && m.lessons.every((l) => l.title.trim() && (l.video_url?.trim() || l.description?.trim()))
    );
    if (!hasValidLessons) return false;
    if (!media.thumbnail_url?.trim()) return false;
    return true;
  };

  const handleSaveDraft = async () => {
    if (!courseId) {
      if (!validateStep1()) return;
      try {
        const course = await createCourse.mutateAsync({
          center_id: centerId,
          title: basic.title,
          description: basic.description || undefined,
          subject_id: basic.subject_id || undefined,
          level: basic.level || undefined,
          language: basic.language,
          is_published: false,
        });
        setCourseId(course.id);
        toast.success('Draft saved');
      } catch {
        toast.error('Failed to save draft');
      }
      return;
    }
    try {
      await updateCourse.mutateAsync({
        courseId,
        centerId,
        title: basic.title,
        description: basic.description || undefined,
        subject_id: basic.subject_id || null,
        level: basic.level || null,
        language: basic.language,
        thumbnail_url: media.thumbnail_url || null,
        is_free: settings.is_free,
        price: settings.price,
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
      if (!courseId) {
        try {
          const course = await createCourse.mutateAsync({
            center_id: centerId,
            title: basic.title,
            description: basic.description || undefined,
            subject_id: basic.subject_id || undefined,
            level: basic.level as 'beginner' | 'intermediate' | 'advanced',
            language: basic.language,
            is_published: false,
          });
          setCourseId(course.id);
        } catch {
          toast.error('Failed to create course');
          return;
        }
      } else {
        await updateCourse.mutateAsync({
          courseId,
          centerId,
          title: basic.title,
          description: basic.description || undefined,
          subject_id: basic.subject_id || null,
          level: basic.level || null,
          language: basic.language,
        });
      }
      setStep(2);
      setErrors({});
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      if (!courseId) return;
      for (const existing of lessons) {
        await deleteLesson.mutateAsync({ lessonId: existing.id, course_id: courseId });
      }
      let orderIndex = 0;
      for (const mod of modules) {
        for (const les of mod.lessons) {
          if (!les.title.trim()) continue;
          await createLesson.mutateAsync({
            course_id: courseId,
            section_title: mod.section_title,
            title: les.title,
            description: les.description || null,
            video_url: les.video_url || null,
            duration_minutes: les.duration_minutes || 15,
            order_index: orderIndex++,
            is_free: false,
          });
        }
      }
      setStep(3);
      setErrors({});
      return;
    }
    if (step === 3) {
      // Step 3 is Tests - no validation needed, just move forward
      setStep(4);
      setErrors({});
      return;
    }
    if (step === 4) {
      if (!validateStep4()) return;
      if (courseId) {
        await updateCourse.mutateAsync({
          courseId,
          centerId,
          thumbnail_url: media.thumbnail_url || null,
        });
      }
      setStep(5);
      setErrors({});
      return;
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
    setErrors({});
  };

  const handlePublish = async () => {
    if (!canPublish()) {
      toast.error('Complete all required fields before publishing');
      return;
    }
    if (!courseId) return;
    try {
      await updateCourse.mutateAsync({
        courseId,
        centerId,
        thumbnail_url: media.thumbnail_url || null,
        is_free: settings.is_free,
        price: settings.price,
        is_published: true,
      });
      toast.success('Course published');
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to publish');
    }
  };

  const addModule = () => {
    setModules((m) => [...m, { section_title: 'New section', lessons: [{ title: '', description: '', video_url: '', duration_minutes: 15 }] }]);
  };

  const addLesson = (moduleIndex: number) => {
    setModules((m) => {
      const next = [...m];
      next[moduleIndex] = {
        ...next[moduleIndex],
        lessons: [...next[moduleIndex].lessons, { title: '', description: '', video_url: '', duration_minutes: 15 }],
      };
      return next;
    });
  };

  const updateModule = (moduleIndex: number, section_title: string) => {
    setModules((m) => {
      const next = [...m];
      next[moduleIndex] = { ...next[moduleIndex], section_title };
      return next;
    });
  };

  const updateLessonInModule = (moduleIndex: number, lessonIndex: number, patch: Partial<ModuleLesson>) => {
    setModules((m) => {
      const next = [...m];
      const les = [...next[moduleIndex].lessons];
      les[lessonIndex] = { ...les[lessonIndex], ...patch };
      next[moduleIndex] = { ...next[moduleIndex], lessons: les };
      return next;
    });
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setModules((m) => {
      const next = [...m];
      const les = next[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
      if (les.length === 0) return m;
      next[moduleIndex] = { ...next[moduleIndex], lessons: les };
      return next;
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle>Create course</CardTitle>
        <CardDescription>Step {step} of {STEPS.length}. Complete all steps and save draft anytime.</CardDescription>
        <Progress value={(step / STEPS.length) * 100} className="h-2 mt-2" />
        <div className="flex gap-2 mt-4 flex-wrap">
          {STEPS.map((s) => (
            <Button
              key={s.id}
              variant={step === s.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStep(s.id)}
              disabled={s.id > step && !courseId}
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
                <Label>Course title *</Label>
                <Input
                  value={basic.title}
                  onChange={(e) => setBasic((b) => ({ ...b, title: e.target.value }))}
                  placeholder="e.g. Introduction to Algebra"
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label>Subject / category *</Label>
                <Select value={basic.subject_id} onValueChange={(v) => setBasic((b) => ({ ...b, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {(subjects ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.subject_id && <p className="text-sm text-destructive">{errors.subject_id}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={basic.description}
                  onChange={(e) => setBasic((b) => ({ ...b, description: e.target.value }))}
                  placeholder="What will students learn?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level *</Label>
                  <Select value={basic.level} onValueChange={(v: 'beginner' | 'intermediate' | 'advanced') => setBasic((b) => ({ ...b, level: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.level && <p className="text-sm text-destructive">{errors.level}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={basic.language} onValueChange={(v) => setBasic((b) => ({ ...b, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">Add at least one module and at least one lesson per module. Each lesson should have a title and video or text content.</p>
              {errors.modules && <p className="text-sm text-destructive">{errors.modules}</p>}
              {errors.lessons && <p className="text-sm text-destructive">{errors.lessons}</p>}
              {modules.map((mod, mi) => (
                <Card key={mi}>
                  <CardContent className="pt-4 space-y-3">
                    <Input
                      placeholder="Module / section title"
                      value={mod.section_title}
                      onChange={(e) => updateModule(mi, e.target.value)}
                    />
                    {mod.lessons.map((les, li) => (
                      <div key={li} className="grid gap-2 rounded-lg border p-3 bg-muted/30">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Lesson title *"
                            value={les.title}
                            onChange={(e) => updateLessonInModule(mi, li, { title: e.target.value })}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLesson(mi, li)} disabled={mod.lessons.length <= 1}>−</Button>
                        </div>
                        <Input
                          placeholder="Video URL"
                          value={les.video_url}
                          onChange={(e) => updateLessonInModule(mi, li, { video_url: e.target.value })}
                        />
                        <Textarea
                          placeholder="Lesson description / text content"
                          value={les.description}
                          onChange={(e) => updateLessonInModule(mi, li, { description: e.target.value })}
                          rows={2}
                        />
                        <Input
                          type="number"
                          placeholder="Duration (min)"
                          value={les.duration_minutes || ''}
                          onChange={(e) => updateLessonInModule(mi, li, { duration_minutes: parseInt(e.target.value) || 15 })}
                          className="w-24"
                        />
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addLesson(mi)}>+ Add lesson</Button>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={addModule}>+ Add module</Button>
            </motion.div>
          )}

          {step === 3 && courseId && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="text-sm text-muted-foreground mb-4">
                <p className="font-medium text-foreground mb-2">Add Tests to Your Course (Optional)</p>
                <p>Attach tests to your course to create assessments. Tests can be practice tests, quizzes, or final exams.</p>
              </div>
              <CourseTestsTab courseId={courseId} centerId={centerId} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Cover image URL *</Label>
                <Input
                  placeholder="https://..."
                  value={media.thumbnail_url}
                  onChange={(e) => setMedia((m) => ({ ...m, thumbnail_url: e.target.value }))}
                />
                {errors.thumbnail_url && <p className="text-sm text-destructive">{errors.thumbnail_url}</p>}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Free course</p>
                  <p className="text-xs text-muted-foreground">Students can enroll without payment</p>
                </div>
                <Button
                  variant={settings.is_free ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings((s) => ({ ...s, is_free: true }))}
                >
                  Free
                </Button>
                <Button
                  variant={!settings.is_free ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings((s) => ({ ...s, is_free: false }))}
                >
                  Paid
                </Button>
              </div>
              {!settings.is_free && (
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.price || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, price: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              )}
              {canPublish() ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>All required fields are complete. You can publish.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Complete basic info, lessons, and media to enable Publish.</span>
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
            <Button variant="secondary" onClick={handleSaveDraft} disabled={createCourse.isPending || updateCourse.isPending}>
              Save draft
            </Button>
            {step < STEPS.length ? (
              <Button onClick={handleNext} disabled={createCourse.isPending}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={!canPublish() || updateCourse.isPending}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
