import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/auth';
import { SplineScene } from '@/components/ui/splite';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';

// Unified dashboard for most roles
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';

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

  const renderDashboard = () => {
    if (!role) {
      return (
        <div className="text-center py-12 glass-card rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-display mb-2">Welcome to Modern Art Interior</h2>
          <p className="text-muted-foreground mb-4">Your role has not been assigned yet.</p>
          <p className="text-sm text-muted-foreground">Please contact an administrator to assign your role, or wait for approval.</p>
        </div>
      );
    }
    
    // All roles use the unified AdminDashboard
    return <AdminDashboard />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 3D Hero Section */}
      <Card className="w-full overflow-hidden relative min-h-[300px] md:min-h-[400px]">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="hsl(var(--primary))"
        />
        <div className="flex flex-col md:flex-row h-full">
          {/* Left content */}
          <div className="flex-1 p-6 md:p-10 relative z-10 flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
              {getGreeting()}, {profile?.name || 'User'}
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base max-w-lg">
              {role ? roleLabels[role] : 'Team Member'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Right 3D content */}
          <div className="flex-1 relative min-h-[200px] md:min-h-[300px]">
            <SplineScene 
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </Card>

      {/* Role-specific content */}
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
