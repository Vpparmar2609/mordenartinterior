import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useAllDesignTasks, useAllExecutionTasks } from '@/hooks/useProjectTasks';
import { useApprovals } from '@/hooks/useApprovals';
import { useIssues } from '@/hooks/useIssues';
import { Loader2 } from 'lucide-react';

export const TaskProgress: React.FC = () => {
  const { tasks: designTasks, isLoading: designLoading } = useAllDesignTasks();
  const { tasks: executionTasks, isLoading: executionLoading } = useAllExecutionTasks();
  const { approvals, isLoading: approvalsLoading } = useApprovals();
  const { issues, isLoading: issuesLoading } = useIssues();

  const isLoading = designLoading || executionLoading || approvalsLoading || issuesLoading;

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-fade-in">
        <h3 className="font-display text-lg font-semibold text-foreground mb-6">
          Task Overview
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const designCompleted = designTasks.filter(t => t.status === 'completed').length;
  const designTotal = designTasks.length || 1;
  
  const executionCompleted = executionTasks.filter(t => t.status === 'completed').length;
  const executionTotal = executionTasks.length || 1;
  
  const pendingApprovals = approvals?.filter(a => a.status === 'pending') || [];
  const respondedApprovals = approvals?.filter(a => a.status !== 'pending') || [];
  const approvalsTotal = approvals?.length || 1;
  
  const resolvedIssues = issues?.filter(i => i.status === 'resolved') || [];
  const issuesTotal = issues?.length || 1;

  const taskCategories = [
    { 
      name: 'Design Tasks', 
      completed: designCompleted, 
      total: designTotal, 
      color: 'bg-primary' 
    },
    { 
      name: 'Execution Tasks', 
      completed: executionCompleted, 
      total: executionTotal, 
      color: 'bg-accent' 
    },
    { 
      name: 'Pending Approvals', 
      completed: respondedApprovals.length, 
      total: approvalsTotal, 
      color: 'bg-warning' 
    },
    { 
      name: 'Issues to Resolve', 
      completed: resolvedIssues.length, 
      total: issuesTotal, 
      color: 'bg-destructive' 
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">
        Task Overview
      </h3>
      
      <div className="space-y-6">
        {taskCategories.map((task) => {
          const percentage = task.total > 0 ? Math.round((task.completed / task.total) * 100) : 0;
          
          return (
            <div key={task.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{task.name}</span>
                <span className="text-muted-foreground">
                  {task.completed}/{task.total}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
