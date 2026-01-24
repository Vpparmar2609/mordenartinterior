import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
          <div className="max-w-lg text-center">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-warm mb-8 shadow-lg">
              <Building2 className="w-12 h-12 text-primary-foreground" />
            </div>
            
            <h1 className="font-display text-5xl font-bold text-foreground mb-4 leading-tight">
              Modern Art
              <span className="block gradient-text">Interior</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Streamline your interior design projects from concept to completion with our comprehensive management platform.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                { title: 'Design Management', desc: '15-step design workflow' },
                { title: 'Execution Tracking', desc: 'Real-time site updates' },
                { title: 'Client Portal', desc: 'Transparent progress view' },
                { title: 'Team Collaboration', desc: 'Role-based access' },
              ].map((feature) => (
                <div key={feature.title} className="p-4 rounded-xl bg-card/40 backdrop-blur-sm border border-border/30">
                  <h3 className="font-medium text-foreground text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex p-3 rounded-xl bg-gradient-warm mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Modern Art Interior
            </h1>
          </div>

          <div className="w-full max-w-md">
            <div className="glass-card rounded-2xl p-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
