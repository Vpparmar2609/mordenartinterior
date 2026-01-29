export type UserRole = 'admin' | 'design_head' | 'designer' | 'execution_manager' | 'site_supervisor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  design_head: 'Design Head',
  designer: 'Designer',
  execution_manager: 'Execution Manager',
  site_supervisor: 'Site Supervisor',
};

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  design_head: 'bg-accent text-accent-foreground',
  designer: 'bg-secondary text-secondary-foreground',
  execution_manager: 'bg-warning text-warning-foreground',
  site_supervisor: 'bg-muted text-foreground',
};
