import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectWithDetails } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Calendar, User, Clock, CalendarPlus } from 'lucide-react';
import { statusLabels, statusColors } from '@/types/project';
import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';

interface ProjectListProps {
  projects: ProjectWithDetails[];
  compact?: boolean;
}

const getRemainingDays = (deadline: string) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  return differenceInDays(deadlineDate, today);
};

const getRemainingDaysDisplay = (days: number) => {
  if (days < 0) {
    return { text: `${Math.abs(days)} days overdue`, className: 'text-destructive' };
  } else if (days === 0) {
    return { text: 'Due today', className: 'text-warning' };
  } else if (days <= 7) {
    return { text: `${days} days left`, className: 'text-warning' };
  } else {
    return { text: `${days} days left`, className: 'text-muted-foreground' };
  }
};

export const ProjectList: React.FC<ProjectListProps> = ({ projects, compact = false }) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="space-y-2">
        {projects.map((project) => {
          const remainingDays = getRemainingDays(project.deadline);
          const daysDisplay = getRemainingDaysDisplay(remainingDays);
          
          return (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{project.client_name}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {project.location}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs", daysDisplay.className)}>
                  {daysDisplay.text}
                </span>
                <Progress value={project.progress} className="w-16 h-1.5" />
                <span className="text-xs text-muted-foreground">{project.progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => {
        const status = project.status as keyof typeof statusLabels;
        const colors = statusColors[status];
        const remainingDays = getRemainingDays(project.deadline);
        const daysDisplay = getRemainingDaysDisplay(remainingDays);
        
        return (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="p-4 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-primary/30 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{project.client_name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {project.location}
                </p>
              </div>
              <Badge className={cn(colors.bg, colors.text, 'border-0')}>
                {statusLabels[status]}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {project.bhk} BHK
              </div>
              <div className="flex items-center gap-1">
                <CalendarPlus className="w-3 h-3" />
                Created: {format(new Date(project.created_at), 'dd MMM')}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due: {format(new Date(project.deadline), 'dd MMM')}
              </div>
              <div className={cn("flex items-center gap-1 font-medium", daysDisplay.className)}>
                <Clock className="w-3 h-3" />
                {daysDisplay.text}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Progress value={project.progress} className="flex-1 h-2" />
              <span className="text-sm font-medium text-primary">{project.progress}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
