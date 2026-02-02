import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Upload,
  FileImage,
  Timer,
  AlertTriangle
} from 'lucide-react';

interface ProjectAssignment {
  project_id: string;
  assigned_at: string;
}

const DESIGN_DEADLINE_DAYS = 20;

const getDesignDaysLeft = (assignedAt: string) => {
  const assignedDate = new Date(assignedAt);
  const designDeadline = addDays(assignedDate, DESIGN_DEADLINE_DAYS);
  const today = new Date();
  return differenceInDays(designDeadline, today);
};

const getDesignDaysDisplay = (daysLeft: number) => {
  if (daysLeft < 0) {
    return { 
      text: `${Math.abs(daysLeft)} days overdue`, 
      className: 'text-destructive bg-destructive/10',
      icon: AlertTriangle
    };
  } else if (daysLeft === 0) {
    return { 
      text: 'Due today', 
      className: 'text-warning bg-warning/10',
      icon: AlertTriangle
    };
  } else if (daysLeft <= 5) {
    return { 
      text: `${daysLeft} days left`, 
      className: 'text-warning bg-warning/10',
      icon: Timer
    };
  } else if (daysLeft <= 10) {
    return { 
      text: `${daysLeft} days left`, 
      className: 'text-accent bg-accent/10',
      icon: Timer
    };
  } else {
    return { 
      text: `${daysLeft} days left`, 
      className: 'text-success bg-success/10',
      icon: Timer
    };
  }
};

export const DesignerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading } = useProjects();
  const [projectAssignments, setProjectAssignments] = useState<Record<string, ProjectAssignment>>({});
  const [designTasks, setDesignTasks] = useState<any[]>([]);

  // Fetch projects assigned to this designer via project_team with assignment dates
  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('project_team')
        .select('project_id, assigned_at')
        .eq('user_id', user.id)
        .eq('role', 'designer');

      if (data) {
        const assignments: Record<string, ProjectAssignment> = {};
        data.forEach(d => {
          assignments[d.project_id] = { project_id: d.project_id, assigned_at: d.assigned_at };
        });
        setProjectAssignments(assignments);
      }
    };

    fetchMyProjects();
  }, [user]);

  const myProjectIds = Object.keys(projectAssignments);

  // Fetch design tasks for my projects
  useEffect(() => {
    const fetchTasks = async () => {
      if (myProjectIds.length === 0) return;
      
      const { data } = await supabase
        .from('design_tasks')
        .select('*')
        .in('project_id', myProjectIds)
        .order('order_index', { ascending: true });

      if (data) {
        setDesignTasks(data);
      }
    };

    fetchTasks();
  }, [myProjectIds.join(',')]);

  const myProjects = projects.filter(p => myProjectIds.includes(p.id));
  const completedTasks = designTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = designTasks.filter(t => t.status === 'pending').length;

  // Count projects with design deadline urgency
  const urgentProjects = myProjects.filter(p => {
    const assignment = projectAssignments[p.id];
    if (!assignment) return false;
    const daysLeft = getDesignDaysLeft(assignment.assigned_at);
    return daysLeft <= 5;
  }).length;

  const stats = [
    {
      title: 'My Projects',
      value: isLoading ? '...' : myProjects.length.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Tasks Completed',
      value: completedTasks.toString(),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks.toString(),
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Urgent (≤5 days)',
      value: urgentProjects.toString(),
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      {/* My Projects with Design Deadline Countdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            My Projects - Design Timeline (20 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {myProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects assigned to you</p>
          ) : (
            myProjects.map((project) => {
              const assignment = projectAssignments[project.id];
              const daysLeft = assignment ? getDesignDaysLeft(assignment.assigned_at) : null;
              const daysDisplay = daysLeft !== null ? getDesignDaysDisplay(daysLeft) : null;
              const DaysIcon = daysDisplay?.icon || Timer;
              
              // Calculate design progress (days used out of 20)
              const daysUsed = assignment ? DESIGN_DEADLINE_DAYS - (daysLeft || 0) : 0;
              const timeProgress = Math.min(100, Math.max(0, (daysUsed / DESIGN_DEADLINE_DAYS) * 100));
              
              return (
                <div key={project.id} className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{project.client_name}</span>
                      <p className="text-xs text-muted-foreground">
                        Assigned: {assignment ? format(new Date(assignment.assigned_at), 'dd MMM yyyy') : 'N/A'}
                      </p>
                    </div>
                    {daysDisplay && (
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                        daysDisplay.className
                      )}>
                        <DaysIcon className="w-3.5 h-3.5" />
                        {daysDisplay.text}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Design Timeline</span>
                      <span className="text-muted-foreground">{Math.max(0, daysUsed)}/{DESIGN_DEADLINE_DAYS} days used</span>
                    </div>
                    <Progress 
                      value={timeProgress} 
                      className={cn(
                        "h-2",
                        timeProgress > 75 ? "[&>div]:bg-destructive" : 
                        timeProgress > 50 ? "[&>div]:bg-warning" : ""
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Task Progress:</span>
                      <Progress value={project.progress} className="w-16 h-1.5" />
                      <span className="font-medium text-primary">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Current Tasks and Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {designTasks.filter(t => t.status !== 'completed').length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {designTasks
                  .filter(t => t.status !== 'completed')
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.name}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'in_progress' ? 'bg-primary/20 text-primary' :
                        task.status === 'revision' ? 'bg-warning/20 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm text-center py-4">No recent uploads</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};