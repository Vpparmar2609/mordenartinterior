import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Progress } from '@/components/ui/progress';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

export const ExecutionManagerDashboard: React.FC = () => {
  const stats = [
    {
      title: 'My Projects',
      value: '4',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Site Supervisors',
      value: '6',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Tasks Completed',
      value: '42',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Open Issues',
      value: '3',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  // Mock project execution data
  const projectProgress = [
    { name: 'Kumar Residence', progress: 73, tasks: '11/15', status: 'Work In Progress' },
    { name: 'Sharma Villa', progress: 47, tasks: '7/15', status: 'Execution Started' },
    { name: 'Patel Apartment', progress: 93, tasks: '14/15', status: 'Finishing' },
    { name: 'Singh Home', progress: 20, tasks: '3/15', status: 'Execution Started' },
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

      {/* Execution Progress */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Execution Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectProgress.map((project) => (
            <div key={project.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{project.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {project.status}
                  </span>
                  <span className="text-muted-foreground">{project.tasks}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={project.progress} className="flex-1" />
                <span className="text-sm font-medium text-primary">{project.progress}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Issues and Daily Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Issue Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Issues from site supervisors will appear here...</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Daily Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Recent daily reports from supervisors...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
