import { Component, lazy, ReactNode, Suspense } from "react";
import { Link } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./hooks/useAuth";
import { PreviewModeProvider } from "./hooks/usePreviewMode";
import { AdminRoute, CenterRoute, UserRoute, UserOrCenterRoute } from "./components/ProtectedRoute";

// Lazy load all pages for code splitting
const Feed = lazy(() => import("./pages/Feed"));
const Tests = lazy(() => import("./pages/Tests"));
const TestHistory = lazy(() => import("./pages/TestHistory"));
const Courses = lazy(() => import("./pages/Courses"));
const Reels = lazy(() => import("./pages/Reels"));
const Centers = lazy(() => import("./pages/Centers"));
const CenterProfile = lazy(() => import("./pages/CenterProfile"));
const Olympiads = lazy(() => import("./pages/Olympiads"));
const OlympiadDetail = lazy(() => import("./pages/OlympiadDetail"));
const Games = lazy(() => import("./pages/Games"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CenterPanelGate = lazy(() => import("./pages/center-panel/CenterPanelGate"));
const CenterPanelLayout = lazy(() => import("./pages/center-panel/CenterPanelLayout"));
const CenterDashboard = lazy(() => import("./pages/center-panel/CenterDashboard"));
const CenterCoursesSection = lazy(() => import("./pages/center-panel/CenterCoursesSection"));
const CenterOlympiadsSection = lazy(() => import("./pages/center-panel/CenterOlympiadsSection"));
const CenterReelsSection = lazy(() => import("./pages/center-panel/CenterReelsSection"));
const CenterAnalyticsSection = lazy(() => import("./pages/center-panel/CenterAnalyticsSection"));
const CenterSeoSection = lazy(() => import("./pages/center-panel/CenterSeoSection"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Redirect any /center or /center/xxx to /center-panel so dashboard always works
const CenterRedirect = () => {
  const { pathname } = useLocation();
  const afterCenter = pathname.slice(7); // after "/center"
  const segment = afterCenter.replace(/^\//, "").split("/")[0] || "";
  const to =
    !segment || segment === "dashboard"
      ? "/center-panel"
      : `/center-panel/${afterCenter.replace(/^\//, "")}`;
  return <Navigate to={to} replace />;
};

// Error boundary for center panel so crashes show a message instead of a blank screen
class CenterPanelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false, message: undefined as string | undefined };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("Center panel error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
          <h1 className="text-xl font-bold text-destructive mb-2">Center panel error</h1>
          <p className="text-muted-foreground text-center mb-4">
            Something went wrong loading the center panel.
          </p>
          {this.state.message && (
            <pre className="mb-6 rounded bg-muted p-3 text-xs whitespace-pre-wrap break-all max-w-lg">
              {this.state.message}
            </pre>
          )}
          <Link to="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <PreviewModeProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/admin-login" element={<AdminAuth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/user" element={<Onboarding />} />
                <Route path="/onboarding/center" element={<Onboarding />} />
                
                {/* User-only routes (regular students) */}
                <Route path="/" element={<UserRoute><Feed /></UserRoute>} />
                <Route path="/dashboard" element={<UserRoute><Feed /></UserRoute>} />
                <Route path="/test-history" element={<UserRoute><TestHistory /></UserRoute>} />
                <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
                
                {/* Routes accessible by both Users and Centers (preview mode for Centers) */}
                <Route path="/tests" element={<UserOrCenterRoute><Tests /></UserOrCenterRoute>} />
                <Route path="/courses" element={<UserOrCenterRoute><Courses /></UserOrCenterRoute>} />
                <Route path="/reels" element={<UserOrCenterRoute><Reels /></UserOrCenterRoute>} />
                <Route path="/centers" element={<UserOrCenterRoute><Centers /></UserOrCenterRoute>} />
                <Route path="/centers/:id" element={<UserOrCenterRoute><CenterProfile /></UserOrCenterRoute>} />
                <Route path="/olympiads" element={<UserOrCenterRoute><Olympiads /></UserOrCenterRoute>} />
                <Route path="/olympiads/:id" element={<UserOrCenterRoute><OlympiadDetail /></UserOrCenterRoute>} />
                <Route path="/games" element={<UserOrCenterRoute><Games /></UserOrCenterRoute>} />
                <Route path="/games/tic-tac-toe" element={<UserOrCenterRoute><Games /></UserOrCenterRoute>} />
                
                {/* Admin-only routes */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminDashboard />} />
                  <Route path="centers" element={<AdminDashboard />} />
                  <Route path="courses" element={<AdminDashboard />} />
                  <Route path="olympiads" element={<AdminDashboard />} />
                </Route>
                
                {/* /center and /center/dashboard etc. redirect to /center-panel */}
                <Route path="/center" element={<Navigate to="/center-panel" replace />} />
                <Route path="/center/dashboard" element={<Navigate to="/center-panel" replace />} />
                <Route path="/center/courses" element={<Navigate to="/center-panel/courses" replace />} />
                <Route path="/center/tests" element={<Navigate to="/center-panel/tests" replace />} />
                <Route path="/center/olympiads" element={<Navigate to="/center-panel/olympiads" replace />} />
                <Route path="/center/reels" element={<Navigate to="/center-panel/reels" replace />} />
                <Route path="/center/profile" element={<Navigate to="/center-panel/profile" replace />} />
                <Route path="/center/analytics" element={<Navigate to="/center-panel/analytics" replace />} />
                <Route path="/center/seo" element={<Navigate to="/center-panel/seo" replace />} />
                <Route path="/center/*" element={<CenterRedirect />} />
                <Route path="/center-panel" element={<CenterPanelGate><CenterPanelErrorBoundary><CenterPanelLayout basePath="/center-panel" /></CenterPanelErrorBoundary></CenterPanelGate>}>
                  <Route index element={<CenterDashboard />} />
                  <Route path="courses" element={<CenterCoursesSection />} />
                  <Route path="olympiads" element={<CenterOlympiadsSection />} />
                  <Route path="reels" element={<CenterReelsSection />} />
                  <Route path="analytics" element={<CenterAnalyticsSection />} />
                  <Route path="seo" element={<CenterSeoSection />} />
                  <Route path="profile" element={<Navigate to="/center-panel" replace />} />
                  <Route path="tests" element={<Navigate to="/center-panel" replace />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </PreviewModeProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
