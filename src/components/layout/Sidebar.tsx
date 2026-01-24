import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, roleLabels } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Palette,
  HardHat,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor', 'client'],
  },
  {
    icon: <FolderKanban className="w-5 h-5" />,
    label: 'Projects',
    href: '/projects',
    roles: ['admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor', 'client'],
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: 'Team',
    href: '/team',
    roles: ['admin', 'design_head', 'execution_head'],
  },
  {
    icon: <Palette className="w-5 h-5" />,
    label: 'Design Tasks',
    href: '/design-tasks',
    roles: ['admin', 'design_head', 'designer'],
  },
  {
    icon: <HardHat className="w-5 h-5" />,
    label: 'Execution Tasks',
    href: '/execution-tasks',
    roles: ['admin', 'execution_head', 'execution_manager', 'site_supervisor'],
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    label: 'Daily Reports',
    href: '/daily-reports',
    roles: ['admin', 'execution_head', 'execution_manager', 'site_supervisor'],
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Issues',
    href: '/issues',
    roles: ['admin', 'design_head', 'execution_head', 'execution_manager'],
  },
  {
    icon: <CheckSquare className="w-5 h-5" />,
    label: 'Approvals',
    href: '/approvals',
    roles: ['admin', 'design_head', 'execution_head', 'client'],
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: 'Messages',
    href: '/messages',
    roles: ['admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor', 'client'],
  },
  {
    icon: <FileText className="w-5 h-5" />,
    label: 'Documents',
    href: '/documents',
    roles: ['admin', 'design_head', 'designer', 'execution_head', 'client'],
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Analytics',
    href: '/analytics',
    roles: ['admin'],
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
    href: '/settings',
    roles: ['admin'],
  },
];

export const Sidebar: React.FC = () => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const filteredItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-warm">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
              Modern Art
            </h1>
            <p className="text-xs text-muted-foreground">Interior Design</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-warm flex items-center justify-center text-primary-foreground font-medium">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">
              {role && roleLabels[role]}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
