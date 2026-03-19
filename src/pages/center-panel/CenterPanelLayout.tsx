import { FC } from 'react';
import { Navigate, Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Video,
  BarChart3,
  Building2,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, useOwnsCenter } from '@/hooks/useUserRole';
import { useMyCenter } from '@/hooks/useCenterData';
import { useMyCenterStatus, useCenterSubscriptionStatus } from '@/hooks/useCenterStatus';
import { Navbar } from '@/components/Navbar';
import { CenterPendingScreen } from '@/components/center/CenterPendingScreen';
import { CenterRejectedScreen } from '@/components/center/CenterRejectedScreen';
import { TariffSelectionScreen } from '@/components/center/TariffSelectionScreen';
import { TariffApprovalWaitingScreen } from '@/components/center/TariffApprovalWaitingScreen';
import { CreateCenterScreen } from './CreateCenterScreen';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItemPaths: { to: string; end: boolean; label: string; icon: typeof LayoutDashboard }[] = [
  { to: '', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', end: false, label: 'Courses', icon: BookOpen },
  { to: '/olympiads', end: false, label: 'Olympiads', icon: Trophy },
  { to: '/reels', end: false, label: 'Videos', icon: Video },
  { to: '/analytics', end: false, label: 'Analytics', icon: BarChart3 },
  { to: '/seo', end: false, label: 'SEO', icon: Search },
];

export const CenterPanelLayout: FC<{ basePath?: string }> = ({ basePath = '/center-panel' }) => {
  const location = useLocation();
  const navItems = navItemPaths.map((item) => ({
    ...item,
    to: `${basePath}${item.to || ''}`,
  }));
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: ownsCenter, isLoading: ownsCenterLoading } = useOwnsCenter();
  const { data: centerStatus, isLoading: statusLoading } = useMyCenterStatus();
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useCenterSubscriptionStatus(centerStatus?.id);
  const { data: center, isLoading: centerLoading, isError: centerError } = useMyCenter();

  const isCenter = role === 'center' || ownsCenter === true;
  // Only block on auth, center fetch, and (for non-center role) ownership — not on status/subscription to avoid infinite loader if those fail
  const isLoading = authLoading || centerLoading || (role !== 'center' && ownsCenterLoading);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!roleLoading && !ownsCenterLoading && !isCenter) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading && !center) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No center row yet: stay on /center-panel and show setup (don't redirect so the URL still loads)
  if (!center && !centerLoading && !centerError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full border-primary/20">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <Building2 className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Register your educational center</h2>
              <p className="text-muted-foreground text-sm">
                Create your center profile: add your center name, address, and contact info. After that you can add courses, tests, olympiads, and manage students.
              </p>
              <Button asChild>
                <Link to="/onboarding/center">Create center profile</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!center) {
    return <CreateCenterScreen />;
  }

  const needsOnboarding = center.onboarding_completed === false;

  if (centerStatus?.status === 'rejected') {
    return <CenterRejectedScreen center={centerStatus} />;
  }
  if (centerStatus?.status === 'approved' && subscriptionStatus && !subscriptionStatus.tariff_selected) {
    return <TariffSelectionScreen centerName={centerStatus.name} subscription={subscriptionStatus} />;
  }
  // Only show waiting screen when tariff was selected but not yet approved by admin
  if (centerStatus?.status === 'approved' && subscriptionStatus?.tariff_selected && !subscriptionStatus?.tariff_approved_at) {
    return <TariffApprovalWaitingScreen centerName={centerStatus.name} subscription={subscriptionStatus} />;
  }

  const isPendingApproval = centerStatus?.status === 'pending';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {needsOnboarding && (
        <div className="sticky top-0 z-10 bg-primary/10 border-b border-primary/30 px-4 py-3 flex items-center justify-center gap-4 flex-wrap text-sm">
          <span className="text-foreground font-medium">Complete your center profile so students can find you.</span>
          <Link
            to="/onboarding/center"
            className="text-primary font-semibold hover:underline underline-offset-2"
          >
            Complete profile →
          </Link>
        </div>
      )}
      {isPendingApproval && (
        <div className="sticky top-0 z-10 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-sm text-amber-800 dark:text-amber-200">
          Your center is pending approval. You can manage content; it will be visible after admin approval.
        </div>
      )}
      <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar navigation */}
          <aside className="md:w-56 shrink-0">
            <nav className="sticky top-24 space-y-0.5">
              {navItems.map(({ to, end, label, icon: Icon }, idx) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  isActive={idx === 0 ? (_, loc) => loc.pathname === basePath || loc.pathname === `${basePath}/dashboard` : undefined}
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
