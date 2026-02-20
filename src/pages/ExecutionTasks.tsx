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
  Calendar,
  Loader2,
  Timer,
  AlertTriangle,
  Zap,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllExecutionTasks } from '@/hooks/useProjectTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { TaskFileUpload } from '@/components/tasks/TaskFileUpload';
import { FileApprovalSection } from '@/components/approvals/FileApprovalSection';
import { getProjectStagesInfo, StageInfo, EXECUTION_STAGES, getStageForTask } from '@/utils/executionStages';
import { CreateUrgentTaskDialog } from '@/components/tasks/CreateUrgentTaskDialog';
import { UrgentTasksList } from '@/components/tasks/UrgentTasksList';
import { useMyUrgentTasks } from '@/hooks/useUrgentTasks';

const ExecutionTasks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [urgentTaskDialog, setUrgentTaskDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: '',
    projectName: '',
  });
  const { user, role } = useAuth();
  const { isAdmin, isExecutionManager } = useUserRole();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks: allTasks, isLoading: tasksLoading, updateTask } = useAllExecutionTasks();
  const { tasks: myUrgentTasks } = useMyUrgentTasks();
  const canApproveFiles = isAdmin || isExecutionManager;

  // Group tasks by project with stage info
  const projectsWithStages = useMemo(() => {
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
      const sortedTasks = tasks.sort((a, b) => a.order_index - b.order_index);
      const stagesInfo = getProjectStagesInfo(sortedTasks as any);
      const completed = tasks.filter(t => t.status === 'completed').length;
      const totalTasks = 35;
      
      return {
        id: projectId,
        clientName: project?.client_name || 'Unknown',
        progress: Math.round((completed / totalTasks) * 100),
        tasks: sortedTasks,
        stagesInfo,
        totalTasks,
      };
    });
  }, [allTasks, projects]);

  // Filter based on search
  const filteredProjects = projectsWithStages.filter(p =>
    p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleStage = (stageKey: string) => {
    setExpandedStages(prev => 
      prev.includes(stageKey) 
        ? prev.filter(id => id !== stageKey)
        : [...prev, stageKey]
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

  const getStageCountdownBadge = (stageInfo: StageInfo) => {
    const { countdown, stage } = stageInfo;
    
    if (countdown.status === 'completed') {
      return (
        <Badge className="bg-success/20 text-success border-0 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    }

    if (countdown.status === 'no_timeline') {
      return (
        <Badge className="bg-muted text-muted-foreground border-0 gap-1">
          <Clock className="w-3 h-3" />
          No timeline
        </Badge>
      );
    }
    
    if (countdown.status === 'not_started') {
      return (
        <Badge className="bg-muted text-muted-foreground border-0 gap-1">
          <Timer className="w-3 h-3" />
          {stage.daysAllowed} days (waiting)
        </Badge>
      );
    }
    
    if (countdown.status === 'overdue') {
      return (
        <Badge className="bg-destructive/20 text-destructive border-0 gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          {Math.abs(countdown.daysLeft ?? 0)}d overdue
        </Badge>
      );
    }
    
    // In progress
    const urgencyClass = countdown.daysLeft !== null && countdown.daysLeft <= 3
      ? 'bg-destructive/20 text-destructive' 
      : countdown.daysLeft !== null && countdown.daysLeft <= 7
        ? 'bg-warning/20 text-warning' 
        : 'bg-primary/20 text-primary';
    
    return (
      <Badge className={cn(urgencyClass, 'border-0 gap-1')}>
        <Timer className="w-3 h-3" />
        {countdown.daysLeft} days left
      </Badge>
    );
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

  function renderStageCard(stageInfo: StageInfo, projectId: string, stageIndex: number) {
    const stageKey = `${projectId}-${stageInfo.stage.id}`;
    const isExpanded = expandedStages.includes(stageKey);
    const completedCount = stageInfo.tasks.filter(t => t.status === 'completed').length;
    const totalCount = stageInfo.tasks.length;
    const stageProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div 
        key={stageKey}
        className={cn(
          "border rounded-lg overflow-hidden",
          stageInfo.isCompleted ? 'border-success/30 bg-success/5' :
          stageInfo.isActive ? 'border-primary/30 bg-primary/5' : 'border-border/50'
        )}
      >
        {/* Stage Header */}
        <div 
          className="flex items-start justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors gap-2"
          onClick={() => toggleStage(stageKey)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <div className={cn("w-3 h-3 rounded-full shrink-0", stageInfo.stage.color)} />
            <div className="min-w-0">
              <span className="font-medium text-sm">{stageInfo.stage.name}</span>
              <span className="text-xs text-muted-foreground ml-1">
                ({completedCount}/{totalCount})
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {getStageCountdownBadge(stageInfo)}
            <div className="flex items-center gap-1">
              <Progress value={stageProgress} className="w-14 h-1.5" />
              <span className="text-xs font-medium w-8 text-right">{stageProgress}%</span>
            </div>
          </div>
        </div>

        {/* Stage Tasks */}
        {isExpanded && (
          <div className="border-t border-border/30 p-3 space-y-2 bg-background/50">
            {stageInfo.tasks.map((task, taskIndex) => (
              <div 
                key={task.id}
                className={cn(
                  "flex flex-col gap-2 p-2 rounded-lg",
                  task.status === 'completed' ? 'bg-success/5' : 
                  task.status === 'in_progress' ? 'bg-warning/5' : 'bg-muted/20'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">{getStatusIcon(task.status)}</div>
                  <span className={cn(
                    "text-sm flex-1",
                    task.status === 'completed' && 'text-muted-foreground line-through'
                  )}>
                    {task.order_index}. {task.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap pl-6">
                  {task.completed_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.completed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                  <TaskFileUpload 
                    taskId={task.id} 
                    taskType="execution" 
                    compact 
                  />
                  {getStatusBadge(task.status)}
                  <Button 
                    size="sm" 
                    variant={task.status === 'completed' ? 'ghost' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    disabled={updateTask.isPending}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {task.status === 'completed' ? 'Undo' : 'Done'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderProjectCard(project: typeof filteredProjects[0], index: number) {
    return (
      <Card 
        key={project.id} 
        className="glass-card animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleProject(project.id)}
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
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-warning/50 text-warning hover:bg-warning/10 text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUrgentTaskDialog({
                      open: true,
                      projectId: project.id,
                      projectName: project.clientName,
                    });
                  }}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Urgent
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-primary">{project.progress}%</span>
                <Progress value={project.progress} className="w-16" />
              </div>
            </div>
          </div>
        </CardHeader>
        
        {expandedProjects.includes(project.id) && (
          <CardContent className="pt-0 space-y-4">
            {/* Urgent Tasks for this project */}
            {isAdmin && <UrgentTasksList projectId={project.id} compact />}
            
            {/* Stage cards */}
            <div className="space-y-3">
              {project.stagesInfo.map((stageInfo, stageIndex) => 
                renderStageCard(stageInfo, project.id, stageIndex)
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Execution Tasks</h1>
          <p className="text-muted-foreground mt-1">Track site work progress across 6 stages</p>
        </div>
        
        {/* Stage Legend */}
        <div className="flex flex-wrap gap-2">
          {EXECUTION_STAGES.map(stage => (
            <div key={stage.id} className="flex items-center gap-1.5 text-xs">
              <div className={cn("w-2 h-2 rounded-full", stage.color)} />
              <span className="text-muted-foreground">{stage.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* My Urgent Tasks - for non-admin users */}
      {!isAdmin && myUrgentTasks.length > 0 && (
        <UrgentTasksList showProjectName />
      )}

      {canApproveFiles ? (
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="approvals">Photo Approvals</TabsTrigger>
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

            {/* Projects with Stages */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-muted-foreground">No execution tasks found. Projects need to be assigned to you.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project, index) => renderProjectCard(project, index))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approvals">
            <FileApprovalSection type="execution" />
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

          {/* Projects with Stages */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-xl">
              <p className="text-muted-foreground">No execution tasks found. Projects need to be assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project, index) => renderProjectCard(project, index))}
            </div>
          )}
        </>
      )}

      {/* Urgent Task Dialog */}
      <CreateUrgentTaskDialog
        open={urgentTaskDialog.open}
        onOpenChange={(open) => setUrgentTaskDialog(prev => ({ ...prev, open }))}
        projectId={urgentTaskDialog.projectId}
        projectName={urgentTaskDialog.projectName}
      />
    </div>
  );
};

export default ExecutionTasks;
