import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, roleLabels } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
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
  CheckSquare,
  AlertTriangle,
  Building2,
  Bell,
  IndianRupee,
  Menu,
  X,
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
    roles: ['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor', 'account_manager'],
  },
  {
    icon: <FolderKanban className="w-5 h-5" />,
    label: 'Projects',
    href: '/projects',
    roles: ['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor'],
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: 'Team',
    href: '/team',
    roles: ['admin', 'design_head', 'execution_manager'],
  },
  {
    icon: <Palette className="w-5 h-5" />,
    label: 'Design Tasks',
    href: '/design-tasks',
    roles: ['admin', 'design_head', 'designer', 'execution_manager'],
  },
  {
    icon: <HardHat className="w-5 h-5" />,
    label: 'Execution Tasks',
    href: '/execution-tasks',
    roles: ['admin', 'execution_manager', 'site_supervisor'],
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Issues',
    href: '/issues',
    roles: ['admin', 'design_head', 'execution_manager'],
  },
  {
    icon: <CheckSquare className="w-5 h-5" />,
    label: 'Approvals',
    href: '/approvals',
    roles: ['admin', 'design_head', 'execution_manager'],
  },
  {
    icon: <IndianRupee className="w-5 h-5" />,
    label: 'Accounts',
    href: '/accounts',
    roles: ['admin', 'account_manager'],
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: 'Messages',
    href: '/messages',
    roles: ['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor'],
  },
  {
    icon: <FileText className="w-5 h-5" />,
    label: 'Documents',
    href: '/documents',
    roles: ['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor'],
  },
  {
    icon: <Bell className="w-5 h-5" />,
    label: 'Notifications',
    href: '/notifications',
    roles: ['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor', 'account_manager'],
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
    href: '/settings',
    roles: ['admin'],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const filteredItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    onClose();
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300 ease-in-out",
      // On mobile: slide in/out. On desktop: always visible
      "md:translate-x-0",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo and Notification */}
      <div className="p-4 md:p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-warm">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-base md:text-lg font-semibold text-sidebar-foreground">
                Modern Art
              </h1>
              <p className="text-xs text-muted-foreground">Interior Design</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {/* Close button - mobile only */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={handleNavClick}
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
      <div className="p-3 md:p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-warm flex items-center justify-center text-primary-foreground font-medium text-sm">
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

// Mobile hamburger trigger button — exported so DashboardLayout can place it
export const SidebarTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden fixed top-3 left-3 z-40 p-2.5 rounded-xl bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-lg active:scale-95 transition-transform"
  >
    <Menu className="w-5 h-5" />
  </button>
);

// Backdrop overlay for mobile
const Backdrop: React.FC<{ open: boolean; onClick: () => void }> = ({ open, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300",
      open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
    )}
  />
);

// Main export — manages its own open state and renders sidebar + backdrop
export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SidebarTrigger onClick={() => setOpen(true)} />
      <Backdrop open={open} onClick={() => setOpen(false)} />
      <SidebarContent open={open} onClose={() => setOpen(false)} />
    </>
  );
};
