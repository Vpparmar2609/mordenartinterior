import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useWorkload } from '@/hooks/useWorkload';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  HardHat,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Briefcase
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const ExecutionHeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { getUsersByRole } = useUsers();
  const { getWorkloadForUser } = useWorkload(['execution_manager', 'site_supervisor']);
  const { issues, isLoading: issuesLoading, updateIssue } = useIssues();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter projects assigned to this execution head
  const myProjects = projects.filter(p => p.execution_head_id === user?.id);
  const executionProjects = myProjects.filter(p => 
    ['execution_started', 'work_in_progress', 'finishing', 'handover_pending', 'snag_fix'].includes(p.status)
  );
  const completedProjects = myProjects.filter(p => p.status === 'completed');
  const nearCompletion = myProjects.filter(p => p.progress >= 80 && p.status !== 'completed');

  const executionManagers = getUsersByRole('execution_manager');
  const siteSupervisors = getUsersByRole('site_supervisor');

  // Get open issues for my projects
  const myProjectIds = myProjects.map(p => p.id);
  const myIssues = issues.filter(i => myProjectIds.includes(i.project_id) && i.status !== 'resolved');

  const handleAssignManager = async () => {
    if (!selectedProject || !selectedManager || !user) return;
    
    setIsAssigning(true);
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('project_team')
        .select('id')
        .eq('project_id', selectedProject)
        .eq('user_id', selectedManager)
        .eq('role', 'execution_manager')
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Already assigned',
          description: 'This manager is already assigned to this project.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('project_team')
        .insert({
          project_id: selectedProject,
          user_id: selectedManager,
          role: 'execution_manager',
          assigned_by: user.id,
        });

      if (error) throw error;

      // Update project status if design is approved and execution hasn't started
      const project = myProjects.find(p => p.id === selectedProject);
      if (project?.status === 'design_approved') {
        await supabase
          .from('projects')
          .update({ status: 'execution_started' })
          .eq('id', selectedProject);
      }

      toast({
        title: 'Manager assigned',
        description: 'Project has been assigned to the execution manager.',
      });
      setShowAssignDialog(false);
      setSelectedProject(null);
      setSelectedManager('');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['workload'] });
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
      title: 'In Execution',
      value: projectsLoading ? '...' : executionProjects.length.toString(),
      icon: <HardHat className="w-5 h-5" />,
    },
    {
      title: 'Near Completion',
      value: projectsLoading ? '...' : nearCompletion.length.toString(),
      icon: <TrendingUp className="w-5 h-5" />,
      trend: nearCompletion.length > 0 ? { value: nearCompletion.length, isPositive: true } : undefined,
    },
    {
      title: 'Completed',
      value: projectsLoading ? '...' : completedProjects.length.toString(),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Execution Managers',
      value: executionManagers.length.toString(),
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Site Supervisors',
      value: siteSupervisors.length.toString(),
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Open Issues',
      value: issuesLoading ? '...' : myIssues.length.toString(),
      icon: <AlertTriangle className="w-5 h-5" />,
      trend: myIssues.length > 0 ? { value: myIssues.length, isPositive: false } : undefined,
    },
    {
      title: 'Pending Tasks',
      value: '0',
      icon: <Clock className="w-5 h-5" />,
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
            trend={stat.trend}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      {/* My Projects - All projects for assignment */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display">My Execution Projects</CardTitle>
          <Badge variant="secondary">{myProjects.length} total</Badge>
        </CardHeader>
        <CardContent>
          {myProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects assigned to you</p>
          ) : (
            <div className="space-y-3">
              {myProjects.map(project => (
                <div key={project.id} className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{project.client_name}</p>
                      <p className="text-xs text-muted-foreground">{project.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                        {project.status.replace(/_/g, ' ')}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedProject(project.id);
                        setShowAssignDialog(true);
                      }}>
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="flex-1" />
                    <span className="text-sm font-medium text-primary">{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issues and Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myIssues.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No open issues</p>
            ) : (
              <div className="space-y-2">
                {myIssues.slice(0, 5).map(issue => (
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
            <CardTitle className="text-lg font-display">Team & Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Execution Managers</p>
                {executionManagers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No managers available</p>
                ) : (
                  <div className="space-y-1">
                    {executionManagers.map(manager => {
                      const workload = getWorkloadForUser(manager.id);
                      return (
                        <div key={manager.id} className="flex items-center justify-between p-2 rounded bg-muted/20">
                          <span className="text-sm">{manager.name}</span>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                            <span className={`text-xs font-medium ${
                              workload === 0 ? 'text-success' :
                              workload <= 2 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {workload}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Site Supervisors</p>
                {siteSupervisors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No supervisors available</p>
                ) : (
                  <div className="space-y-1">
                    {siteSupervisors.slice(0, 4).map(supervisor => {
                      const workload = getWorkloadForUser(supervisor.id);
                      return (
                        <div key={supervisor.id} className="flex items-center justify-between p-2 rounded bg-muted/20">
                          <span className="text-sm">{supervisor.name}</span>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                            <span className={`text-xs font-medium ${
                              workload === 0 ? 'text-success' :
                              workload <= 2 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {workload}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Manager Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Execution Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Execution Manager</label>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a manager" />
                </SelectTrigger>
                <SelectContent>
                  {executionManagers.map(manager => {
                    const workload = getWorkloadForUser(manager.id);
                    return (
                      <SelectItem key={manager.id} value={manager.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{manager.name}</span>
                          <Badge variant={workload === 0 ? 'default' : workload <= 2 ? 'secondary' : 'destructive'}>
                            {workload} projects
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                onClick={handleAssignManager}
                disabled={!selectedManager || isAssigning}
              >
                Assign Manager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
