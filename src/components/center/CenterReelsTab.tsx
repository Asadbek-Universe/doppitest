import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Plus, Play, Eye, Heart, Clock, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { useCreateReel, useUpdateReel, useDeleteReel } from '@/hooks/useCenterData';
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
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
}

interface Reel {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  subject_id?: string | null;
  views_count: number;
  likes_count: number;
  is_published: boolean;
  created_at: string;
  subjects?: { name: string } | null;
}

interface CenterReelsTabProps {
  centerId: string;
  reels: Reel[];
  subjects: Subject[];
  maxReels: number;
}

export const CenterReelsTab: FC<CenterReelsTabProps> = ({
  centerId,
  reels,
  subjects,
  maxReels,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReel, setEditReel] = useState<Reel | null>(null);
  const [deleteReel, setDeleteReel] = useState<Reel | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration_seconds: '',
    subject_id: '',
    is_published: false,
  });

  const createReel = useCreateReel();
  const updateReel = useUpdateReel();
  const deleteReelMutation = useDeleteReel();
  const canCreate = reels.length < maxReels;

  const handleCreate = async () => {
    if (!form.title || !form.video_url) {
      toast.error('Title and video URL are required');
      return;
    }

    try {
      if (editReel) {
        await updateReel.mutateAsync({
          reelId: editReel.id,
          centerId,
          title: form.title,
          description: form.description || undefined,
          video_url: form.video_url,
          thumbnail_url: form.thumbnail_url || undefined,
          duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : undefined,
          subject_id: form.subject_id || undefined,
          is_published: form.is_published,
        });
        toast.success('Video updated');
      } else {
        await createReel.mutateAsync({
          center_id: centerId,
          title: form.title,
          description: form.description || undefined,
          video_url: form.video_url,
          thumbnail_url: form.thumbnail_url || undefined,
          duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : undefined,
          subject_id: form.subject_id || undefined,
        });
        toast.success('Reel created successfully');
      }
      setDialogOpen(false);
      setEditReel(null);
      setForm({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        duration_seconds: '',
        subject_id: '',
        is_published: false,
      });
    } catch {
      toast.error(editReel ? 'Failed to update video' : 'Failed to create reel');
    }
  };

  const openEdit = (reel: Reel) => {
    setEditReel(reel);
    setForm({
      title: reel.title,
      description: reel.description ?? '',
      video_url: reel.video_url,
      thumbnail_url: reel.thumbnail_url ?? '',
      duration_seconds: reel.duration_seconds?.toString() ?? '',
      subject_id: reel.subject_id ?? '',
      is_published: reel.is_published ?? false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteReel) return;
    try {
      await deleteReelMutation.mutateAsync({ reelId: deleteReel.id, centerId });
      toast.success('Video deleted');
      setDeleteReel(null);
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Usage Bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Short Videos Used</span>
              <span className="text-sm text-muted-foreground">
                {reels.length} / {maxReels}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(reels.length / maxReels) * 100}%` }}
              />
            </div>
            {!canCreate && (
              <p className="text-xs text-amber-600 mt-2">
                You've reached your video limit. Upgrade your plan for more.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Reels Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Short Videos
              </CardTitle>
              <CardDescription>Educational short-form video content</CardDescription>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setEditReel(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" disabled={!canCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editReel ? 'Edit Video' : 'Add New Short Video'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Video title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Video URL *</Label>
                    <Input
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail URL</Label>
                    <Input
                      value={form.thumbnail_url}
                      onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={form.duration_seconds}
                        onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select
                        value={form.subject_id}
                        onValueChange={(value) => setForm({ ...form, subject_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
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
                  </div>
                  {editReel && (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">Published</p>
                        <p className="text-xs text-muted-foreground">Visible in user feed</p>
                      </div>
                      <Switch
                        checked={form.is_published}
                        onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                      />
                    </div>
                  )}
                  <Button
                    onClick={handleCreate}
                    disabled={createReel.isPending || updateReel.isPending}
                    className="w-full"
                  >
                    {createReel.isPending || updateReel.isPending
                      ? 'Saving...'
                      : editReel
                        ? 'Save changes'
                        : 'Add Video'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {reels.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Videos Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create engaging short videos to attract students
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reels.map((reel, index) => (
                  <motion.div
                    key={reel.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative rounded-xl overflow-hidden bg-muted aspect-[9/16]"
                  >
                    {reel.thumbnail_url ? (
                      <img
                        src={reel.thumbnail_url}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Duration */}
                    {reel.duration_seconds && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(reel.duration_seconds)}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">{reel.title}</h4>
                      {reel.subjects?.name && (
                        <Badge variant="secondary" className="bg-white/20 text-white text-xs mb-2">
                          {reel.subjects.name}
                        </Badge>
                      )}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {reel.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {reel.likes_count}
                        </span>
                      </div>
                    </div>
                    
                    {/* Published Status */}
                    {!reel.is_published && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-amber-500/90 text-white text-xs">
                          Draft
                        </Badge>
                      </div>
                    )}
                    {/* Edit / Delete */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(reel);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-black/50 hover:bg-destructive text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteReel(reel);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={!!deleteReel} onOpenChange={(open) => !open && setDeleteReel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete video?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteReel?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteReelMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};