import { FC, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Users,
  Search,
  Shield,
  Building2,
  User,
  Eye,
  Filter,
  UserCheck,
  Crown,
  Ban,
  Trash2,
  MoreHorizontal,
  ShieldOff,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TablePagination } from '@/components/TablePagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  phone: string | null;
  gender: string | null;
  grade: string | null;
  studies_at_center: boolean | null;
  center_name: string | null;
  purpose: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
  blocked_at?: string | null;
  last_activity_at?: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'center' | 'user';
}

interface UsersManagementProps {
  users: UserProfile[] | undefined;
  userRoles: UserRole[] | undefined;
  selectedUsers: Set<string>;
  onToggleUser: (userId: string) => void;
  onToggleAll: () => void;
  onBulkRoleChange: (role: 'admin' | 'center' | 'user') => void;
  onBulkBlock?: (block: boolean) => void;
  onRoleChange: (userId: string, role: 'admin' | 'center' | 'user') => void;
  onViewUser: (user: UserProfile) => void;
  onBlockUser?: (userId: string, block: boolean) => void;
  onDeleteUser?: (userId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const roleConfig = {
  admin: {
    icon: Crown,
    label: 'Admin',
    className: 'bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/25',
  },
  center: {
    icon: Building2,
    label: 'Center',
    className: 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25',
  },
  user: {
    icon: User,
    label: 'User',
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  },
};

export const UsersManagement: FC<UsersManagementProps> = ({
  users,
  userRoles,
  selectedUsers,
  onToggleUser,
  onToggleAll,
  onBulkRoleChange,
  onBulkBlock,
  onRoleChange,
  onViewUser,
  onBlockUser,
  onDeleteUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [actionUser, setActionUser] = useState<UserProfile | null>(null);

  const getUserRole = (userId: string): 'admin' | 'center' | 'user' => {
    return userRoles?.find((r) => r.user_id === userId)?.role || 'user';
  };

  const getUserStatus = (user: UserProfile): 'active' | 'blocked' => {
    return user.blocked_at ? 'blocked' : 'active';
  };

  const filteredUsers = useMemo(() => {
    return users?.filter((u) => {
      const matchesSearch =
        !search ||
        u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.city?.toLowerCase().includes(search.toLowerCase());
      const userRole = getUserRole(u.user_id);
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;
      const userStatus = getUserStatus(u);
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter, userRoles]);

  const totalPages = Math.ceil((filteredUsers?.length || 0) / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers?.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  // Stats
  const totalUsers = users?.length || 0;
  const activeCount = users?.filter((u) => !u.blocked_at).length || 0;
  const blockedCount = users?.filter((u) => u.blocked_at).length || 0;
  const adminCount = users?.filter((u) => getUserRole(u.user_id) === 'admin').length || 0;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleBlockClick = (user: UserProfile) => {
    setActionUser(user);
    setBlockDialogOpen(true);
  };

  const handleDeleteClick = (user: UserProfile) => {
    setActionUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmBlock = () => {
    if (actionUser && onBlockUser) {
      const isBlocked = !!actionUser.blocked_at;
      onBlockUser(actionUser.user_id, !isBlocked);
    }
    setBlockDialogOpen(false);
    setActionUser(null);
  };

  const confirmDelete = () => {
    if (actionUser && onDeleteUser) {
      onDeleteUser(actionUser.user_id);
    }
    setDeleteDialogOpen(false);
    setActionUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards - Sticky */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-1 px-1 pt-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Ban className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{blockedCount}</p>
                    <p className="text-xs text-muted-foreground">Blocked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                    <p className="text-xs text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">User Management</CardTitle>
                <p className="text-sm text-muted-foreground">{filteredUsers?.length || 0} users found</p>
              </div>
            </div>
            {selectedUsers.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-lg border border-primary/20"
              >
                <span className="text-sm font-medium text-primary">{selectedUsers.size} selected</span>
                <Select onValueChange={(value) => onBulkRoleChange(value as 'admin' | 'center' | 'user')}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Assign role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Set as User</SelectItem>
                    <SelectItem value="center">Set as Center</SelectItem>
                    <SelectItem value="admin">Set as Admin</SelectItem>
                  </SelectContent>
                </Select>
                {onBulkBlock && (
                  <>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => onBulkBlock(true)}>
                      <Ban className="w-3.5 h-3.5 mr-1.5" />
                      Block
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => onBulkBlock(false)}>
                      <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                      Unblock
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or city..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-muted/50 border-transparent focus:border-primary/30 focus:bg-card transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger className="w-full sm:w-32 bg-muted/50 border-transparent">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-32 bg-muted/50 border-transparent">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedUsers?.length ? selectedUsers.size === paginatedUsers.length : false}
                      onCheckedChange={onToggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Status</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Role</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">Last Activity</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers?.map((u, idx) => {
                  const role = getUserRole(u.user_id);
                  const config = roleConfig[role];
                  const RoleIcon = config.icon;
                  const isBlocked = !!u.blocked_at;

                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`group border-b transition-colors hover:bg-muted/50 ${isBlocked ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}
                    >
                      <TableCell>
                        <Checkbox checked={selectedUsers.has(u.user_id)} onCheckedChange={() => onToggleUser(u.user_id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className={`w-9 h-9 border-2 shadow-sm ${isBlocked ? 'border-red-300 opacity-60' : 'border-background'}`}>
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                {getInitials(u.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            {isBlocked && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <Ban className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${isBlocked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {u.display_name || 'Unnamed User'}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.city || 'No city'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {isBlocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="w-3 h-3" />
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={`gap-1.5 font-medium ${config.className}`}>
                          <RoleIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{format(new Date(u.created_at), 'MMM d, yyyy')}</span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {u.last_activity_at ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Activity className="w-3 h-3" />
                            {formatDistanceToNow(new Date(u.last_activity_at), { addSuffix: true })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
                            onClick={() => onViewUser(u)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onViewUser(u)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onRoleChange(u.user_id, 'user')}>
                                <User className="w-4 h-4 mr-2" />
                                Set as User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onRoleChange(u.user_id, 'center')}>
                                <Building2 className="w-4 h-4 mr-2" />
                                Set as Center
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onRoleChange(u.user_id, 'admin')}>
                                <Crown className="w-4 h-4 mr-2" />
                                Set as Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {onBlockUser && (
                                <DropdownMenuItem
                                  onClick={() => handleBlockClick(u)}
                                  className={isBlocked ? 'text-green-600' : 'text-amber-600'}
                                >
                                  {isBlocked ? (
                                    <>
                                      <ShieldOff className="w-4 h-4 mr-2" />
                                      Unblock User
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Block User
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {onDeleteUser && (
                                <DropdownMenuItem onClick={() => handleDeleteClick(u)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
                {(!paginatedUsers || paginatedUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-foreground">No users found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredUsers?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionUser?.blocked_at ? 'Unblock User' : 'Block User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionUser?.blocked_at
                ? `Are you sure you want to unblock "${actionUser?.display_name || 'this user'}"? They will regain access to the platform.`
                : `Are you sure you want to block "${actionUser?.display_name || 'this user'}"? They will lose access to the platform immediately.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlock}
              className={actionUser?.blocked_at ? '' : 'bg-amber-600 hover:bg-amber-700'}
            >
              {actionUser?.blocked_at ? 'Unblock' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{actionUser?.display_name || 'this user'}"? This action cannot be undone
              and will remove all their data including test attempts, enrollments, and saved items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
