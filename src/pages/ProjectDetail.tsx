import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useDesignTasks, useExecutionTasks } from '@/hooks/useProjectTasks';
import { ProjectChat } from '@/components/chat/ProjectChat';
import { ProjectLifecycleControls } from '@/components/projects/ProjectLifecycleControls';
import { TeamAssignmentSection } from '@/components/projects/TeamAssignmentSection';
import { statusLabels, statusColors } from '@/types/project';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  User,
  Palette,
  HardHat,
  MessageSquare,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { tasks: designTasks, isLoading: designTasksLoading, updateTask: updateDesignTask } = useDesignTasks(id);
  const { tasks: executionTasks, isLoading: executionTasksLoading, updateTask: updateExecutionTask } = useExecutionTasks(id);

  const designCompleted = designTasks.filter(t => t.status === 'completed').length;
  const executionCompleted = executionTasks.filter(t => t.status === 'completed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-0">Done</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning/20 text-warning border-0">In Progress</Badge>;
      case 'revision':
        return <Badge className="bg-destructive/20 text-destructive border-0">Revision</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">Pending</Badge>;
    }
  };

  const project = projects.find(p => p.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const status = project.status as keyof typeof statusLabels;
  const colors = statusColors[status];

  const isAdmin = role === 'admin';
  const isClient = role === 'client';
  const lifecycleStatus = (project as any).lifecycle_status || 'active';
  const isStopped = lifecycleStatus === 'stopped';

  return (
    <div className="space-y-6">
      {/* Stopped Project Warning */}
      {isStopped && !isAdmin && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-warning">
            This project has been stopped by the admin. View-only access is available.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {project.client_name}
              </h1>
              <Badge className={cn(colors.bg, colors.text, 'border-0')}>
                {statusLabels[status]}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {project.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Admin Lifecycle Controls */}
          {isAdmin && (
            <ProjectLifecycleControls 
              projectId={project.id} 
              lifecycleStatus={lifecycleStatus} 
            />
          )}
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-2xl font-display font-bold text-primary">{project.progress}%</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={project.progress} className="h-3" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{project.client_phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{project.client_email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">BHK</p>
                  <p className="font-medium">{project.bhk} BHK</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{project.flat_size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">{project.budget_range}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{project.location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {new Date(project.start_date).toLocaleDateString('en-IN', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">
                    {new Date(project.deadline).toLocaleDateString('en-IN', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Team Assignment - Interactive */}
            <TeamAssignmentSection
              projectId={project.id}
              designHeadId={project.design_head_id}
              executionHeadId={project.execution_head_id}
              designHeadProfile={project.design_head_profile}
              executionHeadProfile={project.execution_head_profile}
            />
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
                Design Tasks ({designCompleted}/{designTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designTasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : designTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No design tasks found for this project.
                </p>
              ) : (
                <div className="space-y-2">
                  {designTasks.map((task, idx) => (
                    <div 
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        task.status === 'completed' ? 'bg-success/5' : 
                        task.status === 'in_progress' ? 'bg-warning/5' : 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <span className={cn(
                          "font-medium",
                          task.status === 'completed' && 'text-muted-foreground line-through'
                        )}>
                          {idx + 1}. {task.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(task.status)}
                        {task.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8"
                            onClick={() => updateDesignTask.mutate({ id: task.id, status: 'completed' })}
                            disabled={updateDesignTask.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <HardHat className="w-5 h-5 text-accent" />
                Execution Tasks ({executionCompleted}/{executionTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executionTasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : executionTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No execution tasks found for this project.
                </p>
              ) : (
                <div className="space-y-2">
                  {executionTasks.map((task, idx) => (
                    <div 
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        task.status === 'completed' ? 'bg-success/5' : 
                        task.status === 'in_progress' ? 'bg-warning/5' : 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <span className={cn(
                          "font-medium",
                          task.status === 'completed' && 'text-muted-foreground'
                        )}>
                          {idx + 1}. {task.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.completed_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.completed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {getStatusBadge(task.status)}
                        {task.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8"
                            onClick={() => updateExecutionTask.mutate({ id: task.id, status: 'completed' })}
                            disabled={updateExecutionTask.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Done
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ProjectChat projectId={project.id} isClient={isClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
