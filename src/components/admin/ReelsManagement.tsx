import { FC, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Video,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ApprovalStatus = "all" | "draft" | "pending_approval" | "approved" | "published" | "rejected";

type Reel = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  approval_status: string | null;
  rejection_reason: string | null;
  submitted_for_approval_at: string | null;
  is_published: boolean;
  views_count: number;
  likes_count: number;
  educational_centers: {
    id: string;
    name: string;
  } | null;
};

const useAllReels = (statusFilter: ApprovalStatus, search: string) => {
  return useQuery({
    queryKey: ["admin-reels", statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from("center_reels")
        .select(
          `
          id,
          title,
          description,
          created_at,
          approval_status,
          rejection_reason,
          submitted_for_approval_at,
          is_published,
          views_count,
          likes_count,
          educational_centers ( id, name )
        `
        )
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("approval_status", statusFilter);
      }

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Reel[];
    },
  });
};

const usePendingReelsCount = () => {
  return useQuery({
    queryKey: ["pending-reels-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("center_reels")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "pending_approval");
      if (error) throw error;
      return count || 0;
    },
  });
};

export const ReelsManagement: FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: reels, isLoading } = useAllReels(statusFilter, search);
  const { data: pendingCount } = usePendingReelsCount();

  const approveReel = useMutation({
    mutationFn: async (reelId: string) => {
      const { error } = await supabase
        .from("center_reels")
        .update({
          approval_status: "published",
          is_published: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id ?? null,
        })
        .eq("id", reelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      queryClient.invalidateQueries({ queryKey: ["pending-reels-count"] });
      toast.success("Reel approved and published");
      setSelectedReel(null);
    },
    onError: () => {
      toast.error("Failed to approve reel");
    },
  });

  const rejectReel = useMutation({
    mutationFn: async ({ reelId, reason }: { reelId: string; reason: string }) => {
      const { error } = await supabase
        .from("center_reels")
        .update({
          approval_status: "rejected",
          rejection_reason: reason,
          is_published: false,
        })
        .eq("id", reelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      queryClient.invalidateQueries({ queryKey: ["pending-reels-count"] });
      toast.success("Reel rejected");
      setRejectDialogOpen(false);
      setSelectedReel(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Failed to reject reel");
    },
  });

  const pauseReel = useMutation({
    mutationFn: async (reelId: string) => {
      const { error } = await supabase
        .from("center_reels")
        .update({
          approval_status: "approved",
          is_published: false,
        })
        .eq("id", reelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      toast.success("Reel unpublished");
    },
    onError: () => {
      toast.error("Failed to update reel status");
    },
  });

  const handleRejectConfirm = () => {
    if (!selectedReel || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectReel.mutate({ reelId: selectedReel.id, reason: rejectionReason.trim() });
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Reels Moderation
          </h2>
          <p className="text-muted-foreground">
            Review and moderate short videos uploaded by centers.
          </p>
        </div>
        {pendingCount !== undefined && pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1.5">
            <FileCheck className="w-4 h-4 mr-1" />
            {pendingCount} Pending Approval
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApprovalStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_approval">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Pending Approval
                  </span>
                </SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reels table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reels</CardTitle>
          <CardDescription>{reels?.length || 0} reels found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : reels && reels.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reels.map((reel) => (
                    <TableRow key={reel.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{reel.title}</span>
                          {reel.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {reel.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{reel.educational_centers?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {reel.approval_status || "draft"}
                        </Badge>
                        {reel.rejection_reason && (
                          <div className="mt-1 text-[11px] text-destructive max-w-[220px] line-clamp-1">
                            Reason: {reel.rejection_reason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>Views: {reel.views_count}</span>
                          <span>Likes: {reel.likes_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {reel.submitted_for_approval_at
                          ? new Date(reel.submitted_for_approval_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {reel.approval_status === "pending_approval" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveReel.mutate(reel.id)}
                              disabled={approveReel.isLoading}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedReel(reel);
                                setRejectionReason("");
                                setRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {reel.approval_status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseReel.mutate(reel.id)}
                            disabled={pauseReel.isLoading}
                          >
                            Unpublish
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reels found.</p>
          )}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject reel</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejection. This will be visible to the center so they can fix and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">{selectedReel?.title}</p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain what needs to be improved or fixed..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectReel.isLoading}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

