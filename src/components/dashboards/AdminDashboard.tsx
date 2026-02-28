import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useProjects, useProjectStats } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { UserManagementDialog } from '@/components/users/UserManagementDialog';
import { ProjectList } from '@/components/projects/ProjectList';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  Palette,
  HardHat,
  Plus,
  UserPlus,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { role } = useAuth();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const { stats, isLoading: statsLoading } = useProjectStats();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { users, isLoading: usersLoading } = useUsers();

  const isAdmin = role === 'admin';

  const statCards = [
    {
      title: 'Total Projects',
      value: statsLoading ? '...' : stats.total.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Active Projects',
      value: statsLoading ? '...' : stats.active.toString(),
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'In Design Phase',
      value: statsLoading ? '...' : stats.designPending.toString(),
      icon: <Palette className="w-5 h-5" />,
    },
    {
      title: 'In Execution',
      value: statsLoading ? '...' : stats.inExecution.toString(),
      icon: <HardHat className="w-5 h-5" />,
    },
    {
      title: 'Completed',
      value: statsLoading ? '...' : stats.completed.toString(),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Team Members',
      value: usersLoading ? '...' : users.length.toString(),
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowCreateProject(true)} variant="hero" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
          <Button onClick={() => setShowUserManagement(true)} variant="outline" size="lg">
            <UserPlus className="w-5 h-5 mr-2" />
            Manage Users
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Recent Projects</CardTitle>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => setShowCreateProject(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <p className="text-muted-foreground text-sm">Loading projects...</p>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">No projects yet</p>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreateProject(true)}>
                    Create First Project
                  </Button>
                )}
              </div>
            ) : (
              <ProjectList projects={projects.slice(0, 5)} compact />
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <p className="text-muted-foreground text-sm">Loading users...</p>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">No team members</p>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowUserManagement(true)}>
                    Invite Team
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor', 'account_manager'].map(roleKey => {
                  const count = users.filter(u => u.role === roleKey).length;
                  if (count === 0) return null;
                  return (
                    <div key={roleKey} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm capitalize">{roleKey.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateProjectDialog open={showCreateProject} onOpenChange={setShowCreateProject} />
      <UserManagementDialog open={showUserManagement} onOpenChange={setShowUserManagement} />
    </div>
  );
};
