import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ClipboardList,
  Camera,
  Plus
} from 'lucide-react';

export const SiteSupervisorDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Assigned Projects',
      value: '2',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Tasks Completed',
      value: '18',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Pending Tasks',
      value: '12',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Open Issues',
      value: '2',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  // Mock project data
  const myProjects = [
    { name: 'Kumar Residence', progress: 73, nextTask: 'TV unit installations' },
    { name: 'Patel Apartment', progress: 93, nextTask: 'Final QC check' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-gradient-warm hover:opacity-90">
          <ClipboardList className="w-4 h-4 mr-2" />
          Submit Daily Report
        </Button>
        <Button variant="outline">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
        <Button variant="outline">
          <Camera className="w-4 h-4 mr-2" />
          Upload Photos
        </Button>
      </div>

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

      {/* My Projects */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">My Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {myProjects.map((project) => (
            <div key={project.name} className="space-y-3 p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{project.name}</h3>
                <span className="text-sm font-medium text-primary">{project.progress}%</span>
              </div>
              <Progress value={project.progress} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next: {project.nextTask}</span>
                <Button size="sm" variant="ghost" className="h-8">
                  <Plus className="w-3 h-3 mr-1" />
                  Update
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Today's Report and Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Today's Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              You haven't submitted today's report yet.
            </p>
            <Button className="w-full">Submit Daily Report</Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              My Open Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Your reported issues will appear here...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
