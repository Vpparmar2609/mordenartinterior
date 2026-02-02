import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Play,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UrgentTask, useUrgentTasks, useMyUrgentTasks } from '@/hooks/useUrgentTasks';
import { useUserRole } from '@/hooks/useUserRole';
import { format, isPast, isToday } from 'date-fns';

interface UrgentTasksListProps {
  projectId?: string;
  showProjectName?: boolean;
  compact?: boolean;
}

export const UrgentTasksList: React.FC<UrgentTasksListProps> = ({
  projectId,
  showProjectName = false,
  compact = false,
}) => {
  const { isAdmin } = useUserRole();
  const { tasks, isLoading, updateTaskStatus, deleteTask } = useUrgentTasks(projectId);
  const { tasks: myTasks, updateStatus } = useMyUrgentTasks();

  // Show admin's view (all tasks for project) or assigned user's view (their tasks)
  const displayTasks = isAdmin && projectId ? tasks : myTasks;
  const statusMutation = isAdmin ? updateTaskStatus : updateStatus;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (displayTasks.length === 0) {
    return null;
  }

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical') {
      return <Zap className="w-4 h-4 text-destructive" />;
    }
    return <AlertTriangle className="w-4 h-4 text-warning" />;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'critical') {
      return (
        <Badge className="bg-destructive/20 text-destructive border-0 gap-1 animate-pulse">
          <Zap className="w-3 h-3" />
          Critical
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning/20 text-warning border-0 gap-1">
        <AlertTriangle className="w-3 h-3" />
        High
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-0">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary/20 text-primary border-0">In Progress</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">Pending</Badge>;
    }
  };

  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    const isDueToday = isToday(date);

    return (
      <div className={cn(
        "flex items-center gap-1 text-xs",
        isOverdue && "text-destructive",
        isDueToday && "text-warning"
      )}>
        <Calendar className="w-3 h-3" />
        {isOverdue ? 'Overdue: ' : isDueToday ? 'Due Today: ' : ''}
        {format(date, 'dd MMM')}
      </div>
    );
  };

  const handleStatusChange = (taskId: string, currentStatus: string) => {
    let newStatus: 'pending' | 'in_progress' | 'completed';
    
    if (currentStatus === 'pending') {
      newStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      newStatus = 'completed';
    } else {
      newStatus = 'pending';
    }
    
    statusMutation.mutate({ id: taskId, status: newStatus });
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {displayTasks.map((task) => (
          <div 
            key={task.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              task.priority === 'critical' 
                ? 'border-destructive/30 bg-destructive/5' 
                : 'border-warning/30 bg-warning/5'
            )}
          >
            <div className="flex items-center gap-3">
              {getPriorityIcon(task.priority)}
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                {showProjectName && task.projects && (
                  <p className="text-xs text-muted-foreground">{task.projects.client_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getDueDateDisplay(task.due_date)}
              {getStatusBadge(task.status)}
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => handleStatusChange(task.id, task.status)}
                disabled={statusMutation.isPending}
              >
                {task.status === 'pending' && <Play className="w-3 h-3" />}
                {task.status === 'in_progress' && <CheckCircle2 className="w-3 h-3" />}
                {task.status === 'completed' && <Clock className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-warning/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          Urgent Tasks
          <Badge variant="secondary" className="ml-auto">
            {displayTasks.filter(t => t.status !== 'completed').length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayTasks.map((task) => (
          <div 
            key={task.id}
            className={cn(
              "p-3 rounded-lg border",
              task.priority === 'critical' 
                ? 'border-destructive/30 bg-destructive/5' 
                : 'border-warning/30 bg-warning/5',
              task.status === 'completed' && 'opacity-60'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityBadge(task.priority)}
                  {getStatusBadge(task.status)}
                </div>
                <h4 className={cn(
                  "font-medium",
                  task.status === 'completed' && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {showProjectName && task.projects && (
                    <span className="text-xs text-muted-foreground">
                      Project: {task.projects.client_name}
                    </span>
                  )}
                  {getDueDateDisplay(task.due_date)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant={task.status === 'completed' ? 'ghost' : 'default'}
                  className="h-8"
                  onClick={() => handleStatusChange(task.id, task.status)}
                  disabled={statusMutation.isPending}
                >
                  {task.status === 'pending' && (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </>
                  )}
                  {task.status === 'in_progress' && (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Complete
                    </>
                  )}
                  {task.status === 'completed' && (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Reopen
                    </>
                  )}
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => deleteTask.mutate(task.id)}
                    disabled={deleteTask.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
