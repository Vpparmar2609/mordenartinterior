import React from 'react';
import { Project, statusLabels, statusColors } from '@/types/project';
import { Calendar, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, style }) => {
  const statusStyle = statusColors[project.status];
  
  return (
    <div 
      onClick={onClick}
      style={style}
      className="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/30 transition-all duration-200 hover:-translate-y-1 animate-fade-in"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">
            {project.clientName}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {project.location}
          </div>
        </div>
        <span className={cn(
          'status-badge',
          statusStyle.bg,
          statusStyle.text
        )}>
          {statusLabels[project.status]}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(project.deadline).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {project.bhk} BHK
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
      </div>
    </div>
  );
};
