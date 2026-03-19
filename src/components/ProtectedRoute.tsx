import { FC, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, useOwnsCenter, AppRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = "/auth",
}) => {
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading, isError: roleError } = useUserRole();
  const { data: ownsCenter, isLoading: ownsCenterLoading } = useOwnsCenter();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();

  const effectiveRole: AppRole = role || "user";
  const mustCheckOnboarding = effectiveRole === "user" && allowedRoles.includes("user");
  const mayBeCenter = (role === "user" || role === null) && allowedRoles.includes("user");

  if (authLoading) {
    return <PageLoader />;
  }
  // Only block on role loading when we have a user (role query is enabled)
  if (user && roleLoading && !roleError) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  const isCenterRoute = allowedRoles.length === 1 && allowedRoles[0] === "center";
  const canAccessCenter = effectiveRole === "center" || (isCenterRoute && ownsCenter === true);

  if (isCenterRoute && effectiveRole !== "center" && ownsCenterLoading) {
    return <PageLoader />;
  }

  if (!allowedRoles.includes(effectiveRole) && !canAccessCenter) {
    if (effectiveRole === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (effectiveRole === "center" || ownsCenter) {
      return <Navigate to="/center-panel" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (mustCheckOnboarding) {
    // Don't block forever on profile error - treat as needs onboarding
    if (profileLoading && !profileError) return <PageLoader />;
    if (!profile || profile.onboarding_completed === false) {
      // User may be a center owner whose role isn't "center" yet (e.g. after signup) → send to center onboarding
      if (mayBeCenter && ownsCenterLoading) return <PageLoader />;
      if (mayBeCenter && ownsCenter) return <Navigate to="/onboarding/center" replace />;
      return <Navigate to="/onboarding/user" replace />;
    }
  }

  return <>{children}</>;
};

// Convenience components for common use cases
export const AdminRoute: FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin"]} redirectTo="/admin-login">
    {children}
  </ProtectedRoute>
);

export const CenterRoute: FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["center"]}>
    {children}
  </ProtectedRoute>
);

export const UserRoute: FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["user"]}>
    {children}
  </ProtectedRoute>
);

// For pages accessible by both Users and Centers (Centers see preview mode)
export const UserOrCenterRoute: FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["user", "center"]}>
    {children}
  </ProtectedRoute>
);

// For pages accessible by any authenticated user (but specific role may see different UI)
export const AuthenticatedRoute: FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin", "center", "user"]}>
    {children}
  </ProtectedRoute>
);
