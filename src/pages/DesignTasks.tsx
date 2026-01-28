import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Upload, 
  CheckCircle2, 
  Clock,
  FileImage,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllDesignTasks, useDesignTasks } from '@/hooks/useProjectTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';

const DesignTasks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const { user, role } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks: allTasks, isLoading: tasksLoading, updateTask } = useAllDesignTasks();

  // Group tasks by project
  const projectsWithTasks = useMemo(() => {
    const grouped = allTasks.reduce((acc, task) => {
      const projectId = task.project_id;
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(task);
      return acc;
    }, {} as Record<string, typeof allTasks>);

    return Object.entries(grouped).map(([projectId, tasks]) => {
      const project = projects.find(p => p.id === projectId);
      const completed = tasks.filter(t => t.status === 'completed').length;
      return {
        id: projectId,
        clientName: project?.client_name || 'Unknown',
        progress: Math.round((completed / 15) * 100),
        tasks: tasks.sort((a, b) => a.order_index - b.order_index),
      };
    });
  }, [allTasks, projects]);

  // Filter based on search
  const filteredProjects = projectsWithTasks.filter(p =>
    p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        return <Badge className="bg-success/20 text-success border-0">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning/20 text-warning border-0">In Progress</Badge>;
      case 'revision':
        return <Badge className="bg-destructive/20 text-destructive border-0">Revision</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">Pending</Badge>;
    }
  };

  const handleToggleStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateTask.mutate({ id: taskId, status: newStatus as any });
  };

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Design Tasks</h1>
          <p className="text-muted-foreground mt-1">Track and manage design deliverables</p>
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
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-xl">
          <p className="text-muted-foreground">No design tasks found. Projects need to be assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project, index) => (
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
                        {project.tasks.filter(t => t.status === 'completed').length}/15 tasks completed
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
                            task.status === 'completed' && 'text-muted-foreground line-through'
                          )}>
                            {taskIndex + 1}. {task.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(task.status)}
                          <Button 
                            size="sm" 
                            variant={task.status === 'completed' ? 'ghost' : 'outline'}
                            className="h-8"
                            onClick={() => handleToggleStatus(task.id, task.status)}
                            disabled={updateTask.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {task.status === 'completed' ? 'Undo' : 'Complete'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignTasks;
