import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Progress } from '@/components/ui/progress';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Upload,
  FileImage
} from 'lucide-react';

export const DesignerDashboard: React.FC = () => {
  const stats = [
    {
      title: 'My Projects',
      value: '4',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Tasks Completed',
      value: '32',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Pending Tasks',
      value: '18',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Files Uploaded',
      value: '56',
      icon: <Upload className="w-5 h-5" />,
    },
  ];

  // Mock project progress data
  const projectProgress = [
    { name: 'Kumar Residence', progress: 80, tasks: '12/15' },
    { name: 'Sharma Villa', progress: 53, tasks: '8/15' },
    { name: 'Patel Apartment', progress: 27, tasks: '4/15' },
    { name: 'Singh Home', progress: 13, tasks: '2/15' },
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
          {projectProgress.map((project) => (
            <div key={project.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{project.name}</span>
                <span className="text-muted-foreground">{project.tasks} tasks</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={project.progress} className="flex-1" />
                <span className="text-sm font-medium text-primary">{project.progress}%</span>
              </div>
            </div>
          ))}
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
            <p className="text-muted-foreground text-sm">Design task checklist will appear here...</p>
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
            <p className="text-muted-foreground text-sm">Recently uploaded design files will appear here...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
