import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  CheckCircle2, 
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllDesignTasks } from '@/hooks/useProjectTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { TaskFileUpload } from '@/components/tasks/TaskFileUpload';
import { FileApprovalSection } from '@/components/approvals/FileApprovalSection';
import { differenceInDays } from 'date-fns';
import { DesignTimelineEditor } from '@/components/tasks/DesignTimelineEditor';

const getDesignDaysLeft = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return null;
  const deadline = new Date(endDate);
  const today = new Date();
  return differenceInDays(deadline, today);
};

const getTotalDesignDays = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return null;
  return differenceInDays(new Date(endDate), new Date(startDate));
};

const getTimelineDisplay = (daysLeft: number | null) => {
  if (daysLeft === null) return null;
  
  if (daysLeft < 0) {
    return { 
      text: `${Math.abs(daysLeft)}d overdue`, 
      className: 'text-destructive bg-destructive/10',
      progressClass: '[&>div]:bg-destructive'
    };
  } else if (daysLeft === 0) {
    return { 
      text: 'Due today', 
      className: 'text-warning bg-warning/10',
      progressClass: '[&>div]:bg-warning'
    };
  } else if (daysLeft <= 5) {
    return { 
      text: `${daysLeft}d left`, 
      className: 'text-destructive bg-destructive/10',
      progressClass: '[&>div]:bg-destructive'
    };
  } else if (daysLeft <= 10) {
    return { 
      text: `${daysLeft}d left`, 
      className: 'text-warning bg-warning/10',
      progressClass: '[&>div]:bg-warning'
    };
  } else {
    return { 
      text: `${daysLeft}d left`, 
      className: 'text-success bg-success/10',
      progressClass: '[&>div]:bg-success'
    };
  }
};

const DesignTasks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const { user, role } = useAuth();
  const { isAdmin, isDesignHead } = useUserRole();
  const { projects, isLoading: projectsLoading, updateProject } = useProjects();
  const { tasks: allTasks, isLoading: tasksLoading, updateTask } = useAllDesignTasks();
  const canApproveFiles = isAdmin || isDesignHead;
  const canEditTimeline = isAdmin || isDesignHead;

  const handleSaveTimeline = (projectId: string, startDate: string, endDate: string) => {
    updateProject.mutate({ id: projectId, design_start_date: startDate, design_end_date: endDate } as any);
  };

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
      const totalTasks = 36; // 36 design tasks per project
      const designStartDate = (project as any)?.design_start_date || null;
      const designEndDate = (project as any)?.design_end_date || null;
      const daysLeft = getDesignDaysLeft(designStartDate, designEndDate);
      const totalDays = getTotalDesignDays(designStartDate, designEndDate);
      
      const progressPct = Math.round((completed / totalTasks) * 100);
      const allDone = completed === totalTasks;

      return {
        id: projectId,
        clientName: project?.client_name || 'Unknown',
        progress: progressPct,
        tasks: tasks.sort((a, b) => a.order_index - b.order_index),
        totalTasks,
        designStartDate,
        designEndDate,
        // Freeze timeline when all tasks are completed
        daysLeft: allDone ? null : daysLeft,
        allDone,
        timeProgress: daysLeft !== null && totalDays !== null && !allDone ? Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100)) : 0,
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

      {canApproveFiles ? (
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="approvals">File Approvals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
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
                {filteredProjects.map((project, index) => renderProjectCard(project, index))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approvals">
            <FileApprovalSection type="design" />
          </TabsContent>
        </Tabs>
      ) : (
        <>
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
              {filteredProjects.map((project, index) => renderProjectCard(project, index))}
            </div>
          )}
        </>
      )}
    </div>
  );

  function renderProjectCard(project: typeof filteredProjects[0], index: number) {
    return (
      <Card 
        key={project.id} 
        className="glass-card animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader 
          className="cursor-pointer select-none active:bg-muted/30 transition-colors touch-manipulation"
          onClick={() => toggleProject(project.id)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              {expandedProjects.includes(project.id) ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">{project.clientName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {project.tasks.filter(t => t.status === 'completed').length}/{project.totalTasks} tasks completed
                </p>
                {canEditTimeline && (
                  <div className="mt-1">
                    <DesignTimelineEditor
                      projectId={project.id}
                      currentStartDate={project.designStartDate}
                      currentEndDate={project.designEndDate}
                      onSave={handleSaveTimeline}
                      isSaving={updateProject.isPending}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Timeline indicator */}
              {project.allDone ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-success/10 text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  Design Complete
                </div>
              ) : project.daysLeft !== null ? (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                    getTimelineDisplay(project.daysLeft)?.className
                  )}>
                    {project.daysLeft <= 5 ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Timer className="w-3 h-3" />
                    )}
                    {getTimelineDisplay(project.daysLeft)?.text}
                  </div>
                  <Progress 
                    value={project.timeProgress} 
                    className={cn("w-12 h-1.5", getTimelineDisplay(project.daysLeft)?.progressClass)}
                  />
                </div>
              ) : null}
              {/* Task progress */}
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-primary">{project.progress}%</span>
                <Progress value={project.progress} className="w-16" />
              </div>
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
                    "flex flex-col gap-2 p-3 rounded-lg",
                    task.status === 'completed' ? 'bg-success/5' : 
                    task.status === 'in_progress' ? 'bg-warning/5' : 'bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getStatusIcon(task.status)}</div>
                    <span className={cn(
                      "font-medium text-sm flex-1",
                      task.status === 'completed' && 'text-muted-foreground line-through'
                    )}>
                      {taskIndex + 1}. {task.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pl-7">
                    <TaskFileUpload 
                      taskId={task.id} 
                      taskType="design" 
                      compact 
                    />
                    {getStatusBadge(task.status)}
                    <Button 
                      size="sm" 
                      variant={task.status === 'completed' ? 'ghost' : 'outline'}
                      className="h-8 text-xs"
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
    );
  }
};

export default DesignTasks;
