import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useProjects, useProjectStats } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useIssues } from '@/hooks/useIssues';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { UserManagementDialog } from '@/components/users/UserManagementDialog';
import { ProjectList } from '@/components/projects/ProjectList';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Palette,
  HardHat,
  Plus,
  UserPlus
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const { stats, isLoading: statsLoading } = useProjectStats();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { users, isLoading: usersLoading } = useUsers();
  const { issues, isLoading: issuesLoading } = useIssues();

  const openIssues = issues.filter(i => i.status === 'open').length;

  const statCards = [
    {
      title: 'Total Projects',
      value: statsLoading ? '...' : stats.total.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
      trend: stats.total > 0 ? { value: 12, isPositive: true } : undefined,
    },
    {
      title: 'Active Projects',
      value: statsLoading ? '...' : stats.active.toString(),
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Design Pending',
      value: statsLoading ? '...' : stats.designPending.toString(),
      icon: <Palette className="w-5 h-5" />,
    },
    {
      title: 'In Execution',
      value: statsLoading ? '...' : stats.inExecution.toString(),
      icon: <HardHat className="w-5 h-5" />,
    },
    {
      title: 'Near Completion',
      value: statsLoading ? '...' : stats.nearCompletion.toString(),
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: 'Open Issues',
      value: issuesLoading ? '...' : openIssues.toString(),
      icon: <AlertTriangle className="w-5 h-5" />,
      trend: openIssues > 0 ? { value: openIssues, isPositive: false } : undefined,
    },
    {
      title: 'Completed',
      value: statsLoading ? '...' : stats.completed.toString(),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Total Users',
      value: usersLoading ? '...' : users.length.toString(),
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      {/* Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateProject(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <p className="text-muted-foreground text-sm">Loading projects...</p>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">No projects yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreateProject(true)}>
                  Create First Project
                </Button>
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
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowUserManagement(true)}>
                  Invite Team
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {['admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor', 'client'].map(role => {
                  const count = users.filter(u => u.role === role).length;
                  if (count === 0) return null;
                  return (
                    <div key={role} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open Issues */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Active Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {issuesLoading ? (
            <p className="text-muted-foreground text-sm">Loading issues...</p>
          ) : issues.filter(i => i.status !== 'resolved').length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No open issues</p>
          ) : (
            <div className="space-y-2">
              {issues.filter(i => i.status !== 'resolved').slice(0, 5).map(issue => (
                <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{issue.issue_type}</p>
                    <p className="text-xs text-muted-foreground truncate">{issue.project?.client_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    issue.severity === 'high' ? 'bg-destructive/20 text-destructive' :
                    issue.severity === 'medium' ? 'bg-warning/20 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateProjectDialog open={showCreateProject} onOpenChange={setShowCreateProject} />
      <UserManagementDialog open={showUserManagement} onOpenChange={setShowUserManagement} />
    </div>
  );
};
