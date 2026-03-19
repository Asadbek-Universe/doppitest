import { FC, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpen, ClipboardList, AlertCircle } from "lucide-react";

type ApprovalStatus = "draft" | "pending_approval" | "approved" | "published" | "rejected";

interface BaseContent {
  id: string;
  title: string;
  created_at: string;
  approval_status: ApprovalStatus | null;
  rejection_reason: string | null;
  submitted_for_approval_at: string | null;
  subjects: { name: string } | null;
  educational_centers: {
    id: string;
    name: string;
  } | null;
}

type PendingCourse = BaseContent;
type PendingTest = BaseContent;

const statusBadge = (status: ApprovalStatus | null) => {
  switch (status) {
    case "pending_approval":
      return <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/30 text-xs">Pending</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
    case "approved":
      return <Badge className="bg-blue-500/10 text-blue-700 border border-blue-500/30 text-xs">Approved</Badge>;
    case "published":
      return <Badge className="bg-green-500/10 text-green-700 border border-green-500/30 text-xs">Published</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Draft</Badge>;
  }
};

const usePendingCourses = () => {
  return useQuery({
    queryKey: ["admin-pending-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          `
          id,
          title,
          created_at,
          approval_status,
          rejection_reason,
          submitted_for_approval_at,
          subjects ( name ),
          educational_centers ( id, name )
        `
        )
        .eq("approval_status", "pending_approval")
        .order("submitted_for_approval_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PendingCourse[];
    },
  });
};

const usePendingTests = () => {
  return useQuery({
    queryKey: ["admin-pending-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select(
          `
          id,
          title,
          created_at,
          approval_status,
          rejection_reason,
          submitted_for_approval_at,
          subjects ( name ),
          educational_centers ( id, name )
        `
        )
        .eq("approval_status", "pending_approval")
        .order("submitted_for_approval_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PendingTest[];
    },
  });
};

export const CourseTestApprovalPanel: FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingCourses, isLoading: loadingCourses } = usePendingCourses();
  const { data: pendingTests, isLoading: loadingTests } = usePendingTests();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: "course" | "test"; id: string; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const approveCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("courses")
        .update({
          approval_status: "published",
          is_published: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id ?? null,
        })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course approved and published");
    },
    onError: () => {
      toast.error("Failed to approve course");
    },
  });

  const approveTest = useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase
        .from("tests")
        .update({
          approval_status: "published",
          is_published: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id ?? null,
        })
        .eq("id", testId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-tests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
      toast.success("Test approved and published");
    },
    onError: () => {
      toast.error("Failed to approve test");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      type,
      id,
      reason,
    }: {
      type: "course" | "test";
      id: string;
      reason: string;
    }) => {
      const table = type === "course" ? "courses" : "tests";
      const { error } = await supabase
        .from(table)
        .update({
          approval_status: "rejected",
          rejection_reason: reason,
          is_published: false,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-tests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
      toast.success("Content rejected");
      setRejectDialogOpen(false);
      setRejectTarget(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Failed to reject content");
    },
  });

  const openRejectDialog = (type: "course" | "test", id: string, title: string) => {
    setRejectTarget({ type, id, title });
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({ type: rejectTarget.type, id: rejectTarget.id, reason: rejectionReason.trim() });
  };

  const isEmpty = !loadingCourses && !loadingTests && (!pendingCourses?.length && !pendingTests?.length);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Pending Courses</CardTitle>
                <CardDescription>Review courses submitted by centers</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {pendingCourses?.length ?? 0} pending
            </Badge>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <p className="text-sm text-muted-foreground">Loading courses...</p>
            ) : pendingCourses && pendingCourses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCourses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.title}</span>
                          {c.submitted_for_approval_at && (
                            <span className="text-xs text-muted-foreground">
                              Submitted {new Date(c.submitted_for_approval_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{c.educational_centers?.name ?? "—"}</TableCell>
                      <TableCell>{c.subjects?.name ?? "—"}</TableCell>
                      <TableCell>{statusBadge(c.approval_status ?? "pending_approval")}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveCourse.mutate(c.id)}
                          disabled={approveCourse.isLoading}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog("course", c.id, c.title)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No courses waiting for approval.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Pending Tests</CardTitle>
                <CardDescription>Review tests submitted by centers</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {pendingTests?.length ?? 0} pending
            </Badge>
          </CardHeader>
          <CardContent>
            {loadingTests ? (
              <p className="text-sm text-muted-foreground">Loading tests...</p>
            ) : pendingTests && pendingTests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTests.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{t.title}</span>
                          {t.submitted_for_approval_at && (
                            <span className="text-xs text-muted-foreground">
                              Submitted {new Date(t.submitted_for_approval_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{t.educational_centers?.name ?? "—"}</TableCell>
                      <TableCell>{t.subjects?.name ?? "—"}</TableCell>
                      <TableCell>{statusBadge(t.approval_status ?? "pending_approval")}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveTest.mutate(t.id)}
                          disabled={approveTest.isLoading}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog("test", t.id, t.title)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No tests waiting for approval.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {isEmpty && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <span>No courses or tests are currently awaiting approval.</span>
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.type === "test" ? "test" : "course"}</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejection. This will be visible to the center so they can fix and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">{rejectTarget?.title}</p>
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
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={rejectMutation.isLoading}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

