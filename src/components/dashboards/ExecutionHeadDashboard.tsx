import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  HardHat,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export const ExecutionHeadDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Active Projects',
      value: '10',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'In Execution',
      value: '7',
      icon: <HardHat className="w-5 h-5" />,
    },
    {
      title: 'Near Completion',
      value: '2',
      icon: <TrendingUp className="w-5 h-5" />,
      trend: { value: 1, isPositive: true },
    },
    {
      title: 'Completed',
      value: '5',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Execution Managers',
      value: '3',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Site Supervisors',
      value: '8',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Open Issues',
      value: '5',
      icon: <AlertTriangle className="w-5 h-5" />,
      trend: { value: 2, isPositive: false },
    },
    {
      title: 'Pending Tasks',
      value: '24',
      icon: <Clock className="w-5 h-5" />,
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
            trend={stat.trend}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      {/* Project Timeline and Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Project timeline with status tracking will appear here...</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Issue reports from supervisors will appear here...</p>
          </CardContent>
        </Card>
      </div>

      {/* Team and Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">Execution Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Execution task completion by project will appear here...</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Execution managers and supervisors list...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
