import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  CheckCircle2, 
  Clock,
  Camera,
  ChevronDown,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock projects with execution tasks
const mockProjects = [
  {
    id: '1',
    clientName: 'Kumar Residence',
    progress: 73,
    supervisor: 'Rajesh Nair',
    tasks: [
      { id: 't1', name: 'POP started', status: 'completed', date: '2026-01-10', photos: 3 },
      { id: 't2', name: 'POP completed', status: 'completed', date: '2026-01-12', photos: 4 },
      { id: 't3', name: 'Electrical wiring done', status: 'completed', date: '2026-01-14', photos: 2 },
      { id: 't4', name: 'Plumbing points checked', status: 'completed', date: '2026-01-15', photos: 2 },
      { id: 't5', name: 'Kitchen bases installed', status: 'completed', date: '2026-01-17', photos: 3 },
      { id: 't6', name: 'Kitchen shutters installed', status: 'completed', date: '2026-01-19', photos: 3 },
      { id: 't7', name: 'Wardrobe structures ready', status: 'completed', date: '2026-01-20', photos: 2 },
      { id: 't8', name: 'Wardrobe shutters & handles', status: 'completed', date: '2026-01-21', photos: 2 },
      { id: 't9', name: 'TV unit installations', status: 'completed', date: '2026-01-22', photos: 2 },
      { id: 't10', name: 'Painting started', status: 'completed', date: '2026-01-23', photos: 1 },
      { id: 't11', name: 'Painting completed', status: 'in_progress', date: null, photos: 0 },
      { id: 't12', name: 'Lights installation', status: 'pending', date: null, photos: 0 },
      { id: 't13', name: 'Final cleaning', status: 'pending', date: null, photos: 0 },
      { id: 't14', name: 'QC checks', status: 'pending', date: null, photos: 0 },
      { id: 't15', name: 'Handover ready', status: 'pending', date: null, photos: 0 },
    ],
  },
  {
    id: '2',
    clientName: 'Patel Apartment',
    progress: 93,
    supervisor: 'Deepak Verma',
    tasks: [
      { id: 't1', name: 'POP started', status: 'completed', date: '2026-01-05', photos: 2 },
      { id: 't2', name: 'POP completed', status: 'completed', date: '2026-01-07', photos: 3 },
      { id: 't3', name: 'Electrical wiring done', status: 'completed', date: '2026-01-09', photos: 2 },
      { id: 't4', name: 'Plumbing points checked', status: 'completed', date: '2026-01-10', photos: 1 },
      { id: 't5', name: 'Kitchen bases installed', status: 'completed', date: '2026-01-12', photos: 2 },
      { id: 't6', name: 'Kitchen shutters installed', status: 'completed', date: '2026-01-14', photos: 2 },
      { id: 't7', name: 'Wardrobe structures ready', status: 'completed', date: '2026-01-15', photos: 2 },
      { id: 't8', name: 'Wardrobe shutters & handles', status: 'completed', date: '2026-01-16', photos: 2 },
      { id: 't9', name: 'TV unit installations', status: 'completed', date: '2026-01-17', photos: 2 },
      { id: 't10', name: 'Painting started', status: 'completed', date: '2026-01-18', photos: 1 },
      { id: 't11', name: 'Painting completed', status: 'completed', date: '2026-01-20', photos: 2 },
      { id: 't12', name: 'Lights installation', status: 'completed', date: '2026-01-21', photos: 2 },
      { id: 't13', name: 'Final cleaning', status: 'completed', date: '2026-01-22', photos: 1 },
      { id: 't14', name: 'QC checks', status: 'in_progress', date: null, photos: 0 },
      { id: 't15', name: 'Handover ready', status: 'pending', date: null, photos: 0 },
    ],
  },
];

const ExecutionTasks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<string[]>(['1']);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-0">Done</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning/20 text-warning border-0">In Progress</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Execution Tasks</h1>
          <p className="text-muted-foreground mt-1">Track site work progress and completion</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects with Tasks */}
      <div className="space-y-4">
        {mockProjects.map((project, index) => (
          <Card 
            key={project.id} 
            className="glass-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedProjects.includes(project.id) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{project.clientName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supervisor: {project.supervisor} • {project.tasks.filter(t => t.status === 'completed').length}/15 tasks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-semibold text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="w-32" />
                </div>
              </div>
            </CardHeader>
            
            {expandedProjects.includes(project.id) && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {project.tasks.map((task, taskIndex) => (
                    <div 
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        task.status === 'completed' ? 'bg-success/5' : 
                        task.status === 'in_progress' ? 'bg-warning/5' : 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <span className={cn(
                          "font-medium",
                          task.status === 'completed' && 'text-muted-foreground'
                        )}>
                          {taskIndex + 1}. {task.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.date && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                        {task.photos > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Camera className="w-4 h-4" />
                            {task.photos}
                          </div>
                        )}
                        {getStatusBadge(task.status)}
                        {task.status !== 'completed' && (
                          <Button size="sm" variant="outline" className="h-8">
                            Mark Done
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExecutionTasks;
