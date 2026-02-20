export type UserRole = 'admin' | 'design_head' | 'designer' | 'execution_head' | 'execution_manager' | 'site_supervisor' | 'account_manager';

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
  execution_head: 'Execution Head',
  execution_manager: 'Execution Manager',
  site_supervisor: 'Site Supervisor',
  account_manager: 'Account Manager',
};

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  design_head: 'bg-accent text-accent-foreground',
  designer: 'bg-secondary text-secondary-foreground',
  execution_head: 'bg-warning text-warning-foreground',
  execution_manager: 'bg-orange-500/20 text-orange-700',
  site_supervisor: 'bg-muted text-foreground',
  account_manager: 'bg-emerald-500/20 text-emerald-700',
};
