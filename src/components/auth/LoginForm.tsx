import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  User,
  Mail,
  Lock,
  UserPlus
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signIn, signUp, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        navigate('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account created',
          description: 'You are now signed in as Admin',
        });
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
            {mode === 'signup' ? <UserPlus className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-display font-semibold text-foreground mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'First user becomes Admin automatically'}
          </p>
        </div>

        <div className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
        </div>

        <Button type="submit" variant="default" size="lg" className="w-full bg-gradient-warm hover:opacity-90" disabled={isLoading}>
          {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>

        <div className="text-center">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Don't have an account? <span className="font-medium">Sign up</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Already have an account? <span className="font-medium">Sign in</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
