import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/auth';

// Role-specific dashboard imports
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { DesignHeadDashboard } from '@/components/dashboards/DesignHeadDashboard';
import { DesignerDashboard } from '@/components/dashboards/DesignerDashboard';
import { ExecutionHeadDashboard } from '@/components/dashboards/ExecutionHeadDashboard';
import { ExecutionManagerDashboard } from '@/components/dashboards/ExecutionManagerDashboard';
import { SiteSupervisorDashboard } from '@/components/dashboards/SiteSupervisorDashboard';
import { ClientDashboard } from '@/components/dashboards/ClientDashboard';

const Dashboard: React.FC = () => {
  const { profile, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'design_head':
        return <DesignHeadDashboard />;
      case 'designer':
        return <DesignerDashboard />;
      case 'execution_head':
        return <ExecutionHeadDashboard />;
      case 'execution_manager':
        return <ExecutionManagerDashboard />;
      case 'site_supervisor':
        return <SiteSupervisorDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-display mb-2">Welcome to Modern Art Interior</h2>
            <p className="text-muted-foreground">Your role has not been assigned yet. Please contact an administrator.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            {getGreeting()}, {profile?.name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {role ? roleLabels[role] : 'Team Member'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Role-specific content */}
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
