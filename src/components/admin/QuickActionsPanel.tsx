import { FC, useState } from 'react';
import {
  Users,
  Building2,
  CheckCircle,
  UserCog,
  Shield,
  Zap,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAllUsers, useAllCenters, useBulkAssignRole, useBulkVerifyCenters, useAllUserRoles } from '@/hooks/useAdminData';

type Props = {
  onNavigateToUsers?: () => void;
  onNavigateToCenters?: () => void;
  onNavigateToPending?: () => void;
};

export const QuickActionsPanel: FC<Props> = ({
  onNavigateToUsers,
  onNavigateToCenters,
  onNavigateToPending,
}) => {
  const { data: users } = useAllUsers();
  const { data: centers } = useAllCenters();
  const { data: userRoles } = useAllUserRoles();
  const bulkAssignRole = useBulkAssignRole();
  const bulkVerifyCenters = useBulkVerifyCenters();

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUsersForRole, setSelectedUsersForRole] = useState<Set<string>>(new Set());
  const [targetRole, setTargetRole] = useState<'admin' | 'center' | 'user'>('user');

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedCentersForVerify, setSelectedCentersForVerify] = useState<Set<string>>(new Set());

  const pendingCenters = centers?.filter(c => !c.is_verified) || [];
  const recentUsers = users?.slice(0, 10) || [];

  const getUserRole = (userId: string) => {
    return userRoles?.find(r => r.user_id === userId)?.role || 'user';
  };

  const handleBulkRoleAssign = async () => {
    if (selectedUsersForRole.size === 0) {
      toast.error('Select at least one user');
      return;
    }
    try {
      await bulkAssignRole.mutateAsync({
        userIds: Array.from(selectedUsersForRole),
        role: targetRole,
      });
      toast.success(`Role "${targetRole}" assigned to ${selectedUsersForRole.size} user(s)`);
      setRoleDialogOpen(false);
      setSelectedUsersForRole(new Set());
    } catch {
      toast.error('Failed to assign roles');
    }
  };

  const handleBulkVerify = async () => {
    if (selectedCentersForVerify.size === 0) {
      toast.error('Select at least one center');
      return;
    }
    try {
      await bulkVerifyCenters.mutateAsync({
        centerIds: Array.from(selectedCentersForVerify),
        verified: true,
      });
      toast.success(`${selectedCentersForVerify.size} center(s) verified`);
      setVerifyDialogOpen(false);
      setSelectedCentersForVerify(new Set());
    } catch {
      toast.error('Failed to verify centers');
    }
  };

  const handleVerifyAllPending = async () => {
    if (pendingCenters.length === 0) {
      toast.info('No pending centers to verify');
      return;
    }
    try {
      await bulkVerifyCenters.mutateAsync({
        centerIds: pendingCenters.map(c => c.id),
        verified: true,
      });
      toast.success(`All ${pendingCenters.length} pending centers verified`);
    } catch {
      toast.error('Failed to verify centers');
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSet = new Set(selectedUsersForRole);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUsersForRole(newSet);
  };

  const toggleCenterSelection = (centerId: string) => {
    const newSet = new Set(selectedCentersForVerify);
    if (newSet.has(centerId)) {
      newSet.delete(centerId);
    } else {
      newSet.add(centerId);
    }
    setSelectedCentersForVerify(newSet);
  };

  const selectAllPendingCenters = () => {
    setSelectedCentersForVerify(new Set(pendingCenters.map(c => c.id)));
  };

  return (
    <>
      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Bulk Role Assignment */}
        <button
          onClick={() => setRoleDialogOpen(true)}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <UserCog className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <h3 className="mt-3 font-semibold">Bulk Role Assignment</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign roles to multiple users at once
          </p>
          <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </button>

        {/* Quick Verify */}
        <button
          onClick={() => setVerifyDialogOpen(true)}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            {pendingCenters.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {pendingCenters.length}
              </Badge>
            )}
          </div>
          <h3 className="mt-3 font-semibold">Verify Centers</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Review and approve pending centers
          </p>
          <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </button>

        {/* Verify All */}
        <button
          onClick={handleVerifyAllPending}
          disabled={pendingCenters.length === 0}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/50 disabled:hover:shadow-none"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <h3 className="mt-3 font-semibold">Verify All Pending</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {pendingCenters.length > 0 ? `Approve all ${pendingCenters.length} centers` : 'No pending centers'}
          </p>
          <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </button>

        {/* Navigation Shortcuts */}
        <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" />
            Quick Navigate
          </div>
          <div className="flex flex-col gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 justify-start text-xs" onClick={onNavigateToUsers}>
              <Users className="mr-2 h-3.5 w-3.5" /> Users
            </Button>
            <Button variant="ghost" size="sm" className="h-8 justify-start text-xs" onClick={onNavigateToCenters}>
              <Building2 className="mr-2 h-3.5 w-3.5" /> Centers
            </Button>
            <Button variant="ghost" size="sm" className="h-8 justify-start text-xs" onClick={onNavigateToPending}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Pending
              {pendingCenters.length > 0 && (
                <Badge variant="destructive" className="ml-auto h-4 px-1 text-[10px]">
                  {pendingCenters.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Role Assignment Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Role Assignment</DialogTitle>
            <DialogDescription>
              Select users and assign them a role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <Select value={targetRole} onValueChange={(v) => setTargetRole(v as 'admin' | 'center' | 'user')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Users</label>
                <span className="text-xs text-muted-foreground">
                  {selectedUsersForRole.size} selected
                </span>
              </div>
              <ScrollArea className="h-[200px] rounded-lg border p-2">
                <div className="space-y-1">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedUsersForRole.has(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate font-medium">
                          {user.display_name || 'No name'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current: {getUserRole(user.user_id)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkRoleAssign}
              disabled={selectedUsersForRole.size === 0 || bulkAssignRole.isPending}
            >
              {bulkAssignRole.isPending ? 'Assigning...' : `Assign to ${selectedUsersForRole.size} user(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Verify Centers Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Center Verification</DialogTitle>
            <DialogDescription>
              Select centers to verify
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {pendingCenters.length} pending verification
              </span>
              <Button variant="ghost" size="sm" onClick={selectAllPendingCenters}>
                Select All
              </Button>
            </div>

            <ScrollArea className="h-[250px] rounded-lg border p-2">
              {pendingCenters.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  All centers are verified
                </div>
              ) : (
                <div className="space-y-1">
                  {pendingCenters.map((center) => (
                    <div
                      key={center.id}
                      className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedCentersForVerify.has(center.id)}
                        onCheckedChange={() => toggleCenterSelection(center.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {center.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {center.city || 'No location'} • {center.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkVerify}
              disabled={selectedCentersForVerify.size === 0 || bulkVerifyCenters.isPending}
            >
              {bulkVerifyCenters.isPending ? 'Verifying...' : `Verify ${selectedCentersForVerify.size} center(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
