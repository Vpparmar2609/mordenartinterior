import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Palette,
  HardHat
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  // TODO: Replace with real data from Supabase
  const stats = [
    {
      title: 'Total Projects',
      value: '24',
      icon: <FolderKanban className="w-5 h-5" />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Active Projects',
      value: '18',
      icon: <Clock className="w-5 h-5" />,
      trend: { value: 5, isPositive: true },
    },
    {
      title: 'Design Pending',
      value: '4',
      icon: <Palette className="w-5 h-5" />,
    },
    {
      title: 'In Execution',
      value: '8',
      icon: <HardHat className="w-5 h-5" />,
    },
    {
      title: 'Near Completion',
      value: '3',
      icon: <TrendingUp className="w-5 h-5" />,
      trend: { value: 2, isPositive: true },
    },
    {
      title: 'Open Issues',
      value: '7',
      icon: <AlertTriangle className="w-5 h-5" />,
      trend: { value: 3, isPositive: false },
    },
    {
      title: 'Completed',
      value: '6',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Total Users',
      value: '15',
      icon: <Users className="w-5 h-5" />,
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Project list will be loaded here...</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Approval queue will be loaded here...</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Activity feed will be loaded here...</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Issue tracker will be loaded here...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
