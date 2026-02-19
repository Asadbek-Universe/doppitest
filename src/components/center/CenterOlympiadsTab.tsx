import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Plus, Calendar, Users, Lock, Globe, Clock, Settings, 
  Send, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, FileCheck,
  Eye
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [olympiadToDelete, setOlympiadToDelete] = useState<Olympiad | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_participants: '',
    entry_code: '',
    is_public: true,
    prize_description: '',
    rules: '',
  });

  const createOlympiad = useCreateOlympiad();
  const updateOlympiad = useUpdateOlympiad();
  const submitForApproval = useSubmitForApproval();
  const resubmitOlympiad = useResubmitOlympiad();
  const deleteOlympiad = useDeleteOlympiad();

  // If managing participants, show the participant manager
  if (selectedOlympiad) {
    return (
      <OlympiadParticipantsManager
        olympiad={selectedOlympiad}
        onBack={() => setSelectedOlympiad(null)}
      />
    );
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      subject_id: '',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      max_participants: '',
      entry_code: '',
      is_public: true,
      prize_description: '',
      rules: '',
    });
    setEditingOlympiad(null);
  };

  const openEditDialog = (olympiad: Olympiad) => {
    setEditingOlympiad(olympiad);
    setForm({
      title: olympiad.title,
      description: olympiad.description || '',
      subject_id: '',
      start_date: olympiad.start_date ? olympiad.start_date.slice(0, 16) : '',
      end_date: olympiad.end_date ? olympiad.end_date.slice(0, 16) : '',
      registration_deadline: olympiad.registration_deadline ? olympiad.registration_deadline.slice(0, 16) : '',
      max_participants: olympiad.max_participants?.toString() || '',
      entry_code: olympiad.entry_code || '',
      is_public: olympiad.is_public,
      prize_description: olympiad.prize_description || '',
      rules: olympiad.rules || '',
    });
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
          start_date: form.start_date,
          end_date: form.end_date,
          registration_deadline: form.registration_deadline || undefined,
          max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
          entry_code: form.entry_code || undefined,
          is_public: form.is_public,
          prize_description: form.prize_description || undefined,
          rules: form.rules || undefined,
        });
      } else {
        await createOlympiad.mutateAsync({
          center_id: centerId,
          title: form.title,
          description: form.description || undefined,
          subject_id: form.subject_id || undefined,
          start_date: form.start_date,
          end_date: form.end_date,
          registration_deadline: form.registration_deadline || undefined,
          max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
          entry_code: form.entry_code || undefined,
          is_public: form.is_public,
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
                <div>
                  <h3 className="font-semibold">Olympiad Creation Locked</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade your plan to Pro or Enterprise to create olympiads
                  </p>
                </div>
                <Button className="ml-auto" size="sm">
                  Upgrade Plan
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
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOlympiad ? 'Edit Olympiad' : 'Create New Olympiad'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingOlympiad 
                        ? 'Update olympiad details. You can submit for approval after saving.'
                        : 'Create a draft olympiad. You\'ll need to submit it for admin approval before it goes live.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Olympiad title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="About the olympiad..."
                        rows={3}
                      />
                    </div>
                    {!editingOlympiad && (
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select
                          value={form.subject_id}
                          onValueChange={(value) => setForm({ ...form, subject_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date *</Label>
                        <Input
                          type="datetime-local"
                          value={form.start_date}
                          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date *</Label>
                        <Input
                          type="datetime-local"
                          value={form.end_date}
                          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Registration Deadline</Label>
                        <Input
                          type="datetime-local"
                          value={form.registration_deadline}
                          onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Participants</Label>
                        <Input
                          type="number"
                          value={form.max_participants}
                          onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">Public Olympiad</p>
                        <p className="text-xs text-muted-foreground">Anyone can view and register</p>
                      </div>
                      <Switch
                        checked={form.is_public}
                        onCheckedChange={(checked) => setForm({ ...form, is_public: checked })}
                      />
                    </div>
                    {!form.is_public && (
                      <div className="space-y-2">
                        <Label>Entry Code</Label>
                        <Input
                          value={form.entry_code}
                          onChange={(e) => setForm({ ...form, entry_code: e.target.value })}
                          placeholder="Secret code for registration"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Prize Description</Label>
                      <Textarea
                        value={form.prize_description}
                        onChange={(e) => setForm({ ...form, prize_description: e.target.value })}
                        placeholder="What do winners receive?"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rules</Label>
                      <Textarea
                        value={form.rules}
                        onChange={(e) => setForm({ ...form, rules: e.target.value })}
                        placeholder="Competition rules..."
                        rows={3}
                      />
                    </div>
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
                  </div>
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
