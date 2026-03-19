import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Plus, Calendar, Users, Lock, Globe, Clock, Settings, 
  Send, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, FileCheck,
  Eye, ListChecks
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useCreateOlympiad } from '@/hooks/useCenterData';
import { useSubmitForApproval, useUpdateOlympiad, useDeleteOlympiad, useResubmitOlympiad } from '@/hooks/useOlympiadApproval';
import { OlympiadParticipantsManager } from './OlympiadParticipantsManager';
import { OlympiadQuestionsManager } from './OlympiadQuestionsManager';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subject {
  id: string;
  name: string;
}

interface Olympiad {
  id: string;
  title: string;
  description?: string | null;
  subject_id?: string | null;
  start_date: string;
  end_date: string;
  registration_deadline?: string | null;
  max_participants?: number | null;
  current_participants: number;
  is_public: boolean;
  status: string;
  approval_status?: string;
  rejection_reason?: string | null;
  entry_code?: string | null;
  subjects?: { name: string } | null;
  prize_description?: string | null;
  rules?: string | null;
}

interface CenterOlympiadsTabProps {
  centerId: string;
  olympiads: Olympiad[];
  subjects: Subject[];
  canCreate: boolean;
}

const approvalStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Edit2 },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-500/10 text-amber-600', icon: FileCheck },
  approved: { label: 'Approved', color: 'bg-blue-500/10 text-blue-600', icon: CheckCircle },
  published: { label: 'Published', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export const CenterOlympiadsTab: FC<CenterOlympiadsTabProps> = ({
  centerId,
  olympiads,
  subjects,
  canCreate,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOlympiad, setEditingOlympiad] = useState<Olympiad | null>(null);
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [manageQuestionsOlympiad, setManageQuestionsOlympiad] = useState<Olympiad | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [olympiadToDelete, setOlympiadToDelete] = useState<Olympiad | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    grade: '',
    language: 'en',
    difficulty_level: '',
    thumbnail_url: '',
    banner_url: '',
    start_date: '',
    end_date: '',
    registration_start_date: '',
    registration_deadline: '',
    max_participants: '',
    entry_code: '',
    is_public: true,
    duration_minutes: '',
    auto_submit_when_time_ends: true,
    allow_back_navigation: true,
    shuffle_questions: true,
    shuffle_options: true,
    show_results_immediately: false,
    show_correct_after_submit: false,
    anti_cheat_disable_copy_paste: true,
    prize_description: '',
    rules: '',
  });

  const createOlympiad = useCreateOlympiad();
  const updateOlympiad = useUpdateOlympiad();
  const submitForApproval = useSubmitForApproval();
  const resubmitOlympiad = useResubmitOlympiad();
  const deleteOlympiad = useDeleteOlympiad();

  if (manageQuestionsOlympiad) {
    return (
      <OlympiadQuestionsManager
        olympiad={manageQuestionsOlympiad}
        onBack={() => setManageQuestionsOlympiad(null)}
      />
    );
  }
  if (selectedOlympiad) {
    return (
      <OlympiadParticipantsManager
        olympiad={selectedOlympiad}
        onBack={() => setSelectedOlympiad(null)}
      />
    );
  }

  const resetForm = () => {
    setFormStep(1);
    setForm({
      title: '',
      description: '',
      subject_id: '',
      grade: '',
      language: 'en',
      difficulty_level: '',
      thumbnail_url: '',
      banner_url: '',
      start_date: '',
      end_date: '',
      registration_start_date: '',
      registration_deadline: '',
      max_participants: '',
      entry_code: '',
      is_public: true,
      duration_minutes: '',
      auto_submit_when_time_ends: true,
      allow_back_navigation: true,
      shuffle_questions: true,
      shuffle_options: true,
      show_results_immediately: false,
      show_correct_after_submit: false,
      anti_cheat_disable_copy_paste: true,
      prize_description: '',
      rules: '',
    });
    setEditingOlympiad(null);
  };

  const openEditDialog = (olympiad: Olympiad) => {
    setEditingOlympiad(olympiad);
    const o = olympiad as Olympiad & {
      grade?: string; language?: string; difficulty_level?: string; thumbnail_url?: string; banner_url?: string;
      registration_start_date?: string; duration_minutes?: number; auto_submit_when_time_ends?: boolean;
      allow_back_navigation?: boolean; shuffle_questions?: boolean; shuffle_options?: boolean;
      show_results_immediately?: boolean; show_correct_after_submit?: boolean; anti_cheat_disable_copy_paste?: boolean;
    };
    setForm({
      title: olympiad.title,
      description: olympiad.description || '',
      subject_id: olympiad.subject_id || '',
      grade: o.grade || '',
      language: o.language || 'en',
      difficulty_level: o.difficulty_level || '',
      thumbnail_url: o.thumbnail_url || '',
      banner_url: o.banner_url || '',
      start_date: olympiad.start_date ? olympiad.start_date.slice(0, 16) : '',
      end_date: olympiad.end_date ? olympiad.end_date.slice(0, 16) : '',
      registration_start_date: o.registration_start_date ? o.registration_start_date.slice(0, 16) : '',
      registration_deadline: olympiad.registration_deadline ? olympiad.registration_deadline.slice(0, 16) : '',
      max_participants: olympiad.max_participants?.toString() || '',
      entry_code: olympiad.entry_code || '',
      is_public: olympiad.is_public,
      duration_minutes: o.duration_minutes?.toString() || '',
      auto_submit_when_time_ends: o.auto_submit_when_time_ends ?? true,
      allow_back_navigation: o.allow_back_navigation ?? true,
      shuffle_questions: o.shuffle_questions ?? true,
      shuffle_options: o.shuffle_options ?? true,
      show_results_immediately: o.show_results_immediately ?? false,
      show_correct_after_submit: o.show_correct_after_submit ?? false,
      anti_cheat_disable_copy_paste: o.anti_cheat_disable_copy_paste ?? true,
      prize_description: olympiad.prize_description || '',
      rules: olympiad.rules || '',
    });
    setFormStep(1);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title || !form.start_date || !form.end_date) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingOlympiad) {
        await updateOlympiad.mutateAsync({
          olympiadId: editingOlympiad.id,
          title: form.title,
          description: form.description || undefined,
          subject_id: form.subject_id || undefined,
          grade: form.grade || undefined,
          language: form.language || undefined,
          difficulty_level: form.difficulty_level || undefined,
          thumbnail_url: form.thumbnail_url || undefined,
          banner_url: form.banner_url || undefined,
          start_date: form.start_date,
          end_date: form.end_date,
          registration_start_date: form.registration_start_date || undefined,
          registration_deadline: form.registration_deadline || undefined,
          max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
          entry_code: form.entry_code || undefined,
          is_public: form.is_public,
          duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
          auto_submit_when_time_ends: form.auto_submit_when_time_ends,
          allow_back_navigation: form.allow_back_navigation,
          shuffle_questions: form.shuffle_questions,
          shuffle_options: form.shuffle_options,
          show_results_immediately: form.show_results_immediately,
          show_correct_after_submit: form.show_correct_after_submit,
          anti_cheat_disable_copy_paste: form.anti_cheat_disable_copy_paste,
          prize_description: form.prize_description || undefined,
          rules: form.rules || undefined,
        });
      } else {
        await createOlympiad.mutateAsync({
          center_id: centerId,
          title: form.title,
          description: form.description || undefined,
          subject_id: form.subject_id || undefined,
          grade: form.grade || undefined,
          language: form.language || undefined,
          difficulty_level: form.difficulty_level || undefined,
          thumbnail_url: form.thumbnail_url || undefined,
          banner_url: form.banner_url || undefined,
          start_date: form.start_date,
          end_date: form.end_date,
          registration_start_date: form.registration_start_date || undefined,
          registration_deadline: form.registration_deadline || undefined,
          max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
          entry_code: form.entry_code || undefined,
          is_public: form.is_public,
          duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
          auto_submit_when_time_ends: form.auto_submit_when_time_ends,
          allow_back_navigation: form.allow_back_navigation,
          shuffle_questions: form.shuffle_questions,
          shuffle_options: form.shuffle_options,
          show_results_immediately: form.show_results_immediately,
          show_correct_after_submit: form.show_correct_after_submit,
          anti_cheat_disable_copy_paste: form.anti_cheat_disable_copy_paste,
          prize_description: form.prize_description || undefined,
          rules: form.rules || undefined,
        });
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error already handled in mutation
    }
  };

  const handleSubmitForApproval = (olympiadId: string) => {
    submitForApproval.mutate(olympiadId);
  };

  const handleResubmit = (olympiadId: string) => {
    resubmitOlympiad.mutate(olympiadId);
  };

  const handleDelete = () => {
    if (olympiadToDelete) {
      deleteOlympiad.mutate(olympiadToDelete.id);
      setDeleteDialogOpen(false);
      setOlympiadToDelete(null);
    }
  };

  const canEdit = (olympiad: Olympiad) => {
    return olympiad.approval_status === 'draft' || olympiad.approval_status === 'rejected';
  };

  const canSubmit = (olympiad: Olympiad) => {
    return olympiad.approval_status === 'draft' && olympiad.title && olympiad.start_date && olympiad.end_date;
  };

  return (
    <div className="space-y-6">
      {!canCreate && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/20">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Olympiad creation requires permission</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your current plan does not include organizing olympiads. Upgrade to Pro or Enterprise to create and manage olympiads, then submit them for admin approval.
                  </p>
                </div>
                <Button className="shrink-0" size="sm" variant="outline" asChild>
                  <Link to="/center-panel/profile">View plan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Your Olympiads
              </CardTitle>
              <CardDescription>
                Create and manage olympiad competitions. Submit for admin approval to publish.
              </CardDescription>
            </div>
            {canCreate && (
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Olympiad
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOlympiad ? 'Edit Olympiad' : 'Create New Olympiad'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingOlympiad 
                        ? 'Update olympiad details. Use Manage Questions to add questions, then submit for approval.'
                        : 'Configure all sections. After saving, add questions and submit for admin approval.'}
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs value={String(formStep)} onValueChange={(v) => setFormStep(parseInt(v, 10))} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="1">Basic</TabsTrigger>
                      <TabsTrigger value="2">Registration</TabsTrigger>
                      <TabsTrigger value="3">Schedule</TabsTrigger>
                      <TabsTrigger value="4">Rules</TabsTrigger>
                    </TabsList>
                    <TabsContent value="1" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Olympiad title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="About the olympiad..." rows={2} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {subjects.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Grade</Label>
                          <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. 9th" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="uz">O'zbek</SelectItem>
                              <SelectItem value="ru">Русский</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select value={form.difficulty_level} onValueChange={(v) => setForm({ ...form, difficulty_level: v })}>
                            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Thumbnail URL</Label>
                          <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Banner URL (optional)</Label>
                          <Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} placeholder="https://..." />
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="2" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Registration start</Label>
                          <Input type="datetime-local" value={form.registration_start_date} onChange={(e) => setForm({ ...form, registration_start_date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Registration deadline</Label>
                          <Input type="datetime-local" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Max participants (optional)</Label>
                        <Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} placeholder="Unlimited" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">Public (anyone can register)</p>
                          <p className="text-xs text-muted-foreground">Turn off for private / invite code</p>
                        </div>
                        <Switch checked={form.is_public} onCheckedChange={(c) => setForm({ ...form, is_public: c })} />
                      </div>
                      {!form.is_public && (
                        <div className="space-y-2">
                          <Label>Invite / entry code</Label>
                          <Input value={form.entry_code} onChange={(e) => setForm({ ...form, entry_code: e.target.value })} placeholder="Secret code" />
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="3" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start date & time *</Label>
                          <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>End date & time *</Label>
                          <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="e.g. 60" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">Auto-submit when time ends</p>
                          <p className="text-xs text-muted-foreground">Submit attempt automatically when timer reaches zero</p>
                        </div>
                        <Switch checked={form.auto_submit_when_time_ends} onCheckedChange={(c) => setForm({ ...form, auto_submit_when_time_ends: c })} />
                      </div>
                    </TabsContent>
                    <TabsContent value="4" className="space-y-4 pt-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Allow back navigation</span>
                        <Switch checked={form.allow_back_navigation} onCheckedChange={(c) => setForm({ ...form, allow_back_navigation: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Shuffle questions</span>
                        <Switch checked={form.shuffle_questions} onCheckedChange={(c) => setForm({ ...form, shuffle_questions: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Shuffle options</span>
                        <Switch checked={form.shuffle_options} onCheckedChange={(c) => setForm({ ...form, shuffle_options: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Show results immediately</span>
                        <Switch checked={form.show_results_immediately} onCheckedChange={(c) => setForm({ ...form, show_results_immediately: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Show correct answers after submit</span>
                        <Switch checked={form.show_correct_after_submit} onCheckedChange={(c) => setForm({ ...form, show_correct_after_submit: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Anti-cheat (disable copy/paste)</span>
                        <Switch checked={form.anti_cheat_disable_copy_paste} onCheckedChange={(c) => setForm({ ...form, anti_cheat_disable_copy_paste: c })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Prize description</Label>
                        <Textarea value={form.prize_description} onChange={(e) => setForm({ ...form, prize_description: e.target.value })} placeholder="What do winners receive?" rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label>Rules</Label>
                        <Textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Competition rules..." rows={3} />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter>
                      <Button 
                        onClick={handleCreate} 
                        disabled={createOlympiad.isPending || updateOlympiad.isPending} 
                        className="w-full"
                      >
                        {createOlympiad.isPending || updateOlympiad.isPending 
                          ? 'Saving...' 
                          : editingOlympiad ? 'Save Changes' : 'Create Draft'}
                      </Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {olympiads.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Olympiads Yet</h3>
                <p className="text-sm text-muted-foreground">
                  {canCreate
                    ? 'Create your first olympiad to engage students'
                    : 'Upgrade your plan to create olympiads'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {olympiads.map((olympiad) => {
                    const approvalStatus = approvalStatusConfig[olympiad.approval_status || 'draft'] || approvalStatusConfig.draft;
                    const ApprovalIcon = approvalStatus.icon;

                    return (
                      <TableRow key={olympiad.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{olympiad.title}</p>
                            {olympiad.approval_status === 'rejected' && olympiad.rejection_reason && (
                              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {olympiad.rejection_reason}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{olympiad.subjects?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(olympiad.start_date), 'MMM d')}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(olympiad.end_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {olympiad.current_participants}
                            {olympiad.max_participants && ` / ${olympiad.max_participants}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={approvalStatus.color}>
                              <ApprovalIcon className="w-3 h-3 mr-1" />
                              {approvalStatus.label}
                            </Badge>
                            {olympiad.is_public ? (
                              <Badge variant="outline" className="gap-1 text-xs w-fit">
                                <Globe className="w-3 h-3" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-xs w-fit">
                                <Lock className="w-3 h-3" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Manage Questions (draft/rejected) */}
                            {canEdit(olympiad) && canCreate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setManageQuestionsOlympiad(olympiad)}
                                title="Manage Questions"
                              >
                                <ListChecks className="w-4 h-4" />
                              </Button>
                            )}
                            {/* View/Manage Participants */}
                            {(olympiad.approval_status === 'published' || olympiad.approval_status === 'approved') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedOlympiad(olympiad)}
                                title="Manage Participants"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {/* Edit (only draft/rejected) */}
                            {canEdit(olympiad) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditDialog(olympiad)}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {/* Submit for Approval (only draft) */}
                            {canSubmit(olympiad) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-primary hover:text-primary"
                                onClick={() => handleSubmitForApproval(olympiad.id)}
                                disabled={submitForApproval.isPending}
                                title="Submit for Approval"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Resubmit (only rejected) */}
                            {olympiad.approval_status === 'rejected' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-primary hover:text-primary"
                                onClick={() => handleResubmit(olympiad.id)}
                                disabled={resubmitOlympiad.isPending}
                                title="Resubmit for Approval"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {/* Delete (only draft/rejected) */}
                            {canEdit(olympiad) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setOlympiadToDelete(olympiad);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Olympiad?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the olympiad "{olympiadToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOlympiadToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
