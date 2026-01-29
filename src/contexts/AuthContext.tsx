import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'design_head' | 'designer' | 'execution_manager' | 'site_supervisor';

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  bootstrapAdmin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Fetch role - use maybeSingle to handle no role case
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      return {
        profile: profile as Profile | null,
        role: (roleData?.role as UserRole) || null
      };
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return { profile: null, role: null };
    }
  }, []);

  const bootstrapAdmin = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('bootstrap_first_admin');
      if (error) {
        console.error('Bootstrap admin error:', error);
        return false;
      }
      if (data) {
        // Refresh user data to get the new admin role
        if (state.user) {
          const { profile, role } = await fetchUserData(state.user.id);
          setState(prev => ({ ...prev, profile, role }));
        }
      }
      return data;
    } catch (error) {
      console.error('Bootstrap admin error:', error);
      return false;
    }
  }, [state.user, fetchUserData]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session: session,
          isAuthenticated: !!session?.user,
          isLoading: false,
        }));

        // Fetch user data after auth state change
        if (session?.user) {
          setTimeout(async () => {
            const { profile, role } = await fetchUserData(session.user.id);
            setState(prev => ({
              ...prev,
              profile,
              role,
            }));
            
            // If no role, try to bootstrap as admin
            if (!role) {
              const { data } = await supabase.rpc('bootstrap_first_admin');
              if (data) {
                // Refetch role after bootstrap
                const updated = await fetchUserData(session.user.id);
                setState(prev => ({
                  ...prev,
                  profile: updated.profile,
                  role: updated.role,
                }));
              }
            }
          }, 0);
        } else {
          setState(prev => ({
            ...prev,
            profile: null,
            role: null,
          }));
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session: session,
        isAuthenticated: !!session?.user,
        isLoading: false,
      }));

      if (session?.user) {
        fetchUserData(session.user.id).then(async ({ profile, role }) => {
          setState(prev => ({
            ...prev,
            profile,
            role,
          }));
          
          // If no role, try to bootstrap as admin
          if (!role) {
            const { data } = await supabase.rpc('bootstrap_first_admin');
            if (data) {
              // Refetch role after bootstrap
              const updated = await fetchUserData(session.user.id);
              setState(prev => ({
                ...prev,
                profile: updated.profile,
                role: updated.role,
              }));
            }
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setState(prev => ({ ...prev, isLoading: false }));
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
        }
      }
    });

    setState(prev => ({ ...prev, isLoading: false }));
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const { profile, role } = await fetchUserData(state.user.id);
      setState(prev => ({
        ...prev,
        profile,
        role,
      }));
    }
  }, [state.user, fetchUserData]);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, refreshProfile, bootstrapAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
