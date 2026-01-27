import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Upload,
  FileImage
} from 'lucide-react';

export const DesignerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading } = useProjects();
  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);
  const [designTasks, setDesignTasks] = useState<any[]>([]);

  // Fetch projects assigned to this designer via project_team
  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('project_team')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('role', 'designer');

      if (data) {
        setMyProjectIds(data.map(d => d.project_id));
      }
    };

    fetchMyProjects();
  }, [user]);

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
  }, [myProjectIds]);

  const myProjects = projects.filter(p => myProjectIds.includes(p.id));
  const completedTasks = designTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = designTasks.filter(t => t.status === 'pending').length;

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
      title: 'Files Uploaded',
      value: '0',
      icon: <Upload className="w-5 h-5" />,
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

      {/* My Projects with Progress */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">My Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {myProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects assigned to you</p>
          ) : (
            myProjects.map((project) => (
              <div key={project.id} className="space-y-2 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{project.client_name}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                    {project.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress} className="flex-1" />
                  <span className="text-sm font-medium text-primary">{project.progress}%</span>
                </div>
              </div>
            ))
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