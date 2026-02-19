import { FC, useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  AlertCircle,
  Calendar,
  Users,
  Building2,
  Play,
  Pause,
  FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

type ApprovalStatus = "all" | "draft" | "pending_approval" | "approved" | "published" | "rejected";

interface Olympiad {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  max_participants: number | null;
  current_participants: number | null;
  is_public: boolean;
  status: string;
  approval_status: string;
  rejection_reason: string | null;
  submitted_for_approval_at: string | null;
  approved_at: string | null;
  rules: string | null;
  prize_description: string | null;
  subjects: { name: string } | null;
  educational_centers: { 
    id: string;
    name: string; 
    logo_url: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  pending_approval: { label: "Pending", color: "bg-amber-500/10 text-amber-600", icon: FileCheck },
  approved: { label: "Approved", color: "bg-blue-500/10 text-blue-600", icon: CheckCircle },
  published: { label: "Published", color: "bg-green-500/10 text-green-600", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const useAllOlympiads = (statusFilter: ApprovalStatus, search: string) => {
  return useQuery({
    queryKey: ["admin-olympiads", statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from("olympiads")
        .select(`
          *,
          subjects(name),
          educational_centers(id, name, logo_url)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("approval_status", statusFilter);
      }

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Olympiad[];
    },
  });
};

const usePendingOlympiadsCount = () => {
  return useQuery({
    queryKey: ["pending-olympiads-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("olympiads")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "pending_approval");

      if (error) throw error;
      return count || 0;
    },
  });
};

export const OlympiadsManagement: FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: olympiads, isLoading } = useAllOlympiads(statusFilter, search);
  const { data: pendingCount } = usePendingOlympiadsCount();

  const approveOlympiad = useMutation({
    mutationFn: async (olympiadId: string) => {
      const { error } = await supabase
        .from("olympiads")
        .update({
          approval_status: "published",
          is_published: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", olympiadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-olympiads"] });
      queryClient.invalidateQueries({ queryKey: ["pending-olympiads-count"] });
      toast.success("Olympiad approved and published");
      setSelectedOlympiad(null);
    },
    onError: () => {
      toast.error("Failed to approve olympiad");
    },
  });

  const rejectOlympiad = useMutation({
    mutationFn: async ({ olympiadId, reason }: { olympiadId: string; reason: string }) => {
      const { error } = await supabase
        .from("olympiads")
        .update({
          approval_status: "rejected",
          rejection_reason: reason,
          is_published: false,
        })
        .eq("id", olympiadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-olympiads"] });
      queryClient.invalidateQueries({ queryKey: ["pending-olympiads-count"] });
      toast.success("Olympiad rejected");
      setRejectDialogOpen(false);
      setSelectedOlympiad(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Failed to reject olympiad");
    },
  });

  const pauseOlympiad = useMutation({
    mutationFn: async (olympiadId: string) => {
      const { error } = await supabase
        .from("olympiads")
        .update({
          approval_status: "approved",
          is_published: false,
        })
        .eq("id", olympiadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-olympiads"] });
      toast.success("Olympiad paused (unpublished)");
    },
    onError: () => {
      toast.error("Failed to pause olympiad");
    },
  });

  const handleReject = () => {
    if (!selectedOlympiad || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectOlympiad.mutate({ olympiadId: selectedOlympiad.id, reason: rejectionReason });
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Olympiad Management
          </h2>
          <p className="text-muted-foreground">
            Review and manage olympiad competitions
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
                placeholder="Search olympiads..."
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

      {/* Olympiads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Olympiads</CardTitle>
          <CardDescription>
            {olympiads?.length || 0} olympiads found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : olympiads && olympiads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Olympiad</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {olympiads.map((olympiad) => {
                    const statusInfo = statusConfig[olympiad.approval_status] || statusConfig.draft;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <TableRow key={olympiad.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{olympiad.title}</p>
                            {olympiad.subjects && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {olympiad.subjects.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {olympiad.educational_centers ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={olympiad.educational_centers.logo_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {olympiad.educational_centers.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{olympiad.educational_centers.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No center</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(olympiad.start_date), "MMM d")}
                            </div>
                            <span className="text-muted-foreground text-xs">
                              to {format(new Date(olympiad.end_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {olympiad.current_participants || 0}
                            {olympiad.max_participants && ` / ${olympiad.max_participants}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOlympiad(olympiad)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {olympiad.approval_status === "pending_approval" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => approveOlympiad.mutate(olympiad.id)}
                                  disabled={approveOlympiad.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setSelectedOlympiad(olympiad);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {olympiad.approval_status === "published" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => pauseOlympiad.mutate(olympiad.id)}
                                disabled={pauseOlympiad.isPending}
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Olympiads Found</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No olympiads have been created yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedOlympiad && !rejectDialogOpen} onOpenChange={() => setSelectedOlympiad(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOlympiad && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {selectedOlympiad.title}
                </DialogTitle>
                <DialogDescription>
                  Review olympiad details before approval
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={statusConfig[selectedOlympiad.approval_status]?.color}>
                    {statusConfig[selectedOlympiad.approval_status]?.label}
                  </Badge>
                </div>

                {/* Center Info */}
                {selectedOlympiad.educational_centers && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedOlympiad.educational_centers.logo_url || undefined} />
                      <AvatarFallback>
                        {selectedOlympiad.educational_centers.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedOlympiad.educational_centers.name}</p>
                      <p className="text-sm text-muted-foreground">Organizing Center</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedOlympiad.description && (
                  <div>
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedOlympiad.description}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Start Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedOlympiad.start_date), "PPP 'at' p")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">End Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedOlympiad.end_date), "PPP 'at' p")}
                    </p>
                  </div>
                </div>

                {/* Rules */}
                {selectedOlympiad.rules && (
                  <div>
                    <h4 className="font-medium mb-1">Rules</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedOlympiad.rules}
                    </p>
                  </div>
                )}

                {/* Prize */}
                {selectedOlympiad.prize_description && (
                  <div>
                    <h4 className="font-medium mb-1">Prize</h4>
                    <p className="text-sm text-amber-600">{selectedOlympiad.prize_description}</p>
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {selectedOlympiad.approval_status === "rejected" && selectedOlympiad.rejection_reason && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-medium text-destructive mb-1">Rejection Reason</h4>
                    <p className="text-sm text-destructive/80">{selectedOlympiad.rejection_reason}</p>
                  </div>
                )}
              </div>

              {selectedOlympiad.approval_status === "pending_approval" && (
                <DialogFooter className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => approveOlympiad.mutate(selectedOlympiad.id)}
                    disabled={approveOlympiad.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Publish
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Reject Olympiad
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be visible to the center owner.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectOlympiad.isPending}
            >
              {rejectOlympiad.isPending ? "Rejecting..." : "Reject Olympiad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
