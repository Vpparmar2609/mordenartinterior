import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectChat } from '@/components/chat/ProjectChat';
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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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

  const isClient = role === 'client';

  return (
    <div className="space-y-6">
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
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Progress</div>
          <div className="text-2xl font-display font-bold text-primary">{project.progress}%</div>
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

            {/* Team */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display">Team Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-accent" />
                    <span className="text-sm">Design Head</span>
                  </div>
                  <span className="font-medium">
                    {project.design_head_profile?.name || 'Not assigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Execution Head</span>
                  </div>
                  <span className="font-medium">
                    {project.execution_head_profile?.name || 'Not assigned'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
                Design Tasks (0/15)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm text-center py-8">
                Design tasks will be loaded from the database...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <HardHat className="w-5 h-5 text-orange-500" />
                Execution Tasks (0/15)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm text-center py-8">
                Execution tasks will be loaded from the database...
              </p>
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
