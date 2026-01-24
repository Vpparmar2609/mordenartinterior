import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  CheckCircle2, 
  Clock, 
  Image,
  MessageSquare,
  Star
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  // Mock client project data
  const project = {
    name: 'My Home Interior',
    location: 'Andheri West, Mumbai',
    status: 'Work In Progress',
    overallProgress: 65,
    designProgress: 100,
    executionProgress: 65,
    designsApproved: true,
    currentPhase: 'Execution',
    expectedCompletion: 'March 15, 2026',
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Design In Progress': 'bg-accent/20 text-accent',
      'Waiting for Approval': 'bg-warning/20 text-warning',
      'Design Approved': 'bg-success/20 text-success',
      'Execution Started': 'bg-primary/20 text-primary',
      'Work In Progress': 'bg-primary/30 text-primary',
      'Finishing': 'bg-accent/30 text-accent',
      'Feedback Pending': 'bg-warning/30 text-warning',
      'Snag Fix': 'bg-destructive/20 text-destructive',
      'Completed': 'bg-success/30 text-success',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <Card className="glass-card overflow-hidden">
        <div className="bg-gradient-warm p-6 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-5 h-5" />
                <h2 className="text-xl font-display font-semibold">{project.name}</h2>
              </div>
              <p className="text-primary-foreground/80 text-sm">{project.location}</p>
            </div>
            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                <span className="text-lg font-bold text-primary">{project.overallProgress}%</span>
              </div>
              <Progress value={project.overallProgress} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Design Phase</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{project.designProgress}%</p>
                {project.designsApproved && (
                  <Badge variant="outline" className="mt-2 text-success border-success">
                    Approved
                  </Badge>
                )}
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Execution Phase</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{project.executionProgress}%</p>
                <p className="text-xs text-muted-foreground mt-2">10/15 tasks done</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Expected Completion</span>
              <span className="font-medium text-foreground">{project.expectedCompletion}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col">
          <Image className="w-6 h-6 mb-2 text-primary" />
          <span>View Designs</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <MessageSquare className="w-6 h-6 mb-2 text-primary" />
          <span>Project Updates</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col">
          <Star className="w-6 h-6 mb-2 text-primary" />
          <span>Give Feedback</span>
        </Button>
      </div>

      {/* Recent Updates and Site Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-success mt-2" />
                <div>
                  <p className="text-sm text-foreground">Kitchen shutters installed</p>
                  <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-4 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-success mt-2" />
                <div>
                  <p className="text-sm text-foreground">Painting completed in living room</p>
                  <p className="text-xs text-muted-foreground">Yesterday, 4:15 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm text-foreground">TV unit installation in progress</p>
                  <p className="text-xs text-muted-foreground">Jan 22, 2026</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Site Progress Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Progress photos shared by the team will appear here...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
