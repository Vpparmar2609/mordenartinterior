import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import RoleBasedLogin from "./pages/RoleBasedLogin";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Team from "./pages/Team";
import DesignTasks from "./pages/DesignTasks";
import ExecutionTasks from "./pages/ExecutionTasks";
import DailyReports from "./pages/DailyReports";
import Issues from "./pages/Issues";
import Approvals from "./pages/Approvals";
import Messages from "./pages/Messages";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
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
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route - Role-based login */}
            <Route path="/" element={<RoleBasedLogin />} />
            
            {/* Protected routes with dashboard layout */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/team" element={<Team />} />
              <Route path="/design-tasks" element={<DesignTasks />} />
              <Route path="/execution-tasks" element={<ExecutionTasks />} />
              <Route path="/daily-reports" element={<DailyReports />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
