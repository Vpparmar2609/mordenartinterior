import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
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
  ArrowRight,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  design_head: 'Design Head',
  designer: 'Designer',
  execution_head: 'Execution Head',
  execution_manager: 'Execution Manager',
  site_supervisor: 'Site Supervisor',
  client: 'Client',
};

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

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<'role' | 'credentials'>('credentials');
  const { signIn, signUp, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (!selectedRole) {
        toast.error('Please select a role');
        return;
      }
      const { error } = await signUp(email, password, name, selectedRole);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    }
  };

  const roles: UserRole[] = ['admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor', 'client'];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Modern Art Interior
          </h1>
          <p className="text-muted-foreground">
            Project Management System
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          {isSignUp && step === 'role' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  Select Your Role
                </h2>
                <p className="text-muted-foreground text-sm">
                  Choose how you want to access the platform
                </p>
              </div>
              
              <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className="group flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border/50 hover:border-primary/50 hover:bg-background transition-all duration-200 text-left"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {roleIcons[role]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm">{roleLabels[role]}</div>
                      <div className="text-xs text-muted-foreground truncate">{roleDescriptions[role]}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignUp(false)}
                className="w-full mt-4"
              >
                Already have an account? Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              {isSignUp && selectedRole && (
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change role ({roleLabels[selectedRole]})
                </button>
              )}
              
              <div className="text-center">
                <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
                  {isSignUp ? <UserPlus className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </div>
                <h2 className="text-xl font-display font-semibold text-foreground mb-1">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {isSignUp ? 'Enter your details to get started' : 'Sign in to your account'}
                </p>
              </div>

              <div className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-10 bg-background/60 border-border/50 focus:border-primary/50"
                        required
                      />
                    </div>
                  </div>
                )}

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
                      className="pl-10 bg-background/60 border-border/50 focus:border-primary/50"
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
                      className="pl-10 bg-background/60 border-border/50 focus:border-primary/50"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isLoading}>
                {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    if (!isSignUp) {
                      setStep('role');
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
