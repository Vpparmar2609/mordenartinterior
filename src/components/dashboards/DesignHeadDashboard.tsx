import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectList } from '@/components/projects/ProjectList';
import { Progress } from '@/components/ui/progress';
import { 
  FolderKanban, 
  Users, 
  CheckCircle2, 
  Clock, 
  Palette,
  AlertCircle,
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const DesignHeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { getUsersByRole, users } = useUsers();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter projects assigned to this design head
  const myProjects = projects.filter(p => p.design_head_id === user?.id);
  const designProjects = myProjects.filter(p => 
    ['design_in_progress', 'design_approval_pending'].includes(p.status)
  );
  const approvedProjects = myProjects.filter(p => p.status === 'design_approved');
  const pendingApproval = myProjects.filter(p => p.status === 'design_approval_pending');
  const designers = getUsersByRole('designer');

  // Get designer workload (count projects assigned to each designer via project_team)
  const getDesignerWorkload = (designerId: string) => {
    // For now, we show all designers - workload tracking would need project_team query
    return 0;
  };

  const handleAssignDesigner = async () => {
    if (!selectedProject || !selectedDesigner || !user) return;
    
    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('project_team')
        .insert({
          project_id: selectedProject,
          user_id: selectedDesigner,
          role: 'designer',
          assigned_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Designer assigned',
        description: 'Project has been assigned to the designer.',
      });
      setShowAssignDialog(false);
      setSelectedProject(null);
      setSelectedDesigner('');
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

  const handleApproveDesign = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'design_approved' })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Design approved',
        description: 'Project design has been approved.',
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const stats = [
    {
      title: 'My Projects',
      value: projectsLoading ? '...' : myProjects.length.toString(),
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      title: 'Design In Progress',
      value: projectsLoading ? '...' : myProjects.filter(p => p.status === 'design_in_progress').length.toString(),
      icon: <Palette className="w-5 h-5" />,
    },
    {
      title: 'Pending Approval',
      value: projectsLoading ? '...' : pendingApproval.length.toString(),
      icon: <Clock className="w-5 h-5" />,
      trend: pendingApproval.length > 0 ? { value: pendingApproval.length, isPositive: false } : undefined,
    },
    {
      title: 'Approved',
      value: projectsLoading ? '...' : approvedProjects.length.toString(),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Team Designers',
      value: designers.length.toString(),
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Needs Revision',
      value: '0',
      icon: <AlertCircle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Design Approval Queue */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Design Approval Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingApproval.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No projects pending approval</p>
          ) : (
            <div className="space-y-3">
              {pendingApproval.map(project => (
                <div key={project.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{project.client_name}</p>
                    <p className="text-xs text-muted-foreground">{project.location} • {project.bhk} BHK</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedProject(project.id);
                      setShowAssignDialog(true);
                    }}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
                    <Button size="sm" variant="hero" onClick={() => handleApproveDesign(project.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects and Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {myProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No projects assigned to you</p>
            ) : (
              <div className="space-y-3">
                {myProjects.slice(0, 5).map(project => (
                  <div key={project.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{project.client_name}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="flex-1" />
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Design Team</CardTitle>
          </CardHeader>
          <CardContent>
            {designers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No designers in team</p>
            ) : (
              <div className="space-y-2">
                {designers.map(designer => (
                  <div key={designer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{designer.name}</p>
                      <p className="text-xs text-muted-foreground">{designer.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                      Available
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Designer Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Designer to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Designer</label>
              <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map(designer => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.name}
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
                onClick={handleAssignDesigner}
                disabled={!selectedDesigner || isAssigning}
              >
                Assign Designer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};