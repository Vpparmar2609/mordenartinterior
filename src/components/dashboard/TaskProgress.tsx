import React from 'react';
import { Progress } from '@/components/ui/progress';

interface TaskCategory {
  name: string;
  completed: number;
  total: number;
  color: string;
}

const mockTasks: TaskCategory[] = [
  { name: 'Design Tasks', completed: 42, total: 60, color: 'bg-primary' },
  { name: 'Execution Tasks', completed: 28, total: 45, color: 'bg-accent' },
  { name: 'Pending Approvals', completed: 8, total: 12, color: 'bg-warning' },
  { name: 'Issues to Resolve', completed: 5, total: 7, color: 'bg-destructive' },
];

export const TaskProgress: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">
        Task Overview
      </h3>
      
      <div className="space-y-6">
        {mockTasks.map((task) => {
          const percentage = Math.round((task.completed / task.total) * 100);
          
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
