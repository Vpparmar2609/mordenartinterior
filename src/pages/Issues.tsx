import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useIssues } from '@/hooks/useIssues';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const Issues: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [newIssue, setNewIssue] = useState({
    project_id: '',
    issue_type: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
  });

  const { issues, isLoading } = useIssues();
  const { projects } = useProjects();

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.client_name || 'Unknown Project';
  };

  const filteredIssues = issues.filter((issue) => {
    const projectName = issue.project?.client_name || getProjectName(issue.project_id);
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.issue_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-destructive/20 text-destructive border-0">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning border-0">Medium</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive"><AlertTriangle className="w-3 h-3" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="gap-1 border-warning/50 text-warning"><Clock className="w-3 h-3" />In Progress</Badge>;
      default:
        return <Badge variant="outline" className="gap-1 border-success/50 text-success"><CheckCircle2 className="w-3 h-3" />Resolved</Badge>;
    }
  };

  const handleCreateIssue = async () => {
    if (!user || !newIssue.project_id || !newIssue.issue_type || !newIssue.description) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('issues')
        .insert({
          project_id: newIssue.project_id,
          issue_type: newIssue.issue_type,
          description: newIssue.description,
          severity: newIssue.severity,
          reported_by: user.id,
          status: 'open',
        });

      if (error) throw error;

      toast({
        title: 'Issue reported',
        description: 'Your issue has been submitted.',
      });
      setShowCreateDialog(false);
      setNewIssue({
        project_id: '',
        issue_type: '',
        description: '',
        severity: 'medium',
      });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openCount = issues.filter(i => i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Issues</h1>
          <p className="text-muted-foreground mt-1">
            {openCount} open, {inProgressCount} in progress
          </p>
        </div>
        <Button className="bg-gradient-warm hover:opacity-90" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No issues found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue, index) => (
            <Card 
              key={issue.id} 
              className={cn(
                "glass-card animate-fade-in",
                issue.status === 'open' && issue.severity === 'high' && 'border-destructive/30'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">{issue.project?.client_name || getProjectName(issue.project_id)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{issue.issue_type}</span>
                    </div>
                    <p className="text-sm text-foreground mb-3">{issue.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Reported by {issue.reporter?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {issue.assignee && (
                        <>
                          <span>•</span>
                          <span>Assigned to {issue.assignee.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getSeverityBadge(issue.severity)}
                    {getStatusBadge(issue.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Issue Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report New Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select 
                value={newIssue.project_id} 
                onValueChange={(value) => setNewIssue({ ...newIssue, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Type</label>
              <Select 
                value={newIssue.issue_type} 
                onValueChange={(value) => setNewIssue({ ...newIssue, issue_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Material Delay">Material Delay</SelectItem>
                  <SelectItem value="Labour Shortage">Labour Shortage</SelectItem>
                  <SelectItem value="Quality Rework">Quality Rework</SelectItem>
                  <SelectItem value="Client Change Request">Client Change Request</SelectItem>
                  <SelectItem value="Vendor Issue">Vendor Issue</SelectItem>
                  <SelectItem value="Safety Concern">Safety Concern</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select 
                value={newIssue.severity} 
                onValueChange={(value: 'low' | 'medium' | 'high') => setNewIssue({ ...newIssue, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="hero" 
              onClick={handleCreateIssue}
              disabled={isCreating || !newIssue.project_id || !newIssue.issue_type || !newIssue.description}
            >
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Issues;
