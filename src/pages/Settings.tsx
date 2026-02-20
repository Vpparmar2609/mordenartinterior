import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { UserManagementDialog } from '@/components/users/UserManagementDialog';
import {
  Settings as SettingsIcon,
  Users,
  Building2,
  Shield,
  Bell,
  UserPlus,
  Info,
} from 'lucide-react';

const Settings: React.FC = () => {
  const { profile, role } = useAuth();
  const { users } = useUsers();
  const [showUserManagement, setShowUserManagement] = useState(false);

  const isAdmin = role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">You don't have access to this page.</p>
      </div>
    );
  }

  const roleCountMap = ['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor', 'account_manager'].map(r => ({
    role: r,
    label: r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: users.filter(u => u.role === r).length,
  }));

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your application preferences and team</p>
      </div>

      {/* Company Info */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Building2 className="w-5 h-5 text-accent" />
            Company Information
          </CardTitle>
          <CardDescription>Basic details about your interior design firm</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input defaultValue="Modern Art Interior" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Admin Name</Label>
              <Input defaultValue={profile?.name || ''} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Admin Email</Label>
              <Input defaultValue={profile?.email || ''} disabled className="bg-muted/50" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" />
            To update your profile information, please contact support.
          </p>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Users className="w-5 h-5 text-accent" />
              Team Management
            </CardTitle>
            <CardDescription>View and manage all staff accounts</CardDescription>
          </div>
          <Button onClick={() => setShowUserManagement(true)} variant="hero" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {roleCountMap.map(({ role: r, label, count }) => (
              <div key={r} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-sm text-foreground">{label}</span>
                <Badge variant="secondary" className="ml-2">{count}</Badge>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">
            Total staff: <span className="font-semibold text-foreground">{users.length}</span> members
          </p>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Shield className="w-5 h-5 text-accent" />
            Access Control
          </CardTitle>
          <CardDescription>Role-based permissions overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { role: 'Admin', access: 'Full system access – projects, team, accounts, settings' },
              { role: 'Design Head', access: 'Design tasks, assign designers, approvals, issues' },
              { role: 'Designer', access: 'View projects, upload design files, design tasks' },
              { role: 'Execution Manager', access: 'Execution tasks, assign supervisors, approvals, issues' },
              { role: 'Site Supervisor', access: 'Execution tasks on assigned projects' },
              { role: 'Account Manager', access: 'Accounts & payment tracking across all projects' },
            ].map(({ role: r, access }) => (
              <div key={r} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                <Badge variant="outline" className="shrink-0 mt-0.5">{r}</Badge>
                <p className="text-sm text-muted-foreground">{access}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Bell className="w-5 h-5 text-accent" />
            Notifications
          </CardTitle>
          <CardDescription>System notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All users receive real-time in-app notifications for project updates, approvals, and task assignments. Notifications are visible via the bell icon in the sidebar.
          </p>
        </CardContent>
      </Card>

      <UserManagementDialog open={showUserManagement} onOpenChange={setShowUserManagement} />
    </div>
  );
};

export default Settings;
