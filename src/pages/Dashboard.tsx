import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/auth';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Sparkles, TrendingUp, Clock, Zap, Timer } from 'lucide-react';

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

const WORKDAY_START_HOUR = 10; // 10 AM
const WORKDAY_END_HOUR = 18; // 6 PM

const Dashboard: React.FC = () => {
  const { profile, role, isLoading } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const { greeting, emoji } = getGreeting();
  const motivationalMessage = getMotivationalMessage(role);

  // Live clock helpers
  const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  
  const getWorkdayCountdown = () => {
    const endOfDay = new Date(now);
    endOfDay.setHours(WORKDAY_END_HOUR, 0, 0, 0);
    const diff = endOfDay.getTime() - now.getTime();
    if (diff <= 0) return null; // workday is over
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return { hours, minutes };
  };

  const countdown = getWorkdayCountdown();

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
      {/* Motivational Hero — clean, animated, responsive */}
      <Card className="w-full overflow-hidden relative group">
        {/* Animated background layers */}
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="hsl(var(--primary))"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 md:w-80 md:h-80 bg-primary/8 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 md:w-64 md:h-64 bg-accent/8 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 p-5 sm:p-8 md:p-10">
          {/* Top row: date chip + status */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl animate-float">{emoji}</span>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Live clock */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/30 backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-medium text-foreground tabular-nums">{timeString}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Greeting */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold leading-tight tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
              {greeting},
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              {profile?.name?.split(' ')[0] || 'there'}
            </span>
          </h1>

          {/* Role badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/60 border border-border/40 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {role ? roleLabels[role] : 'Team Member'}
            </span>
          </div>

          {/* Motivational quote */}
          <div className="mt-5 relative max-w-lg">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />
            <p className="pl-4 text-sm sm:text-base text-muted-foreground italic leading-relaxed">
              {motivationalMessage}
            </p>
          </div>

          {/* Quick stat pills */}
          <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
            {[
              { icon: Clock, label: 'On Time', color: 'text-success' },
              { icon: TrendingUp, label: 'Productive', color: 'text-primary' },
              { icon: Zap, label: 'Ready', color: 'text-warning' },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/30 backdrop-blur-sm text-xs text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 active:scale-95 cursor-default"
              >
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                {label}
              </div>
            ))}
            {/* Workday countdown pill */}
            {countdown && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm text-xs text-primary transition-all duration-300 hover:bg-primary/15 cursor-default">
                <Timer className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{countdown.hours}h {countdown.minutes}m left</span>
              </div>
            )}
            {!countdown && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 backdrop-blur-sm text-xs text-success cursor-default">
                <Clock className="w-3.5 h-3.5" />
                Workday complete 🎉
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Role-specific content */}
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
