import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  ClipboardList,
  UserPlus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ExecutionManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { getUsersByRole } = useUsers();
  const { issues, updateIssue } = useIssues();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const siteSupervisors = getUsersByRole('site_supervisor');

  // Fetch projects assigned to this execution manager via project_team
  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('project_team')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('role', 'execution_manager');

      if (data) {
        setMyProjectIds(data.map(d => d.project_id));
      }
    };

    fetchMyProjects();
  }, [user]);

  const myProjects = projects.filter(p => myProjectIds.includes(p.id));
  const myIssues = issues.filter(i => myProjectIds.includes(i.project_id) && i.status !== 'resolved');

  const handleAssignSupervisor = async () => {
    if (!selectedProject || !selectedSupervisor || !user) return;
    
    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('project_team')
        .insert({
          project_id: selectedProject,
          user_id: selectedSupervisor,
          role: 'site_supervisor',
          assigned_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Supervisor assigned',
        description: 'Project has been assigned to the site supervisor.',
      });
      setShowAssignDialog(false);
      setSelectedProject(null);
      setSelectedSupervisor('');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    updateIssue.mutate({ id: issueId, status: 'resolved' });
  };

  const stats = [
    {
      title: 'My Projects',
      value: projectsLoading ? '...' : myProjects.length.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Site Supervisors',
      value: siteSupervisors.length.toString(),
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Tasks Completed',
      value: '0',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Open Issues',
      value: myIssues.length.toString(),
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

      {/* Execution Progress */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">My Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {myProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects assigned to you</p>
          ) : (
            myProjects.map((project) => (
              <div key={project.id} className="space-y-2 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{project.client_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {project.status.replace(/_/g, ' ')}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedProject(project.id);
                      setShowAssignDialog(true);
                    }}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign Supervisor
                    </Button>
                  </div>
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

      {/* Issues and Daily Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Issue Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myIssues.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No open issues</p>
            ) : (
              <div className="space-y-2">
                {myIssues.map(issue => (
                  <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.issue_type}</p>
                      <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        issue.severity === 'high' ? 'bg-destructive/20 text-destructive' :
                        issue.severity === 'medium' ? 'bg-warning/20 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {issue.severity}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => handleResolveIssue(issue.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Site Supervisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {siteSupervisors.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No supervisors available</p>
            ) : (
              <div className="space-y-2">
                {siteSupervisors.map(supervisor => (
                  <div key={supervisor.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{supervisor.name}</p>
                      <p className="text-xs text-muted-foreground">{supervisor.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Supervisor Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Site Supervisor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Site Supervisor</label>
              <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {siteSupervisors.map(supervisor => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                onClick={handleAssignSupervisor}
                disabled={!selectedSupervisor || isAssigning}
              >
                Assign Supervisor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};