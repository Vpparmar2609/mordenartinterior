import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/auth';
import { SplineScene } from '@/components/ui/splite';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';

// Unified dashboard for most roles
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { greeting: 'Good morning', emoji: '🌅' };
  if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 21) return { greeting: 'Good evening', emoji: '🌇' };
  return { greeting: 'Good night', emoji: '🌙' };
};

const getMotivationalMessage = (role: string | null) => {
  const hour = new Date().getHours();
  const day = new Date().getDay(); // 0=Sun, 6=Sat

  if (day === 0 || day === 6) {
    return "Even the best take time to recharge. Enjoy your weekend — great work deserves great rest. 🌿";
  }

  const messages: Record<string, string[]> = {
    admin: [
      "Your vision drives the whole team forward. Lead with clarity today.",
      "Great leaders don't just manage projects — they build dreams. Keep going.",
      "Every decision you make today shapes tomorrow's success. Trust your instincts.",
      "The best teams are built by leaders who care. Your work matters.",
    ],
    design_head: [
      "Creativity is intelligence having fun. Push the boundaries of design today.",
      "Your eye for detail turns spaces into stories. Every pixel counts.",
      "Design isn't just about looks — it's about creating experiences people love.",
      "Guide your team's creativity with confidence. The best designs start with you.",
    ],
    designer: [
      "Every blank canvas is an opportunity to create something extraordinary.",
      "Your designs are transforming spaces and changing lives — keep creating.",
      "The details are what make design unforgettable. You've got this.",
      "A great designer sees potential where others see empty space.",
    ],
    execution_manager: [
      "Excellence in execution is what turns great plans into reality.",
      "Your leadership on-site keeps everything moving forward. The team counts on you.",
      "Every project completed is a testament to your dedication and skill.",
      "Manage with precision, lead with purpose. Today is yours to own.",
    ],
    site_supervisor: [
      "You're the eyes and hands that make every project come alive on-site.",
      "Attention to detail on-site today means a perfect project tomorrow.",
      "Your work transforms blueprints into beautiful spaces people will love.",
      "Every brick laid under your watch is a step toward something amazing.",
    ],
    account_manager: [
      "Numbers tell stories — and you make sure every story has a happy ending.",
      "Your financial oversight keeps the whole machine running smoothly.",
      "Accuracy and trust are your superpowers. Keep up the great work.",
      "Behind every successful project is an account manager who never misses a beat.",
    ],
    client: [
      "Your dream home is becoming reality. Exciting times ahead!",
      "Great things are being built for you. Stay inspired!",
      "Your vision is in expert hands. Watch the magic unfold.",
    ],
  };

  const pool = messages[role || ''] || [
    "Today is a fresh opportunity to do great work. Make it count.",
    "Show up, give your best, and let results speak for themselves.",
    "Every day is a chance to build something you're proud of.",
  ];

  // Rotate based on date so it changes daily
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return pool[dayOfYear % pool.length];
};

const Dashboard: React.FC = () => {
  const { profile, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const { greeting, emoji } = getGreeting();
  const motivationalMessage = getMotivationalMessage(role);

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
    
    return <AdminDashboard />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Fancy Motivational Hero */}
      <Card className="w-full overflow-hidden relative min-h-[280px] md:min-h-[360px]">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="hsl(var(--primary))"
        />
        <div className="flex flex-col md:flex-row h-full">
          {/* Left content */}
          <div className="flex-1 p-6 md:p-10 relative z-10 flex flex-col justify-center">
            {/* Emoji + time-of-day chip */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Main greeting */}
            <h1 className="text-3xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground leading-tight">
              {greeting},<br />
              <span className="text-primary">{profile?.name?.split(' ')[0] || 'there'}</span>
            </h1>

            {/* Role badge */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                {role ? roleLabels[role] : 'Team Member'}
              </span>
            </div>

            {/* Motivational quote with decorative line */}
            <div className="mt-5 relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-primary/0 rounded-full" />
              <p className="pl-4 text-sm md:text-base text-muted-foreground italic leading-relaxed max-w-md">
                {motivationalMessage}
              </p>
            </div>

            {/* Time display */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                You're on time
              </div>
            </div>
          </div>

          {/* Right 3D content */}
          <div className="flex-1 relative min-h-[180px] md:min-h-[280px]">
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
