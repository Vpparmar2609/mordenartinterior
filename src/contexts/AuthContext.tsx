import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<UserRole, User> = {
  admin: {
    id: '1',
    email: 'admin@modernart.com',
    name: 'Arjun Mehta',
    role: 'admin',
    createdAt: new Date(),
  },
  design_head: {
    id: '2',
    email: 'design@modernart.com',
    name: 'Priya Sharma',
    role: 'design_head',
    createdAt: new Date(),
  },
  designer: {
    id: '3',
    email: 'designer@modernart.com',
    name: 'Rahul Patel',
    role: 'designer',
    createdAt: new Date(),
  },
  execution_head: {
    id: '4',
    email: 'execution@modernart.com',
    name: 'Vikram Singh',
    role: 'execution_head',
    createdAt: new Date(),
  },
  execution_manager: {
    id: '5',
    email: 'manager@modernart.com',
    name: 'Amit Kumar',
    role: 'execution_manager',
    createdAt: new Date(),
  },
  site_supervisor: {
    id: '6',
    email: 'supervisor@modernart.com',
    name: 'Rajesh Verma',
    role: 'site_supervisor',
    createdAt: new Date(),
  },
  client: {
    id: '7',
    email: 'client@example.com',
    name: 'Neha Gupta',
    role: 'client',
    createdAt: new Date(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers[role];
    setState({
      user: { ...user, email },
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
