import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  Palette,
  AlertCircle
} from 'lucide-react';

export const DesignHeadDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Assigned Projects',
      value: '12',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Design In Progress',
      value: '6',
      icon: <Palette className="w-5 h-5" />,
    },
    {
      title: 'Pending Approval',
      value: '3',
      icon: <Clock className="w-5 h-5" />,
      trend: { value: 2, isPositive: false },
    },
    {
      title: 'Approved',
      value: '3',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Team Designers',
      value: '5',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Needs Revision',
      value: '2',
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
          <p className="text-muted-foreground text-sm">Projects awaiting design approval will appear here...</p>
        </CardContent>
      </Card>

      {/* Projects and Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Assigned projects will be loaded here...</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Design Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Designer list and workload will be shown here...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
