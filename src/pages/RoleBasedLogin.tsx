import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { RoleCard } from '@/components/auth/RoleCard';
import { roleLabels } from '@/types/auth';
import { 
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const allRoles: UserRole[] = [
  'admin',
  'design_head',
  'designer',
  'execution_manager',
  'site_supervisor'
];

type LoginStep = 'role-select' | 'credentials';

const RoleBasedLogin: React.FC = () => {
  const [step, setStep] = useState<LoginStep>('role-select');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  
  const { signIn, signUp, isLoading, isAuthenticated, role, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated (with or without role)
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Small delay to allow role fetch to complete
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleRoleSelect = (roleToSelect: UserRole) => {
    setSelectedRole(roleToSelect);
    setRoleError(null);
  };

  const handleContinueToLogin = () => {
    if (!selectedRole) {
      toast.error('Please select your role to continue');
      return;
    }
    setStep('credentials');
  };

  const handleBack = () => {
    setStep('role-select');
    setRoleError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError(null);
    
    if (isSignUp) {
      const { error } = await signUp(email, password, name);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created! An admin will assign your role.');
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
        // Role verification will happen after auth state updates
        toast.success(`Welcome! Logging in as ${roleLabels[selectedRole!]}`);
      }
    }
  };

  // After login, verify role matches or handle no-role scenario
  useEffect(() => {
    if (isAuthenticated && step === 'credentials' && !isLoading) {
      // Give time for role to be fetched
      const timer = setTimeout(() => {
        if (role && selectedRole) {
          if (role !== selectedRole) {
            setRoleError(`Your account is registered as ${roleLabels[role]}, not ${roleLabels[selectedRole]}. Redirecting to your dashboard...`);
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            navigate('/dashboard');
          }
        } else if (!role) {
          // No role assigned yet - still redirect to dashboard where they'll see appropriate message
          navigate('/dashboard');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, role, selectedRole, step, navigate, isLoading]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-warm mb-4 shadow-lg">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Modern Art Interior
          </h1>
          <p className="text-muted-foreground">
            Project Management System
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-2xl">
          <div className="glass-card rounded-2xl p-8 animate-fade-in">
            {step === 'role-select' ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-foreground mb-1">
                    Select Your Role
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose how you want to access the system
                  </p>
                </div>

                {/* Role Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {allRoles.map((roleOption) => (
                    <RoleCard
                      key={roleOption}
                      role={roleOption}
                      isSelected={selectedRole === roleOption}
                      onClick={() => handleRoleSelect(roleOption)}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleContinueToLogin}
                  disabled={!selectedRole}
                  variant="default"
                  size="lg"
                  className="w-full bg-gradient-warm hover:opacity-90"
                >
                  Continue to Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      as {selectedRole && roleLabels[selectedRole]}
                    </p>
                  </div>
                </div>

                {roleError && (
                  <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <p className="text-sm text-warning">{roleError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                          placeholder="Your full name"
                          className="pl-10 bg-card/60 border-border/50 focus:border-primary/50"
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
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="default" 
                    size="lg" 
                    className="w-full bg-gradient-warm hover:opacity-90" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign In' 
                        : "Don't have an account? Sign Up"}
                    </button>
                  </div>

                  {isSignUp && (
                    <p className="text-xs text-center text-muted-foreground">
                      Note: New accounts need role assignment by an admin.
                      The first user automatically becomes Admin.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedLogin;
