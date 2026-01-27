import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Upload,
  FileImage
} from 'lucide-react';

export const DesignerDashboard: React.FC = () => {
  const { projects, isLoading } = useProjects();

  const myProjects = projects.filter(p => 
    ['design_in_progress', 'design_approval_pending'].includes(p.status)
  );

  const stats = [
    {
      title: 'My Projects',
      value: isLoading ? '...' : myProjects.length.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Tasks Completed',
      value: '0',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Pending Tasks',
      value: '0',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Files Uploaded',
      value: '0',
      icon: <Upload className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      {/* My Projects with Progress */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">My Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {myProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects assigned</p>
          ) : (
            myProjects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{project.client_name}</span>
                  <span className="text-muted-foreground">{project.progress}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress} className="flex-1" />
                  <span className="text-sm font-medium text-primary">{project.progress}%</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Current Tasks and Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm text-center py-4">No pending tasks</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm text-center py-4">No recent uploads</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
