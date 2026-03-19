import { FC, useState } from 'react';
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, Image, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useOlympiadQuestions,
  useCreateOlympiadQuestion,
  useUpdateOlympiadQuestion,
  useDeleteOlympiadQuestion,
  getQuestionTypeLabel,
  type OlympiadQuestionType,
  type OlympiadQuestionOption,
  type OlympiadQuestionRow,
} from '@/hooks/useOlympiadQuestions';
import { toast } from 'sonner';

const QUESTION_TYPES: { value: OlympiadQuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short answer' },
  { value: 'image_based', label: 'Image-based' },
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

interface OlympiadQuestionsManagerProps {
  olympiad: { id: string; title: string };
  onBack: () => void;
}

export const OlympiadQuestionsManager: FC<OlympiadQuestionsManagerProps> = ({ olympiad, onBack }) => {
  const { data: questions = [], isLoading } = useOlympiadQuestions(olympiad.id);
  const createQ = useCreateOlympiadQuestion(olympiad.id);
  const updateQ = useUpdateOlympiadQuestion(olympiad.id);
  const deleteQ = useDeleteOlympiadQuestion(olympiad.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<OlympiadQuestionRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    question_type: 'single_choice' as OlympiadQuestionType,
    question_text: '',
    image_url: '',
    points: 1,
    topic: '',
    difficulty: '',
    explanation: '',
    section: '',
    options: [{ id: '1', text: '', isCorrect: false }, { id: '2', text: '', isCorrect: false }] as OlympiadQuestionOption[],
    correct_answer: '',
  });

  const resetForm = () => {
    setForm({
      question_type: 'single_choice',
      question_text: '',
      image_url: '',
      points: 1,
      topic: '',
      difficulty: '',
      explanation: '',
      section: '',
      options: [{ id: '1', text: '', isCorrect: false }, { id: '2', text: '', isCorrect: false }],
      correct_answer: '',
    });
    setEditingQuestion(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (q: OlympiadQuestionRow) => {
    setEditingQuestion(q);
    const opts = (q.options as OlympiadQuestionOption[]) ?? [];
    const correct = q.correct_answer as string | string[] | undefined;
    setForm({
      question_type: (q.question_type as OlympiadQuestionType) || 'single_choice',
      question_text: q.question_text,
      image_url: q.image_url || '',
      points: q.points ?? 1,
      topic: q.topic || '',
      difficulty: q.difficulty || '',
      explanation: q.explanation || '',
      section: q.section || '',
      options: opts.length >= 2 ? opts : [{ id: '1', text: '', isCorrect: false }, { id: '2', text: '', isCorrect: false }],
      correct_answer: Array.isArray(correct) ? correct[0] ?? '' : (correct ?? ''),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }
    const options = form.options.filter((o) => o.text.trim());
    if (['single_choice', 'multiple_choice', 'true_false'].includes(form.question_type) && options.length < 2) {
      toast.error('Add at least 2 options');
      return;
    }

    try {
      if (editingQuestion) {
        await updateQ.mutateAsync({
          id: editingQuestion.id,
          question_type: form.question_type,
          question_text: form.question_text.trim(),
          image_url: form.image_url.trim() || null,
          options: options,
          correct_answer: form.question_type === 'multiple_choice'
            ? options.filter((o) => o.isCorrect).map((o) => o.text)
            : form.correct_answer || (options.find((o) => o.isCorrect)?.text ?? null),
          points: form.points,
          topic: form.topic.trim() || null,
          difficulty: form.difficulty || null,
          explanation: form.explanation.trim() || null,
          section: form.section.trim() || null,
        });
      } else {
        await createQ.mutateAsync({
          question_type: form.question_type,
          question_text: form.question_text.trim(),
          image_url: form.image_url.trim() || null,
          options: options,
          correct_answer: form.question_type === 'multiple_choice'
            ? options.filter((o) => o.isCorrect).map((o) => o.text)
            : form.correct_answer || (options.find((o) => o.isCorrect)?.text ?? null),
          points: form.points,
          topic: form.topic.trim() || null,
          difficulty: form.difficulty || null,
          explanation: form.explanation.trim() || null,
          section: form.section.trim() || null,
          order_index: questions.length,
        });
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // toast from mutation
    }
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { id: String(Date.now()), text: '', isCorrect: false }],
    }));
  };

  const updateOption = (id: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    }));
  };

  const removeOption = (id: string) => {
    setForm((prev) => ({ ...prev, options: prev.options.filter((o) => o.id !== id) }));
  };

  const totalPoints = questions.reduce((s, q) => s + (q.points ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-xl">Manage Questions</CardTitle>
            <CardDescription>{olympiad.title} — add and edit questions</CardDescription>
          </div>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add question
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>
            Total questions: {questions.length} · Total points: {totalPoints}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading questions...</p>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/30">
              <FileQuestion className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No questions yet. Add questions to build your olympiad.</p>
              <Button variant="outline" className="mt-3" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add first question
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>#</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q, idx) => (
                  <TableRow key={q.id}>
                    <TableCell><GripVertical className="w-4 h-4 text-muted-foreground" /></TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{getQuestionTypeLabel(q.question_type as OlympiadQuestionType)}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{q.question_text}</TableCell>
                    <TableCell>{q.points}</TableCell>
                    <TableCell>{q.topic || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(q)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(q.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit question' : 'Add question'}</DialogTitle>
            <DialogDescription>Set question text, type, options, points, and optional topic and explanation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question type</Label>
              <Select value={form.question_type} onValueChange={(v) => setForm((p) => ({ ...p, question_type: v as OlympiadQuestionType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Question text *</Label>
              <Textarea
                value={form.question_text}
                onChange={(e) => setForm((p) => ({ ...p, question_text: e.target.value }))}
                placeholder="Enter the question..."
                rows={3}
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            {['single_choice', 'multiple_choice', 'true_false'].includes(form.question_type) && (
              <div>
                <Label>Options (mark correct)</Label>
                {form.options.map((opt) => (
                  <div key={opt.id} className="flex gap-2 items-center mt-2">
                    <input
                      type={form.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                      name="correct"
                      checked={!!opt.isCorrect}
                      onChange={() => {
                        if (form.question_type === 'multiple_choice') {
                          updateOption(opt.id, 'isCorrect', !opt.isCorrect);
                        } else {
                          setForm((p) => ({ ...p, options: p.options.map((o) => ({ ...o, isCorrect: o.id === opt.id })) }));
                        }
                      }}
                    />
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(opt.id, 'text', e.target.value)}
                      placeholder="Option text"
                    />
                    {form.options.length > 2 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(opt.id)}>Remove</Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addOption}>+ Add option</Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input type="number" min={1} value={form.points} onChange={(e) => setForm((p) => ({ ...p, points: parseInt(e.target.value, 10) || 1 }))} />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm((p) => ({ ...p, difficulty: v }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Topic (optional)</Label>
              <Input value={form.topic} onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))} placeholder="e.g. Algebra" />
            </div>
            <div>
              <Label>Section (optional)</Label>
              <Input value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} placeholder="e.g. Part A" />
            </div>
            <div>
              <Label>Explanation (shown after submit if enabled)</Label>
              <Textarea value={form.explanation} onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))} placeholder="Optional" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createQ.isPending || updateQ.isPending}>
              {editingQuestion ? 'Update' : 'Add'} question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove question?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deleteId) { deleteQ.mutate(deleteId); setDeleteId(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
