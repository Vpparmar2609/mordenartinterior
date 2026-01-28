import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useDesignFiles, useExecutionPhotos } from '@/hooks/useTaskFiles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  CheckCircle2, 
  Clock, 
  Image,
  MessageSquare,
  Star,
  FolderKanban,
  FileImage,
  Camera,
  Download,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statusLabels: Record<string, string> = {
  lead: 'New Lead',
  design_in_progress: 'Design In Progress',
  design_approval_pending: 'Waiting for Approval',
  design_approved: 'Design Approved',
  execution_started: 'Execution Started',
  work_in_progress: 'Work In Progress',
  finishing: 'Finishing',
  handover_pending: 'Handover Pending',
  snag_fix: 'Snag Fix',
  completed: 'Completed',
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    lead: 'bg-muted text-muted-foreground',
    design_in_progress: 'bg-accent/20 text-accent',
    design_approval_pending: 'bg-warning/20 text-warning',
    design_approved: 'bg-success/20 text-success',
    execution_started: 'bg-primary/20 text-primary',
    work_in_progress: 'bg-primary/30 text-primary',
    finishing: 'bg-accent/30 text-accent',
    handover_pending: 'bg-warning/30 text-warning',
    snag_fix: 'bg-destructive/20 text-destructive',
    completed: 'bg-success/30 text-success',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
};

interface ProjectPhotosProps {
  projectId: string;
}

const ProjectPhotos: React.FC<ProjectPhotosProps> = ({ projectId }) => {
  const { data: designFiles, isLoading: designLoading } = useDesignFiles(projectId);
  const { data: executionPhotos, isLoading: executionLoading } = useExecutionPhotos(projectId);

  const getSignedUrl = async (filePath: string, bucket: string) => {
    if (filePath.startsWith('http')) return filePath;
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60);
    return data?.signedUrl || filePath;
  };

  const handleDownload = async (filePath: string, bucket: string, fileName: string) => {
    const url = await getSignedUrl(filePath, bucket);
    window.open(url, '_blank');
  };

  if (designLoading || executionLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="design" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="design" className="flex items-center gap-2">
          <FileImage className="w-4 h-4" />
          Design ({designFiles?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="site" className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Site Photos ({executionPhotos?.length || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="design" className="mt-4">
        {!designFiles || designFiles.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Design files will appear here once uploaded by the design team.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {designFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileImage className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">{file.task_name}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDownload(file.file_url, 'design-files', file.file_name)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="site" className="mt-4">
        {!executionPhotos || executionPhotos.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Site progress photos will appear here once uploaded by the execution team.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {executionPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{photo.file_name}</p>
                  <p className="text-xs text-muted-foreground">{photo.task_name}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDownload(photo.file_url, 'execution-photos', photo.file_name)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading } = useProjects();

  // Filter projects where the client is assigned
  const myProjects = projects.filter(p => p.client_user_id === user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-muted-foreground">Loading your projects...</div>
      </div>
    );
  }

  if (myProjects.length === 0) {
    return (
      <div className="text-center py-12 glass-card rounded-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <FolderKanban className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-display mb-2">Welcome to Modern Art Interior</h2>
        <p className="text-muted-foreground mb-4">No projects have been assigned to you yet.</p>
        <p className="text-sm text-muted-foreground">Once your project is created, you'll see all the details here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {myProjects.map((project) => {
        const isDesignPhase = ['design_in_progress', 'design_approval_pending', 'design_approved'].includes(project.status);
        const designProgress = isDesignPhase ? Math.min(project.progress, 100) : 100;
        const executionProgress = !isDesignPhase ? project.progress : 0;

        return (
          <div key={project.id} className="space-y-6">
            {/* Project Overview Card */}
            <Card className="glass-card overflow-hidden">
              <div className="bg-gradient-warm p-6 text-primary-foreground">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-5 h-5" />
                      <h2 className="text-xl font-display font-semibold">{project.client_name}'s Interior</h2>
                    </div>
                    <p className="text-primary-foreground/80 text-sm">{project.location}</p>
                    <p className="text-primary-foreground/60 text-xs mt-1">{project.bhk} • {project.flat_size}</p>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {statusLabels[project.status] || project.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Overall Progress</span>
                      <span className="text-lg font-bold text-primary">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        {designProgress >= 100 ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <Clock className="w-4 h-4 text-warning" />
                        )}
                        <span className="text-sm text-muted-foreground">Design Phase</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">{designProgress}%</p>
                      {designProgress >= 100 && (
                        <Badge variant="outline" className="mt-2 text-success border-success">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Execution Phase</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">{executionProgress}%</p>
                      {!isDesignPhase && (
                        <p className="text-xs text-muted-foreground mt-2">In progress</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Expected Completion</span>
                    <span className="font-medium text-foreground">
                      {new Date(project.deadline).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to={`/projects/${project.id}`}>
                  <Image className="w-6 h-6 mb-2 text-primary" />
                  <span>View Project</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/messages">
                  <MessageSquare className="w-6 h-6 mb-2 text-primary" />
                  <span>Project Updates</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Star className="w-6 h-6 mb-2 text-primary" />
                <span>Give Feedback</span>
              </Button>
            </div>

            {/* Project Details & Photos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground">{project.location}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Configuration</span>
                      <span className="font-medium text-foreground">{project.bhk}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium text-foreground">{project.flat_size}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-medium text-foreground">{project.budget_range}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-medium text-foreground">
                        {new Date(project.start_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Project Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectPhotos projectId={project.id} />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
};
