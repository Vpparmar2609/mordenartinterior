import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Project, ProjectStatus, statusLabels, statusColors } from '@/types/project';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  {
    id: '5',
    clientName: 'Singh Residence',
    clientPhone: '+91 54321 09876',
    clientEmail: 'singh@email.com',
    location: 'Jayanagar, Bangalore',
    flatSize: '1600 sq.ft',
    bhk: '3',
    budgetRange: '₹22-25 Lakhs',
    startDate: new Date('2024-03-01'),
    deadline: new Date('2024-06-01'),
    status: 'lead',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    clientName: 'Reddy Villa',
    clientPhone: '+91 43210 98765',
    clientEmail: 'reddy@email.com',
    location: 'Electronic City, Bangalore',
    flatSize: '3000 sq.ft',
    bhk: '5',
    budgetRange: '₹55-60 Lakhs',
    startDate: new Date('2024-01-10'),
    deadline: new Date('2024-04-10'),
    status: 'completed',
    progress: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const statusFilters: ProjectStatus[] = [
  'lead',
  'design_in_progress',
  'design_approval_pending',
  'design_approved',
  'execution_started',
  'work_in_progress',
  'finishing',
  'handover_pending',
  'snag_fix',
  'completed',
];

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const canCreateProject = user?.role === 'admin';

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch = project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your interior design projects
          </p>
        </div>
        {canCreateProject && (
          <Button variant="hero" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              All
            </Button>
            {statusFilters.slice(0, 5).map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  selectedStatus === status && statusColors[status].bg,
                  selectedStatus === status && statusColors[status].text
                )}
              >
                {statusLabels[status]}
              </Button>
            ))}
            <Button variant="ghost" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              More
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', count: mockProjects.length, color: 'bg-muted' },
          { label: 'In Design', count: mockProjects.filter(p => p.status.includes('design')).length, color: 'bg-accent/20' },
          { label: 'In Execution', count: mockProjects.filter(p => ['execution_started', 'work_in_progress', 'finishing'].includes(p.status)).length, color: 'bg-primary/20' },
          { label: 'Completed', count: mockProjects.filter(p => p.status === 'completed').length, color: 'bg-success/20' },
          { label: 'New Leads', count: mockProjects.filter(p => p.status === 'lead').length, color: 'bg-warning/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('p-4 rounded-xl', stat.color)}>
            <p className="text-2xl font-display font-semibold text-foreground">{stat.count}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      )}>
        {filteredProjects.map((project, index) => (
          <ProjectCard 
            key={project.id} 
            project={project}
            style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Projects;
