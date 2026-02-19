import { FC, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

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
  const { data: role, isLoading: roleLoading } = useUserRole();

  // Show loading state while checking auth
  if (authLoading || roleLoading) {
    return <PageLoader />;
  }

  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Get effective role (default to 'user' if no role assigned)
  const effectiveRole: AppRole = role || "user";

  // Check if user's role is allowed
  if (!allowedRoles.includes(effectiveRole)) {
    // Redirect based on their actual role
    if (effectiveRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (effectiveRole === "center") {
      return <Navigate to="/center-panel" replace />;
    } else {
      return <Navigate to="/" replace />;
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
