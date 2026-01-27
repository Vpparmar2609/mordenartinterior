import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { ProjectList } from '@/components/projects/ProjectList';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  Palette,
  AlertCircle
} from 'lucide-react';

export const DesignHeadDashboard: React.FC = () => {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { getUsersByRole } = useUsers();

  const designProjects = projects.filter(p => 
    ['design_in_progress', 'design_approval_pending'].includes(p.status)
  );
  const approvedProjects = projects.filter(p => p.status === 'design_approved');
  const pendingApproval = projects.filter(p => p.status === 'design_approval_pending');
  const designers = getUsersByRole('designer');

  const stats = [
    {
      title: 'Assigned Projects',
      value: projectsLoading ? '...' : designProjects.length.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Design In Progress',
      value: projectsLoading ? '...' : projects.filter(p => p.status === 'design_in_progress').length.toString(),
      icon: <Palette className="w-5 h-5" />,
    },
    {
      title: 'Pending Approval',
      value: projectsLoading ? '...' : pendingApproval.length.toString(),
      icon: <Clock className="w-5 h-5" />,
      trend: pendingApproval.length > 0 ? { value: pendingApproval.length, isPositive: false } : undefined,
    },
    {
      title: 'Approved',
      value: projectsLoading ? '...' : approvedProjects.length.toString(),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Team Designers',
      value: designers.length.toString(),
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Needs Revision',
      value: '0',
      icon: <AlertCircle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
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

      {/* Design Approval Queue */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Design Approval Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingApproval.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects pending approval</p>
          ) : (
            <ProjectList projects={pendingApproval} compact />
          )}
        </CardContent>
      </Card>

      {/* Projects and Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {designProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No active design projects</p>
            ) : (
              <ProjectList projects={designProjects.slice(0, 5)} compact />
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Design Team</CardTitle>
          </CardHeader>
          <CardContent>
            {designers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No designers assigned</p>
            ) : (
              <div className="space-y-2">
                {designers.map(designer => (
                  <div key={designer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{designer.name}</p>
                      <p className="text-xs text-muted-foreground">{designer.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
