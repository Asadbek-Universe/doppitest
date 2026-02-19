import { FC } from 'react';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Trophy,
  Video,
  BarChart3,
  Building2,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsCenter } from '@/hooks/useUserRole';
import { useMyCenter } from '@/hooks/useCenterData';
import { useMyCenterStatus, useCenterSubscriptionStatus } from '@/hooks/useCenterStatus';
import { Navbar } from '@/components/Navbar';
import { CenterPendingScreen } from '@/components/center/CenterPendingScreen';
import { CenterRejectedScreen } from '@/components/center/CenterRejectedScreen';
import { TariffSelectionScreen } from '@/components/center/TariffSelectionScreen';
import { TariffApprovalWaitingScreen } from '@/components/center/TariffApprovalWaitingScreen';
import { CreateCenterScreen } from './CreateCenterScreen';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/center-panel', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/center-panel/courses', end: false, label: 'Courses', icon: BookOpen },
  { to: '/center-panel/tests', end: false, label: 'Tests', icon: FileText },
  { to: '/center-panel/olympiads', end: false, label: 'Olympiads', icon: Trophy },
  { to: '/center-panel/reels', end: false, label: 'Videos', icon: Video },
  { to: '/center-panel/analytics', end: false, label: 'Analytics', icon: BarChart3 },
  { to: '/center-panel/profile', end: false, label: 'Profile', icon: Building2 },
  { to: '/center-panel/seo', end: false, label: 'SEO', icon: Search },
];

export const CenterPanelLayout: FC = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isCenter, isLoading: roleLoading } = useIsCenter();
  const { data: centerStatus, isLoading: statusLoading } = useMyCenterStatus();
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useCenterSubscriptionStatus(centerStatus?.id);
  const { data: center, isLoading: centerLoading } = useMyCenter();

  const isLoading = authLoading || roleLoading || centerLoading || statusLoading || subscriptionLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isCenter) {
    return <Navigate to="/" replace />;
  }

  // Status-based screens: only show main panel when center is ACTIVE
  if (centerStatus) {
    if (centerStatus.status === 'pending') {
      if (!center) return <CreateCenterScreen />;
      return <CenterPendingScreen center={center} />;
    }
    if (centerStatus.status === 'rejected') {
      return <CenterRejectedScreen center={centerStatus} />;
    }
    if (centerStatus.status === 'approved' && subscriptionStatus && !subscriptionStatus.tariff_selected) {
      return <TariffSelectionScreen centerName={centerStatus.name} subscription={subscriptionStatus} />;
    }
    if (centerStatus.status === 'approved' && subscriptionStatus?.tariff_selected) {
      return <TariffApprovalWaitingScreen centerName={centerStatus.name} subscription={subscriptionStatus} />;
    }
    // If not active, show waiting (e.g. unknown state)
    if (centerStatus.status !== 'active') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Your center is not active yet. Please complete the setup steps.</p>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // No center record: show create center screen
  if (!center) {
    return <CreateCenterScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar navigation */}
          <aside className="md:w-56 shrink-0">
            <nav className="sticky top-24 space-y-0.5">
              {navItems.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Outlet />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CenterPanelLayout;
