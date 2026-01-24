import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TaskProgress } from '@/components/dashboard/TaskProgress';
import { Project } from '@/types/project';
import { roleLabels } from '@/types/auth';
import {
  FolderKanban,
  Palette,
  HardHat,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react';

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    clientName: 'Sharma Residence',
    clientPhone: '+91 98765 43210',
    clientEmail: 'sharma@email.com',
    location: 'Indiranagar, Bangalore',
    flatSize: '1800 sq.ft',
    bhk: '3',
    budgetRange: '₹25-30 Lakhs',
    startDate: new Date('2024-01-15'),
    deadline: new Date('2024-04-15'),
    status: 'work_in_progress',
    progress: 65,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    clientName: 'Gupta Villa',
    clientPhone: '+91 87654 32109',
    clientEmail: 'gupta@email.com',
    location: 'Koramangala, Bangalore',
    flatSize: '2500 sq.ft',
    bhk: '4',
    budgetRange: '₹45-50 Lakhs',
    startDate: new Date('2024-02-01'),
    deadline: new Date('2024-05-01'),
    status: 'design_in_progress',
    progress: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    clientName: 'Kumar Apartment',
    clientPhone: '+91 76543 21098',
    clientEmail: 'kumar@email.com',
    location: 'Whitefield, Bangalore',
    flatSize: '1200 sq.ft',
    bhk: '2',
    budgetRange: '₹15-18 Lakhs',
    startDate: new Date('2024-02-10'),
    deadline: new Date('2024-05-10'),
    status: 'design_approved',
    progress: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    clientName: 'Patel House',
    clientPhone: '+91 65432 10987',
    clientEmail: 'patel@email.com',
    location: 'HSR Layout, Bangalore',
    flatSize: '2000 sq.ft',
    bhk: '3',
    budgetRange: '₹30-35 Lakhs',
    startDate: new Date('2024-01-25'),
    deadline: new Date('2024-04-25'),
    status: 'finishing',
    progress: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatsForRole = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { title: 'Total Projects', value: 24, icon: <FolderKanban className="w-6 h-6" />, trend: { value: 12, isPositive: true } },
          { title: 'Active Designs', value: 8, icon: <Palette className="w-6 h-6" /> },
          { title: 'In Execution', value: 12, icon: <HardHat className="w-6 h-6" /> },
          { title: 'Completed', value: 4, icon: <CheckCircle2 className="w-6 h-6" /> },
        ];
      case 'design_head':
        return [
          { title: 'Design Projects', value: 8, icon: <Palette className="w-6 h-6" /> },
          { title: 'Pending Approvals', value: 3, icon: <Clock className="w-6 h-6" /> },
          { title: 'Team Members', value: 5, icon: <Users className="w-6 h-6" /> },
          { title: 'Completed This Month', value: 6, icon: <CheckCircle2 className="w-6 h-6" /> },
        ];
      case 'execution_head':
        return [
          { title: 'Active Sites', value: 12, icon: <HardHat className="w-6 h-6" /> },
          { title: 'Open Issues', value: 5, icon: <AlertTriangle className="w-6 h-6" /> },
          { title: 'Managers', value: 5, icon: <Users className="w-6 h-6" /> },
          { title: 'On Track', value: 9, icon: <TrendingUp className="w-6 h-6" /> },
        ];
      case 'client':
        return [
          { title: 'My Projects', value: 2, icon: <FolderKanban className="w-6 h-6" /> },
          { title: 'Overall Progress', value: '72%', icon: <TrendingUp className="w-6 h-6" /> },
          { title: 'Pending Approvals', value: 1, icon: <Clock className="w-6 h-6" /> },
          { title: 'Days to Deadline', value: 45, icon: <CheckCircle2 className="w-6 h-6" /> },
        ];
      default:
        return [
          { title: 'My Tasks', value: 8, icon: <FolderKanban className="w-6 h-6" /> },
          { title: 'Pending', value: 3, icon: <Clock className="w-6 h-6" /> },
          { title: 'Completed Today', value: 2, icon: <CheckCircle2 className="w-6 h-6" /> },
          { title: 'Issues', value: 1, icon: <AlertTriangle className="w-6 h-6" /> },
        ];
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {roleLabels[user?.role || 'admin']} Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('en-IN', { 
            weekday: 'long',
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            {...stat}
            className={`animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Active Projects
            </h2>
            <a href="/projects" className="text-sm text-primary hover:underline">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProjects.slice(0, 4).map((project, index) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TaskProgress />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
