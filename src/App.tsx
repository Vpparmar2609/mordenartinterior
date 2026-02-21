import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, UserRole } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import RoleBasedLogin from "./pages/RoleBasedLogin";

// Lazy-load all page components for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Team = lazy(() => import("./pages/Team"));
const DesignTasks = lazy(() => import("./pages/DesignTasks"));
const ExecutionTasks = lazy(() => import("./pages/ExecutionTasks"));
const Issues = lazy(() => import("./pages/Issues"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Messages = lazy(() => import("./pages/Messages"));
const Documents = lazy(() => import("./pages/Documents"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Accounts = lazy(() => import("./pages/Accounts"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes — reduces refetches across 80+ users
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      refetchOnWindowFocus: false, // prevent refetch storms when switching tabs
      retry: 1, // reduce retry overhead
    },
  },
});

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If allowedRoles specified, enforce role check
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public route - Role-based login */}
              <Route path="/" element={<RoleBasedLogin />} />
              
              {/* Protected routes with dashboard layout */}
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor']}>
                    <Projects />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor']}>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />
                <Route path="/team" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'execution_manager']}>
                    <Team />
                  </ProtectedRoute>
                } />
                <Route path="/design-tasks" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'designer', 'execution_manager']}>
                    <DesignTasks />
                  </ProtectedRoute>
                } />
                <Route path="/execution-tasks" element={
                  <ProtectedRoute allowedRoles={['admin', 'execution_manager', 'site_supervisor']}>
                    <ExecutionTasks />
                  </ProtectedRoute>
                } />
                <Route path="/issues" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'execution_manager']}>
                    <Issues />
                  </ProtectedRoute>
                } />
                <Route path="/approvals" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'execution_manager']}>
                    <Approvals />
                  </ProtectedRoute>
                } />
                <Route path="/accounts" element={
                  <ProtectedRoute allowedRoles={['admin', 'account_manager']}>
                    <Accounts />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor']}>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute allowedRoles={['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor']}>
                    <Documents />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
