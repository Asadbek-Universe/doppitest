import { FC, useMemo, useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  FileText,
  Building2,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Activity,
  UserPlus,
  UserCheck,
  GraduationCap,
  ClipboardList,
  Palette,
  Plus,
  Pencil,
  Trash2,
  Search,
  WalletCards,
  Trophy,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, useAdminRole } from '@/hooks/useUserRole';
import {
  useAllUsers,
  useAllCourses,
  useAllTests,
  useAllCenters,
  usePlatformStats,
  useAllUserRoles,
  useAssignRole,
  useVerifyCenter,
  useActivityLogs,
  useAllSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useBulkAssignRole,
  useBulkDeleteSubjects,
  useBulkVerifyCenters,
  useBulkDeleteCourses,
  useBulkDeleteTests,
  useAdminRangeAnalytics,
} from '@/hooks/useAdminData';
import { useBlockUser, useDeleteUser, useDeleteCenter, useBulkBlockUsers, useBulkDeleteCenters, useApproveCenterStatus } from '@/hooks/useAdminActions';
import { UserDetailsDrawer } from '@/components/admin/UserDetailsDrawer';
import { CenterDetailsDrawer } from '@/components/admin/CenterDetailsDrawer';
import { CourseDetailsDrawer } from '@/components/admin/CourseDetailsDrawer';
import { UsersManagement, type UserProfile } from '@/components/admin/UsersManagement';
import { CentersManagement, type EducationalCenter } from '@/components/admin/CentersManagement';
import { CoursesManagement } from '@/components/admin/CoursesManagement';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TablePagination } from '@/components/TablePagination';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar, type AdminTabKey } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid';
import { AdminKpiSkeleton } from '@/components/admin/AdminKpiSkeleton';
import { AdminAnalyticsCharts } from '@/components/admin/AdminAnalyticsCharts';
import { AdminChartSkeleton } from '@/components/admin/AdminChartSkeleton';
import { AdminDataError } from '@/components/admin/AdminDataError';
import { AdvancedAnalytics } from '@/components/admin/AdvancedAnalytics';
import { DashboardSummaryWidget } from '@/components/admin/DashboardSummaryWidget';
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel';
import { CenterApprovalPanel } from '@/components/admin/CenterApprovalPanel';
import { TariffApprovalPanel } from '@/components/admin/TariffApprovalPanel';
import { OlympiadsManagement } from '@/components/admin/OlympiadsManagement';
import { ReelsManagement } from '@/components/admin/ReelsManagement';
import { CourseTestApprovalPanel } from '@/components/admin/CourseTestApprovalPanel';
import { usePendingTariffRequests } from '@/hooks/useTariffApproval';

const AdminPanel: FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: adminRole } = useAdminRole();
  const location = useLocation();
  const navigate = useNavigate();

  const pathToTab = (path: string): AdminTabKey => {
    if (path.endsWith('/users')) return 'users';
    if (path.endsWith('/centers')) return 'centers';
    if (path.endsWith('/courses')) return 'courses';
    if (path.endsWith('/olympiads')) return 'olympiads';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<AdminTabKey>(() => pathToTab(location.pathname));
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{
    id?: string;
    name: string;
    name_uz: string;
    color: string;
    icon: string;
  } | null>(null);

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [centerSearch, setCenterSearch] = useState('');
  const [centerVerifiedFilter, setCenterVerifiedFilter] = useState<string>('all');

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [testPage, setTestPage] = useState(1);
  const [centerPage, setCenterPage] = useState(1);
  const [subjectPage, setSubjectPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Selection states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedCenters, setSelectedCenters] = useState<Set<string>>(new Set());

  // Confirmation dialog states
  const [deleteSubjectsDialogOpen, setDeleteSubjectsDialogOpen] = useState(false);
  const [deleteCoursesDialogOpen, setDeleteCoursesDialogOpen] = useState(false);
  const [deleteTestsDialogOpen, setDeleteTestsDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = usePlatformStats();
  const { data: users } = useAllUsers();
  const { data: userRoles } = useAllUserRoles();
  const { data: courses } = useAllCourses();
  const { data: tests } = useAllTests();
  const { data: centers } = useAllCenters();
  const { data: activityLogs } = useActivityLogs(50);
  const { data: subjects } = useAllSubjects();
  const { data: pendingTariffRequests } = usePendingTariffRequests();
  const assignRole = useAssignRole();
  const verifyCenter = useVerifyCenter();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const bulkAssignRole = useBulkAssignRole();
  const bulkDeleteSubjects = useBulkDeleteSubjects();
  const bulkVerifyCenters = useBulkVerifyCenters();
  const bulkDeleteCourses = useBulkDeleteCourses();
  const bulkDeleteTests = useBulkDeleteTests();
  const blockUser = useBlockUser();
  const deleteUser = useDeleteUser();
  const deleteCenter = useDeleteCenter();
  const bulkBlockUsers = useBulkBlockUsers();
  const approveCenterStatus = useApproveCenterStatus();

  // User details drawer state - using imported UserProfile type
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  // Center details drawer state - flexible type to handle both old and new schema
  type CenterData = {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    city: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    contact_phone?: string | null;
    website: string | null;
    is_verified: boolean | null;
    followers_count: number;
    student_count: number | null;
    founded_year: number | null;
    specializations: string[] | null;
    created_at: string;
    owner_id?: string | null;
    onboarding_completed?: boolean | null;
    social_links?: unknown;
    updated_at?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'active' | null;
    rejection_reason?: string | null;
    approved_at?: string | null;
    approved_by?: string | null;
  };
  const [selectedCenterForDetails, setSelectedCenterForDetails] = useState<CenterData | null>(null);
  const [centerDetailsOpen, setCenterDetailsOpen] = useState(false);

  // Course details drawer state - using a flexible type for the drawer
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<{
    id: string;
    title: string;
    description: string | null;
    instructor_name: string;
    instructor_avatar?: string | null;
    instructor_bio?: string | null;
    thumbnail_url: string | null;
    students_count: number | null;
    rating: number | null;
    duration_minutes: number | null;
    lessons_count: number | null;
    is_free: boolean | null;
    price: number | null;
    created_at: string;
    subjects: { id?: string; name: string; color?: string | null } | null;
    learning_outcomes?: string[] | null;
    requirements?: string[] | null;
    tags?: string[] | null;
  } | null>(null);
  const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29); // Last 30 days
    return { from, to };
  });

  const rangeFrom = dateRange?.from ?? new Date(new Date().setDate(new Date().getDate() - 29));
  const rangeTo = dateRange?.to ?? new Date();
  const { data: rangeAnalytics, isLoading: rangeLoading, isError: rangeError, refetch: refetchRange } = useAdminRangeAnalytics({ from: rangeFrom, to: rangeTo });

  // Filtered data - moved BEFORE early returns to satisfy hook rules
  const filteredUsers = useMemo(() => users?.filter((u) => {
    const matchesSearch =
      !userSearch ||
      (u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.city?.toLowerCase().includes(userSearch.toLowerCase()));
    const userRole = userRoles?.find((r) => r.user_id === u.user_id)?.role || 'user';
    const matchesRole = userRoleFilter === 'all' || userRole === userRoleFilter;
    return matchesSearch && matchesRole;
  }), [users, userSearch, userRoleFilter, userRoles]);

  const filteredCourses = useMemo(() => courses?.filter((c) => {
    return (
      !courseSearch ||
      c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.instructor_name?.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.subjects?.name?.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }), [courses, courseSearch]);

  const filteredTests = useMemo(() => tests?.filter((t) => {
    return (
      !testSearch ||
      t.title.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.subjects?.name?.toLowerCase().includes(testSearch.toLowerCase())
    );
  }), [tests, testSearch]);

  const filteredCenters = useMemo(() => centers?.filter((c) => {
    const matchesSearch =
      !centerSearch ||
      c.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
      c.city?.toLowerCase().includes(centerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(centerSearch.toLowerCase());
    const matchesVerified =
      centerVerifiedFilter === 'all' ||
      (centerVerifiedFilter === 'verified' && c.is_verified) ||
      (centerVerifiedFilter === 'pending' && !c.is_verified);
    return matchesSearch && matchesVerified;
  }), [centers, centerSearch, centerVerifiedFilter]);

  // Paginated data
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers?.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * ITEMS_PER_PAGE;
    return filteredCourses?.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, coursePage]);

  const paginatedTests = useMemo(() => {
    const start = (testPage - 1) * ITEMS_PER_PAGE;
    return filteredTests?.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTests, testPage]);

  const paginatedCenters = useMemo(() => {
    const start = (centerPage - 1) * ITEMS_PER_PAGE;
    return filteredCenters?.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCenters, centerPage]);

  const paginatedSubjects = useMemo(() => {
    const start = (subjectPage - 1) * ITEMS_PER_PAGE;
    return subjects?.slice(start, start + ITEMS_PER_PAGE);
  }, [subjects, subjectPage]);

  // Total pages
  const userTotalPages = Math.ceil((filteredUsers?.length || 0) / ITEMS_PER_PAGE);
  const courseTotalPages = Math.ceil((filteredCourses?.length || 0) / ITEMS_PER_PAGE);
  const testTotalPages = Math.ceil((filteredTests?.length || 0) / ITEMS_PER_PAGE);
  const centerTotalPages = Math.ceil((filteredCenters?.length || 0) / ITEMS_PER_PAGE);
  const subjectTotalPages = Math.ceil((subjects?.length || 0) / ITEMS_PER_PAGE);

  // Pending centers count - using new status field
  const pendingCentersCount = centers?.filter((c: any) => c.status === 'pending' || (!c.status && !c.is_verified)).length ?? 0;
  
  // Total pending approvals (centers + tariff requests)
  const pendingTariffCount = pendingTariffRequests?.length ?? 0;
  const totalPendingCount = pendingCentersCount + pendingTariffCount;

  useEffect(() => {
    const next = pathToTab(location.pathname);
    if (next !== activeTab) {
      setActiveTab(next);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (next: AdminTabKey) => {
    setActiveTab(next);
    switch (next) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'centers':
        navigate('/admin/centers');
        break;
      case 'courses':
        navigate('/admin/courses');
        break;
      case 'olympiads':
        navigate('/admin/olympiads');
        break;
      case 'analytics':
      case 'payments':
      case 'pending':
      case 'tests':
      case 'subjects':
      case 'activity':
      case 'dashboard':
      default:
        navigate('/admin/dashboard');
        break;
    }
  };

  const effectiveAdminRole = adminRole ?? 'super_admin';

  const allowedTabsByRole: Record<string, AdminTabKey[]> = {
    super_admin: ['dashboard', 'analytics', 'payments', 'pending', 'users', 'subjects', 'courses', 'tests', 'centers', 'olympiads', 'activity'],
    moderator: ['dashboard', 'analytics', 'pending', 'users', 'centers', 'olympiads', 'courses', 'tests', 'activity'],
    content_reviewer: ['dashboard', 'pending', 'olympiads', 'courses', 'tests', 'activity'],
    finance_admin: ['dashboard', 'analytics', 'payments', 'centers', 'activity'],
  };

  const allowedTabs = allowedTabsByRole[effectiveAdminRole] ?? allowedTabsByRole.super_admin;

  // KPI data - must be before early returns to satisfy hooks rules
  const overviewKpis = useMemo(
    () => [
      {
        label: 'Total users',
        value: stats?.usersCount ?? 0,
        icon: <Users className="h-4 w-4 text-primary" />,
      },
      {
        label: 'Active users (7d)',
        value: stats?.activeUsers7d ?? 0,
        icon: <Activity className="h-4 w-4 text-primary" />,
      },
      {
        label: 'Centers',
        value: stats?.centersCount ?? 0,
        icon: <Building2 className="h-4 w-4 text-primary" />,
      },
      {
        label: 'Pending centers',
        value: stats?.pendingCentersCount ?? 0,
        icon: <Shield className="h-4 w-4 text-primary" />,
      },
      {
        label: 'Courses',
        value: stats?.coursesCount ?? 0,
        icon: <BookOpen className="h-4 w-4 text-primary" />,
      },
      {
        label: 'Pending courses',
        value: stats?.pendingCoursesCount ?? 0,
        icon: <ClipboardList className="h-4 w-4 text-primary" />,
      },
      {
        label: 'Olympiads',
        value: stats?.olympiadsCount ?? 0,
        icon: <Trophy className="h-4 w-4 text-primary" />,
      },
      {
        label: 'Reels',
        value: stats?.reelsCount ?? 0,
        icon: <Activity className="h-4 w-4 text-primary" />,
      },
    ],
    [stats],
  );

  const rangeKpis = useMemo(
    () => [
      {
        label: 'New users',
        value: rangeAnalytics?.kpis.users ?? 0,
        icon: <Users className="h-4 w-4 text-primary" />,
        sublabel: 'in selected range',
      },
      {
        label: 'New centers',
        value: rangeAnalytics?.kpis.centers ?? 0,
        icon: <Building2 className="h-4 w-4 text-primary" />,
        sublabel: 'in selected range',
      },
      {
        label: 'Attempts',
        value: rangeAnalytics?.kpis.attempts ?? 0,
        icon: <FileText className="h-4 w-4 text-primary" />,
        sublabel: 'in selected range',
      },
      {
        label: 'Enrollments',
        value: rangeAnalytics?.kpis.enrollments ?? 0,
        icon: <BookOpen className="h-4 w-4 text-primary" />,
        sublabel: 'in selected range',
      },
    ],
    [rangeAnalytics],
  );

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_registered':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'role_assigned':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'role_removed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'center_verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'center_unverified':
        return <XCircle className="w-4 h-4 text-orange-500" />;
      case 'course_created':
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'test_created':
        return <ClipboardList className="w-4 h-4 text-indigo-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      user_registered: 'User Registered',
      role_assigned: 'Role Assigned',
      role_removed: 'Role Removed',
      center_verified: 'Center Verified',
      center_unverified: 'Center Unverified',
      course_created: 'Course Created',
      test_created: 'Test Created',
    };
    return labels[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    // Admin area should route to the dedicated admin login screen
    return <Navigate to="/admin-login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getUserRole = (userId: string) => {
    const role = userRoles?.find((r) => r.user_id === userId);
    return role?.role || 'user';
  };

  // Reset page when filters change
  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setUserPage(1);
  };
  const handleUserRoleFilterChange = (value: string) => {
    setUserRoleFilter(value);
    setUserPage(1);
  };
  const handleCourseSearchChange = (value: string) => {
    setCourseSearch(value);
    setCoursePage(1);
  };
  const handleTestSearchChange = (value: string) => {
    setTestSearch(value);
    setTestPage(1);
  };
  const handleCenterSearchChange = (value: string) => {
    setCenterSearch(value);
    setCenterPage(1);
  };
  const handleCenterVerifiedFilterChange = (value: string) => {
    setCenterVerifiedFilter(value);
    setCenterPage(1);
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'center' | 'user') => {
    try {
      await assignRole.mutateAsync({ userId, role });
      toast.success('Role updated successfully');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleVerifyCenter = async (centerId: string, verified: boolean) => {
    try {
      await verifyCenter.mutateAsync({ centerId, verified });
      toast.success(verified ? 'Center verified' : 'Center unverified');
    } catch {
      toast.error('Failed to update center');
    }
  };

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      await blockUser.mutateAsync({ userId, block });
      toast.success(block ? 'User blocked' : 'User unblocked');
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser.mutateAsync({ userId, hardDelete: true });
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleBulkBlockUsers = async (block: boolean) => {
    try {
      await bulkBlockUsers.mutateAsync({ userIds: Array.from(selectedUsers), block });
      toast.success(block ? 'Users blocked' : 'Users unblocked');
      setSelectedUsers(new Set());
    } catch {
      toast.error('Failed to update users');
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    try {
      await deleteCenter.mutateAsync(centerId);
      toast.success('Center deleted');
    } catch {
      toast.error('Failed to delete center');
    }
  };

  const handleApproveCenter = async (centerId: string) => {
    try {
      await approveCenterStatus.mutateAsync({ centerId, status: 'approved' });
      toast.success('Center approved');
    } catch {
      toast.error('Failed to approve center');
    }
  };

  const handleRejectCenter = async (centerId: string) => {
    try {
      await approveCenterStatus.mutateAsync({ centerId, status: 'rejected', rejectionReason: 'Rejected by admin' });
      toast.success('Center rejected');
    } catch {
      toast.error('Failed to reject center');
    }
  };

  const handleOpenSubjectDialog = (subject?: typeof editingSubject) => {
    if (subject) {
      setEditingSubject(subject);
    } else {
      setEditingSubject({ name: '', name_uz: '', color: '#3B82F6', icon: '' });
    }
    setSubjectDialogOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!editingSubject?.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      if (editingSubject.id) {
        await updateSubject.mutateAsync({
          id: editingSubject.id,
          name: editingSubject.name,
          name_uz: editingSubject.name_uz || undefined,
          color: editingSubject.color || undefined,
          icon: editingSubject.icon || undefined,
        });
        toast.success('Subject updated');
      } else {
        await createSubject.mutateAsync({
          name: editingSubject.name,
          name_uz: editingSubject.name_uz || undefined,
          color: editingSubject.color || undefined,
          icon: editingSubject.icon || undefined,
        });
        toast.success('Subject created');
      }
      setSubjectDialogOpen(false);
      setEditingSubject(null);
    } catch {
      toast.error('Failed to save subject');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteSubject.mutateAsync(id);
      toast.success('Subject deleted');
    } catch {
      toast.error('Failed to delete subject');
    }
  };

  // Bulk action handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === paginatedUsers?.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers?.map((u) => u.user_id)));
    }
  };

  const handleBulkRoleChange = async (role: 'admin' | 'center' | 'user') => {
    if (selectedUsers.size === 0) return;
    try {
      await bulkAssignRole.mutateAsync({ userIds: Array.from(selectedUsers), role });
      toast.success(`${selectedUsers.size} users updated to ${role}`);
      setSelectedUsers(new Set());
    } catch {
      toast.error('Failed to update roles');
    }
  };

  const toggleSubjectSelection = (id: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSubjects = () => {
    if (selectedSubjects.size === paginatedSubjects?.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(paginatedSubjects?.map((s) => s.id)));
    }
  };

  const handleBulkDeleteSubjects = async () => {
    if (selectedSubjects.size === 0) return;
    try {
      await bulkDeleteSubjects.mutateAsync(Array.from(selectedSubjects));
      toast.success(`${selectedSubjects.size} subjects deleted`);
      setSelectedSubjects(new Set());
      setDeleteSubjectsDialogOpen(false);
    } catch {
      toast.error('Failed to delete subjects');
    }
  };

  const toggleCourseSelection = (id: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllCourses = () => {
    if (selectedCourses.size === paginatedCourses?.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(paginatedCourses?.map((c) => c.id)));
    }
  };

  const handleBulkDeleteCourses = async () => {
    if (selectedCourses.size === 0) return;
    try {
      await bulkDeleteCourses.mutateAsync(Array.from(selectedCourses));
      toast.success(`${selectedCourses.size} courses deleted`);
      setSelectedCourses(new Set());
      setDeleteCoursesDialogOpen(false);
    } catch {
      toast.error('Failed to delete courses');
    }
  };

  const toggleTestSelection = (id: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllTests = () => {
    if (selectedTests.size === paginatedTests?.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(paginatedTests?.map((t) => t.id)));
    }
  };

  const handleBulkDeleteTests = async () => {
    if (selectedTests.size === 0) return;
    try {
      await bulkDeleteTests.mutateAsync(Array.from(selectedTests));
      toast.success(`${selectedTests.size} tests deleted`);
      setSelectedTests(new Set());
      setDeleteTestsDialogOpen(false);
    } catch {
      toast.error('Failed to delete tests');
    }
  };

  const toggleCenterSelection = (id: string) => {
    setSelectedCenters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllCenters = () => {
    if (selectedCenters.size === paginatedCenters?.length) {
      setSelectedCenters(new Set());
    } else {
      setSelectedCenters(new Set(paginatedCenters?.map((c) => c.id)));
    }
  };

  const handleBulkVerifyCenters = async (verified: boolean) => {
    if (selectedCenters.size === 0) return;
    try {
      await bulkVerifyCenters.mutateAsync({ centerIds: Array.from(selectedCenters), verified });
      toast.success(`${selectedCenters.size} centers ${verified ? 'verified' : 'unverified'}`);
      setSelectedCenters(new Set());
    } catch {
      toast.error('Failed to update centers');
    }
  };

  return (
    <SidebarProvider defaultOpen className="bg-slate-50 dark:bg-background">
      <div className="grid min-h-screen w-full grid-cols-[260px,1fr]">
        <AdminSidebar
          value={activeTab}
          onChange={handleTabChange}
          pendingCentersCount={totalPendingCount}
          allowedTabs={allowedTabs}
        />

        <SidebarInset className="flex min-h-screen flex-col bg-[#F8FAFC]">
          <AdminHeader
            activeTab={activeTab}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onRefresh={() => {
              refetchStats();
              refetchRange();
            }}
            isRefreshing={statsLoading || rangeLoading}
            lastUpdated={new Date()}
          />

          <main className="w-full px-10 pb-12 pt-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-6"
            >
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTabKey)}>
                {/* keep old tab content wiring, sidebar is the "TabsList" */}

                <TabsContent value="dashboard" className="space-y-6">
                  <DashboardSummaryWidget
                    onNavigateToPending={() => setActiveTab('pending')}
                    onNavigateToUsers={() => setActiveTab('users')}
                    onNavigateToActivity={() => setActiveTab('activity')}
                    onNavigateToCenters={() => setActiveTab('centers')}
                  />

                  <QuickActionsPanel
                    onNavigateToUsers={() => setActiveTab('users')}
                    onNavigateToCenters={() => setActiveTab('centers')}
                    onNavigateToPending={() => setActiveTab('pending')}
                  />

                  {/* Overview KPIs with loading/error states */}
                  {statsLoading ? (
                    <AdminKpiSkeleton />
                  ) : statsError ? (
                    <AdminDataError
                      title="Failed to load statistics"
                      message="Could not fetch platform overview stats."
                      onRetry={() => refetchStats()}
                      compact
                    />
                  ) : (
                    <AdminKpiGrid items={overviewKpis} />
                  )}

                  <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                      <div>
                        <CardTitle>Range snapshot</CardTitle>
                        <p className="text-sm text-muted-foreground">New activity within the selected date range.</p>
                      </div>
                      <Button variant="outline" onClick={() => setActiveTab('analytics')}>View analytics</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Range KPIs with loading/error states */}
                      {rangeLoading ? (
                        <>
                          <AdminKpiSkeleton />
                          <AdminChartSkeleton />
                        </>
                      ) : rangeError ? (
                        <AdminDataError
                          title="Failed to load range data"
                          message="Could not fetch analytics for the selected date range."
                          onRetry={() => refetchRange()}
                        />
                      ) : (
                        <>
                          <AdminKpiGrid items={rangeKpis} />
                          <AdminAnalyticsCharts data={rangeAnalytics?.timeseries ?? []} />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Range analytics with loading/error states */}
                      {rangeLoading ? (
                        <>
                          <AdminKpiSkeleton />
                          <AdminChartSkeleton />
                        </>
                      ) : rangeError ? (
                        <AdminDataError
                          title="Failed to load analytics"
                          message="Could not fetch analytics data for the selected range."
                          onRetry={() => refetchRange()}
                        />
                      ) : (
                        <>
                          <AdminKpiGrid items={rangeKpis} />
                          <AdminAnalyticsCharts data={rangeAnalytics?.timeseries ?? []} />
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <AdvancedAnalytics from={rangeFrom} to={rangeTo} />
                </TabsContent>

                <TabsContent value="payments" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <WalletCards className="h-5 w-5 text-primary" />
                        To'lovlar boshqaruvi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Subscription Stats */}
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Obuna statistikasi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Tasdiqlangan markazlar</span>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground mt-1">
                              {centers?.filter(c => c.is_verified).length || 0}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Faol markazlar</p>
                          </div>
                          <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Kutilmoqda</span>
                              <Shield className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground mt-1">
                              {centers?.filter(c => !c.is_verified).length || 0}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Tasdiqlash kutilmoqda</p>
                          </div>
                          <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Jami markazlar</span>
                              <Building2 className="h-4 w-4 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground mt-1">{centers?.length || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Ro'yxatdan o'tgan</p>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Plans Overview */}
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Tarif rejalari</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="rounded-xl border p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">Bepul</Badge>
                            </div>
                            <p className="text-lg font-semibold">0 so'm/oy</p>
                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                              <li>• 3 ta kurs</li>
                              <li>• 5 ta test</li>
                              <li>• 10 ta video</li>
                            </ul>
                          </div>
                          <div className="rounded-xl border border-primary/50 bg-primary/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-primary">Pro</Badge>
                              <Badge variant="outline" className="text-xs">Mashhur</Badge>
                            </div>
                            <p className="text-lg font-semibold">299,000 so'm/oy</p>
                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                              <li>• 20 ta kurs</li>
                              <li>• 50 ta test</li>
                              <li>• 100 ta video</li>
                            </ul>
                          </div>
                          <div className="rounded-xl border p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Enterprise</Badge>
                            </div>
                            <p className="text-lg font-semibold">799,000 so'm/oy</p>
                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                              <li>• Cheksiz kurslar</li>
                              <li>• Cheksiz testlar</li>
                              <li>• Cheksiz videolar</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Info Card */}
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <WalletCards className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">To'lov tizimi</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Hozirda to'lovlar qo'lda qabul qilinadi. Kelajakda Click/Payme integratsiyasi qo'shiladi.
                              Markazlar obuna so'rovlarini yuborishlari mumkin va admin tasdiqlaydi.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

            <TabsContent value="pending">
              <div className="space-y-8">
                {/* Center Approvals */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Markaz tasdiqlash so'rovlari</h2>
                  <CenterApprovalPanel />
                </div>
                
                {/* Tariff Approvals */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Tarif tasdiqlash so'rovlari</h2>
                  <TariffApprovalPanel />
                </div>

                {/* Course & Test Approvals */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Kurs va test tasdiqlash</h2>
                  <CourseTestApprovalPanel />
                </div>

                {/* Reels Moderation */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Reels moderatsiyasi</h2>
                  <ReelsManagement />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="olympiads">
              <OlympiadsManagement />
            </TabsContent>

            <TabsContent value="users">
              <UsersManagement
                users={users}
                userRoles={userRoles}
                selectedUsers={selectedUsers}
                onToggleUser={toggleUserSelection}
                onToggleAll={toggleAllUsers}
                onBulkRoleChange={handleBulkRoleChange}
                onBulkBlock={handleBulkBlockUsers}
                onRoleChange={handleRoleChange}
                onViewUser={(u) => {
                  setSelectedUserForDetails(u);
                  setUserDetailsOpen(true);
                }}
                onBlockUser={handleBlockUser}
                onDeleteUser={handleDeleteUser}
              />
            </TabsContent>

            <TabsContent value="subjects">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Subject Management
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedSubjects.size > 0 && (
                      <>
                        <span className="text-sm text-muted-foreground">{selectedSubjects.size} selected</span>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteSubjectsDialogOpen(true)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                    <Button onClick={() => handleOpenSubjectDialog()} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Subject
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={paginatedSubjects?.length ? selectedSubjects.size === paginatedSubjects.length : false}
                            onCheckedChange={toggleAllSubjects}
                          />
                        </TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Name (UZ)</TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSubjects?.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubjects.has(subject.id)}
                              onCheckedChange={() => toggleSubjectSelection(subject.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: subject.color || '#3B82F6' }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.name_uz || '-'}</TableCell>
                          <TableCell>{subject.icon || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleOpenSubjectDialog({
                                    id: subject.id,
                                    name: subject.name,
                                    name_uz: subject.name_uz || '',
                                    color: subject.color || '#3B82F6',
                                    icon: subject.icon || '',
                                  })
                                }
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteSubject(subject.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!paginatedSubjects || paginatedSubjects.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No subjects yet. Add your first subject.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    currentPage={subjectPage}
                    totalPages={subjectTotalPages}
                    totalItems={subjects?.length || 0}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setSubjectPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses">
              <CoursesManagement
                courses={courses}
                selectedCourses={selectedCourses}
                onToggleCourse={toggleCourseSelection}
                onToggleAll={toggleAllCourses}
                onBulkDelete={() => setDeleteCoursesDialogOpen(true)}
                onViewCourse={(course) => {
                  setSelectedCourseForDetails(course);
                  setCourseDetailsOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="tests">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Tests</CardTitle>
                  {selectedTests.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{selectedTests.size} selected</span>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteTestsDialogOpen(true)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title or subject..."
                      value={testSearch}
                      onChange={(e) => handleTestSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={paginatedTests?.length ? selectedTests.size === paginatedTests.length : false}
                            onCheckedChange={toggleAllTests}
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Completions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTests?.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTests.has(test.id)}
                              onCheckedChange={() => toggleTestSelection(test.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{test.title}</TableCell>
                          <TableCell>{test.subjects?.name || '-'}</TableCell>
                          <TableCell>{test.questions_count}</TableCell>
                          <TableCell>{test.duration_minutes} min</TableCell>
                          <TableCell>{test.completions ?? 0}</TableCell>
                        </TableRow>
                      ))}
                      {(!paginatedTests || paginatedTests.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No tests found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    currentPage={testPage}
                    totalPages={testTotalPages}
                    totalItems={filteredTests?.length || 0}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setTestPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="centers">
              <CentersManagement
                centers={centers}
                selectedCenters={selectedCenters}
                onToggleCenter={toggleCenterSelection}
                onToggleAll={toggleAllCenters}
                onBulkVerify={handleBulkVerifyCenters}
                onVerifyCenter={handleVerifyCenter}
                onViewCenter={(c) => {
                  setSelectedCenterForDetails(c);
                  setCenterDetailsOpen(true);
                }}
                onDeleteCenter={handleDeleteCenter}
                onApproveCenter={handleApproveCenter}
                onRejectCenter={handleRejectCenter}
              />
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activityLogs?.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="mt-0.5">
                          {getActivityIcon(log.action_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {getActivityLabel(log.action_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            {log.user_display_name && (
                              <span className="font-medium">{log.user_display_name}</span>
                            )}
                            {log.details && typeof log.details === 'object' && (
                              <span className="text-muted-foreground ml-1">
                                {(log.details as Record<string, unknown>).role && `→ ${(log.details as Record<string, unknown>).role}`}
                                {(log.details as Record<string, unknown>).title && `"${(log.details as Record<string, unknown>).title}"`}
                                {(log.details as Record<string, unknown>).center_name && `"${(log.details as Record<string, unknown>).center_name}"`}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.entity_type}
                        </div>
                      </motion.div>
                    ))}
                    {(!activityLogs || activityLogs.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        No activity logs yet. Actions will be recorded here.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              </Tabs>
            </motion.div>
          </main>

      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject?.id ? 'Edit Subject' : 'Add Subject'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (English)</Label>
              <Input
                id="name"
                value={editingSubject?.name || ''}
                onChange={(e) =>
                  setEditingSubject((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_uz">Name (Uzbek)</Label>
              <Input
                id="name_uz"
                value={editingSubject?.name_uz || ''}
                onChange={(e) =>
                  setEditingSubject((prev) =>
                    prev ? { ...prev, name_uz: e.target.value } : null
                  )
                }
                placeholder="e.g. Matematika"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={editingSubject?.color || '#3B82F6'}
                  onChange={(e) =>
                    setEditingSubject((prev) =>
                      prev ? { ...prev, color: e.target.value } : null
                    )
                  }
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={editingSubject?.color || '#3B82F6'}
                  onChange={(e) =>
                    setEditingSubject((prev) =>
                      prev ? { ...prev, color: e.target.value } : null
                    )
                  }
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji or icon name)</Label>
              <Input
                id="icon"
                value={editingSubject?.icon || ''}
                onChange={(e) =>
                  setEditingSubject((prev) =>
                    prev ? { ...prev, icon: e.target.value } : null
                  )
                }
                placeholder="e.g. 📐 or calculator"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubject}>
              {editingSubject?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={deleteSubjectsDialogOpen} onOpenChange={setDeleteSubjectsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedSubjects.size} subject{selectedSubjects.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected subject{selectedSubjects.size > 1 ? 's' : ''} and may affect courses and tests that use them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteSubjects} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCoursesDialogOpen} onOpenChange={setDeleteCoursesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCourses.size} course{selectedCourses.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected course{selectedCourses.size > 1 ? 's' : ''} and all associated lessons and enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteCourses} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTestsDialogOpen} onOpenChange={setDeleteTestsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTests.size} test{selectedTests.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected test{selectedTests.size > 1 ? 's' : ''} and all associated questions and attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteTests} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserDetailsDrawer
        open={userDetailsOpen}
        onOpenChange={setUserDetailsOpen}
        user={selectedUserForDetails}
        currentRole={(selectedUserForDetails ? getUserRole(selectedUserForDetails.user_id) : 'user') as 'admin' | 'center' | 'user'}
        onRoleChange={async (userId, role) => {
          await handleRoleChange(userId, role);
        }}
      />

      <CenterDetailsDrawer
        open={centerDetailsOpen}
        onOpenChange={setCenterDetailsOpen}
        center={selectedCenterForDetails}
        onVerifyChange={async (centerId, verified) => {
          await handleVerifyCenter(centerId, verified);
        }}
      />

      <CourseDetailsDrawer
        open={courseDetailsOpen}
        onOpenChange={setCourseDetailsOpen}
        course={selectedCourseForDetails}
      />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;
