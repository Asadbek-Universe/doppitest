import { FC, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  MapPin,
  Mail,
  Users,
  Shield,
  MoreHorizontal,
  Trash2,
  Pencil,
  Ban,
  Clock,
  Crown,
  ShieldCheck,
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
import type { Json } from '@/integrations/supabase/types';

export interface EducationalCenter {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  website: string | null;
  student_count: number | null;
  is_verified: boolean | null;
  owner_id: string | null;
  specializations: string[] | null;
  founded_year: number | null;
  followers_count: number;
  onboarding_completed: boolean | null;
  social_links: Json | null;
  created_at: string;
  updated_at: string;
  status?: 'pending' | 'approved' | 'rejected' | 'active' | null;
  rejection_reason?: string | null;
  approved_at?: string | null;
}

interface CentersManagementProps {
  centers: EducationalCenter[] | undefined;
  selectedCenters: Set<string>;
  onToggleCenter: (centerId: string) => void;
  onToggleAll: () => void;
  onBulkVerify: (verified: boolean) => void;
  onVerifyCenter: (centerId: string, verified: boolean) => void;
  onViewCenter: (center: EducationalCenter) => void;
  onDeleteCenter?: (centerId: string) => void;
  onApproveCenter?: (centerId: string) => void;
  onRejectCenter?: (centerId: string) => void;
}

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/15 text-amber-700 border-amber-200',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-500/15 text-blue-700 border-blue-200',
    icon: ShieldCheck,
  },
  active: {
    label: 'Active',
    className: 'bg-green-500/15 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/15 text-red-700 border-red-200',
    icon: XCircle,
  },
};

export const CentersManagement: FC<CentersManagementProps> = ({
  centers,
  selectedCenters,
  onToggleCenter,
  onToggleAll,
  onBulkVerify,
  onVerifyCenter,
  onViewCenter,
  onDeleteCenter,
  onApproveCenter,
  onRejectCenter,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionCenter, setActionCenter] = useState<EducationalCenter | null>(null);

  const getCenterStatus = (center: EducationalCenter): keyof typeof statusConfig => {
    if (center.status) return center.status as keyof typeof statusConfig;
    return center.is_verified ? 'active' : 'pending';
  };

  const filteredCenters = useMemo(() => {
    return centers?.filter((c) => {
      const matchesSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      const centerStatus = getCenterStatus(c);
      const matchesStatus = statusFilter === 'all' || centerStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [centers, search, statusFilter]);

  const totalPages = Math.ceil((filteredCenters?.length || 0) / ITEMS_PER_PAGE);
  const paginatedCenters = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCenters?.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCenters, page]);

  // Stats
  const totalCenters = centers?.length || 0;
  const activeCount = centers?.filter((c) => getCenterStatus(c) === 'active').length || 0;
  const pendingCount = centers?.filter((c) => getCenterStatus(c) === 'pending').length || 0;
  const totalFollowers = centers?.reduce((sum, c) => sum + (c.followers_count || 0), 0) || 0;

  const getInitials = (name: string | null) => {
    if (!name) return 'C';
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

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDeleteClick = (center: EducationalCenter) => {
    setActionCenter(center);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (actionCenter && onDeleteCenter) {
      onDeleteCenter(actionCenter.id);
    }
    setDeleteDialogOpen(false);
    setActionCenter(null);
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
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalCenters}</p>
                    <p className="text-xs text-muted-foreground">Total Centers</p>
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
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalFollowers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Followers</p>
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
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Center Management</CardTitle>
                <p className="text-sm text-muted-foreground">{filteredCenters?.length || 0} centers found</p>
              </div>
            </div>
            {selectedCenters.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-lg border border-primary/20"
              >
                <span className="text-sm font-medium text-primary">{selectedCenters.size} selected</span>
                <Button size="sm" variant="default" className="h-8" onClick={() => onBulkVerify(true)}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Verify All
                </Button>
                <Button size="sm" variant="outline" className="h-8" onClick={() => onBulkVerify(false)}>
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Unverify
                </Button>
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
                placeholder="Search by name, city, or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-muted/50 border-transparent focus:border-primary/30 focus:bg-card transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-36 bg-muted/50 border-transparent">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                      checked={paginatedCenters?.length ? selectedCenters.size === paginatedCenters.length : false}
                      onCheckedChange={onToggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Center</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Location</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Followers</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Registered</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCenters?.map((center, idx) => {
                  const status = getCenterStatus(center);
                  const statusCfg = statusConfig[status];
                  const StatusIcon = statusCfg.icon;

                  return (
                    <motion.tr
                      key={center.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedCenters.has(center.id)}
                          onCheckedChange={() => onToggleCenter(center.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-background shadow-sm rounded-lg">
                            <AvatarImage src={center.logo_url || undefined} className="rounded-lg" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium rounded-lg">
                              {getInitials(center.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate max-w-[180px]">{center.name}</p>
                              {center.is_verified && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                            {center.email && (
                              <p className="text-xs text-muted-foreground truncate">{center.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-sm">{center.city || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 font-medium ${statusCfg.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{center.followers_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(center.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
                            onClick={() => onViewCenter(center)}
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
                              <DropdownMenuItem onClick={() => onViewCenter(center)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {status === 'pending' && onApproveCenter && (
                                <DropdownMenuItem onClick={() => onApproveCenter(center.id)} className="text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve Center
                                </DropdownMenuItem>
                              )}
                              {status === 'pending' && onRejectCenter && (
                                <DropdownMenuItem onClick={() => onRejectCenter(center.id)} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject Center
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => onVerifyCenter(center.id, !center.is_verified)}
                                className={center.is_verified ? 'text-amber-600' : 'text-green-600'}
                              >
                                {center.is_verified ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Unverify
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {onDeleteCenter && (
                                <DropdownMenuItem onClick={() => handleDeleteClick(center)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Center
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
                {(!paginatedCenters || paginatedCenters.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-foreground">No centers found</p>
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
            totalItems={filteredCenters?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Center</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{actionCenter?.name}"? This action cannot be undone and will remove all
              their courses, tests, reels, olympiads, and analytics data.
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
