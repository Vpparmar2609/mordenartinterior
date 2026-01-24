import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, roleLabels } from '@/types/auth';
import { 
  Crown, 
  Palette, 
  PenTool, 
  HardHat, 
  Users, 
  ClipboardCheck, 
  User,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Crown className="w-5 h-5" />,
  design_head: <Palette className="w-5 h-5" />,
  designer: <PenTool className="w-5 h-5" />,
  execution_head: <HardHat className="w-5 h-5" />,
  execution_manager: <Users className="w-5 h-5" />,
  site_supervisor: <ClipboardCheck className="w-5 h-5" />,
  client: <User className="w-5 h-5" />,
};

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full system control',
  design_head: 'Manage design team',
  designer: 'Create & upload designs',
  execution_head: 'Manage execution teams',
  execution_manager: 'Oversee site work',
  site_supervisor: 'Daily site updates',
  client: 'View project progress',
};

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<'role' | 'credentials'>('role');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(`${role}@modernart.com`);
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    await login(email, password, selectedRole);
    navigate('/dashboard');
  };

  const roles: UserRole[] = ['admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor', 'client'];

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 'role' ? (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
              Select Your Role
            </h2>
            <p className="text-muted-foreground text-sm">
              Choose how you want to access the platform
            </p>
          </div>
          
          <div className="grid gap-3">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="group flex items-center gap-4 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-card transition-all duration-200 text-left"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {roleIcons[role]}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{roleLabels[role]}</div>
                  <div className="text-sm text-muted-foreground">{roleDescriptions[role]}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <button
            type="button"
            onClick={() => setStep('role')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Change role
          </button>
          
          <div className="text-center">
            <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
              {selectedRole && roleIcons[selectedRole]}
            </div>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-1">
              Sign in as {selectedRole && roleLabels[selectedRole]}
            </h2>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to continue
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10 bg-card/60 border-border/50 focus:border-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-card/60 border-border/50 focus:border-primary/50"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Demo mode: Any password works
          </p>
        </form>
      )}
    </div>
  );
};
