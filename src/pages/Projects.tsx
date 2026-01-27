import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectList } from '@/components/projects/ProjectList';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { statusLabels, statusColors, ProjectStatus } from '@/types/project';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { role } = useAuth();
  const { projects, isLoading } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const canCreateProject = role === 'admin';

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    inDesign: projects.filter(p => p.status.includes('design')).length,
    inExecution: projects.filter(p => ['execution_started', 'work_in_progress', 'finishing'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'completed').length,
    leads: projects.filter(p => p.status === 'lead').length,
  };

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
          <Button variant="hero" size="lg" onClick={() => setShowCreateDialog(true)}>
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
          { label: 'Total', count: stats.total, color: 'bg-muted' },
          { label: 'In Design', count: stats.inDesign, color: 'bg-accent/20' },
          { label: 'In Execution', count: stats.inExecution, color: 'bg-primary/20' },
          { label: 'Completed', count: stats.completed, color: 'bg-success/20' },
          { label: 'New Leads', count: stats.leads, color: 'bg-warning/20' },
        ].map((stat) => (
          <div key={stat.label} className={cn('p-4 rounded-xl', stat.color)}>
            <p className="text-2xl font-display font-semibold text-foreground">{stat.count}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <p className="text-muted-foreground">No projects found matching your criteria.</p>
          {canCreateProject && (
            <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          <ProjectList projects={filteredProjects} compact={viewMode === 'list'} />
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
};

export default Projects;
