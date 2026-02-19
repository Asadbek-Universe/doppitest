import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const CenterPanelLayout = lazy(() => import("./pages/center-panel/CenterPanelLayout"));
const CenterDashboard = lazy(() => import("./pages/center-panel/CenterDashboard"));
const CenterCoursesSection = lazy(() => import("./pages/center-panel/CenterCoursesSection"));
const CenterTestsSection = lazy(() => import("./pages/center-panel/CenterTestsSection"));
const CenterOlympiadsSection = lazy(() => import("./pages/center-panel/CenterOlympiadsSection"));
const CenterReelsSection = lazy(() => import("./pages/center-panel/CenterReelsSection"));
const CenterProfileSection = lazy(() => import("./pages/center-panel/CenterProfileSection"));
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                <Route path="/admin-login" element={<AdminAuth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                
                {/* User-only routes (regular students) */}
                <Route path="/" element={<UserRoute><Feed /></UserRoute>} />
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
                
                {/* Admin-only routes */}
                <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                
                {/* Center-only routes (nested under layout) */}
                <Route path="/center-panel" element={<CenterRoute><CenterPanelLayout /></CenterRoute>}>
                  <Route index element={<CenterDashboard />} />
                  <Route path="courses" element={<CenterCoursesSection />} />
                  <Route path="tests" element={<CenterTestsSection />} />
                  <Route path="olympiads" element={<CenterOlympiadsSection />} />
                  <Route path="reels" element={<CenterReelsSection />} />
                  <Route path="profile" element={<CenterProfileSection />} />
                  <Route path="analytics" element={<CenterAnalyticsSection />} />
                  <Route path="seo" element={<CenterSeoSection />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </PreviewModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
