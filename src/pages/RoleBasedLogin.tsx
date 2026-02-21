import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RoleCard } from '@/components/auth/RoleCard';
import { roleLabels } from '@/types/auth';
import { 
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const allRoles: UserRole[] = [
  'admin',
  'design_head',
  'designer',
  'execution_manager',
  'site_supervisor',
  'account_manager'
];

type LoginStep = 'role-select' | 'credentials';

const RoleBasedLogin: React.FC = () => {
  const [step, setStep] = useState<LoginStep>('role-select');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);
  
  const { signIn, signOut, isLoading, isAuthenticated, role } = useAuth();
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

  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError(null);
    setIsValidating(true);
    
    const { error } = await signIn(email, password);
    if (error) {
      setIsValidating(false);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Auth succeeded — now validate role server-side
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .maybeSingle();

      if (roleError) {
        console.error('Role fetch error:', roleError);
      }

      const actualRole = roleData?.role as UserRole | null;

      if (!actualRole) {
        // No role assigned — sign out
        await signOut();
        setIsValidating(false);
        setRoleError('Your account has no role assigned. Please contact your administrator.');
        return;
      }

      if (actualRole !== selectedRole) {
        // Role mismatch — sign out immediately
        await signOut();
        setIsValidating(false);
        setRoleError('Invalid role selected. Please choose your correct role to log in.');
        return;
      }

      // Role matches — allow login
      setIsValidating(false);
      toast.success(`Welcome! Logged in as ${roleLabels[selectedRole!]}`);
      navigate('/dashboard');
    } catch (err) {
      await signOut();
      setIsValidating(false);
      setRoleError('An error occurred validating your role. Please try again.');
    }
  };

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
                      Sign In
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      as {selectedRole && roleLabels[selectedRole]}
                    </p>
                  </div>
                </div>

                {roleError && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{roleError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

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
                    disabled={isLoading || isValidating}
                  >
                    {isLoading || isValidating ? 'Verifying...' : 'Sign In'}
                  </Button>
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
