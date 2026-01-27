import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ClipboardList,
  Camera,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SiteSupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { issues } = useIssues();
  const navigate = useNavigate();

  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);
  const [executionTasks, setExecutionTasks] = useState<any[]>([]);

  // Fetch projects assigned to this site supervisor via project_team
  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('project_team')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('role', 'site_supervisor');

      if (data) {
        setMyProjectIds(data.map(d => d.project_id));
      }
    };

    fetchMyProjects();
  }, [user]);

  // Fetch execution tasks for my projects
  useEffect(() => {
    const fetchTasks = async () => {
      if (myProjectIds.length === 0) return;
      
      const { data } = await supabase
        .from('execution_tasks')
        .select('*')
        .in('project_id', myProjectIds)
        .order('order_index', { ascending: true });

      if (data) {
        setExecutionTasks(data);
      }
    };

    fetchTasks();
  }, [myProjectIds]);

  const myProjects = projects.filter(p => myProjectIds.includes(p.id));
  const myIssues = issues.filter(i => i.reported_by === user?.id);
  const openIssues = myIssues.filter(i => i.status !== 'resolved');

  const completedTasks = executionTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = executionTasks.filter(t => t.status === 'pending').length;

  const stats = [
    {
      title: 'Assigned Projects',
      value: projectsLoading ? '...' : myProjects.length.toString(),
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
      title: 'My Open Issues',
      value: openIssues.length.toString(),
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-gradient-warm hover:opacity-90" onClick={() => navigate('/daily-reports')}>
          <ClipboardList className="w-4 h-4 mr-2" />
          Submit Daily Report
        </Button>
        <Button variant="outline" onClick={() => navigate('/issues')}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
        <Button variant="outline">
          <Camera className="w-4 h-4 mr-2" />
          Upload Photos
        </Button>
      </div>

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

      {/* My Projects */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">My Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {myProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects assigned to you</p>
          ) : (
            myProjects.map((project) => {
              const projectTasks = executionTasks.filter(t => t.project_id === project.id);
              const nextTask = projectTasks.find(t => t.status === 'pending');
              
              return (
                <div key={project.id} className="space-y-3 p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{project.client_name}</h3>
                      <p className="text-xs text-muted-foreground">{project.location}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {nextTask ? `Next: ${nextTask.name}` : 'No pending tasks'}
                    </span>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => navigate('/messages')}>
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Execution Tasks and Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {executionTasks.filter(t => t.status !== 'completed').length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {executionTasks
                  .filter(t => t.status !== 'completed')
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.name}</p>
                        {task.expected_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.expected_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'in_progress' ? 'bg-primary/20 text-primary' :
                        'bg-warning/20 text-warning'
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
              <AlertTriangle className="w-5 h-5 text-warning" />
              My Open Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openIssues.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No open issues reported by you</p>
            ) : (
              <div className="space-y-2">
                {openIssues.map(issue => (
                  <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.issue_type}</p>
                      <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      issue.status === 'in_progress' ? 'bg-primary/20 text-primary' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};