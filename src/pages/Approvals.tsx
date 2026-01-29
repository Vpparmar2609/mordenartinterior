import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  MessageSquare,
  Palette,
  HardHat,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileImage,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useFileApprovals, FileApproval } from '@/hooks/useFileApprovals';
import { supabase } from '@/integrations/supabase/client';

const Approvals: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingFile, setRejectingFile] = useState<FileApproval | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<FileApproval | null>(null);

  const { approvals, isLoading, pendingCount, approveFile, rejectFile } = useFileApprovals();

  // Filter approvals
  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      return filter === 'all' || approval.approval_status === filter;
    });
  }, [approvals, filter]);

  // Group by project -> task -> files
  const groupedApprovals = useMemo(() => {
    const grouped: Record<string, {
      projectName: string;
      projectId: string;
      tasks: Record<string, {
        taskName: string;
        taskId: string;
        type: 'design' | 'execution';
        files: FileApproval[];
      }>;
    }> = {};

    filteredApprovals.forEach((file) => {
      if (!grouped[file.project_id]) {
        grouped[file.project_id] = {
          projectName: file.project_name,
          projectId: file.project_id,
          tasks: {},
        };
      }

      const taskKey = `${file.task_id}-${file.type}`;
      if (!grouped[file.project_id].tasks[taskKey]) {
        grouped[file.project_id].tasks[taskKey] = {
          taskName: file.task_name,
          taskId: file.task_id,
          type: file.type,
          files: [],
        };
      }

      grouped[file.project_id].tasks[taskKey].files.push(file);
    });

    return grouped;
  }, [filteredApprovals]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleTask = (taskKey: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskKey)) {
        next.delete(taskKey);
      } else {
        next.add(taskKey);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-success/20 text-success border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      default:
        return <Badge className="bg-destructive/20 text-destructive border-0"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  const handleApprove = (file: FileApproval) => {
    approveFile.mutate({ id: file.id, type: file.type });
  };

  const handleReject = () => {
    if (rejectingFile && rejectComment.trim()) {
      rejectFile.mutate({ id: rejectingFile.id, type: rejectingFile.type, reason: rejectComment });
      setRejectComment('');
      setRejectingFile(null);
    }
  };

  const getFileUrl = async (file: FileApproval) => {
    const bucket = file.type === 'design' ? 'design-files' : 'execution-photos';
    const { data } = await supabase.storage.from(bucket).createSignedUrl(file.file_url, 3600);
    return data?.signedUrl;
  };

  const handlePreview = async (file: FileApproval) => {
    const url = await getFileUrl(file);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownload = async (file: FileApproval) => {
    const url = await getFileUrl(file);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
      link.click();
    }
  };

  // Auto-expand all projects on initial load when there are pending items
  React.useEffect(() => {
    if (filter === 'pending' && Object.keys(groupedApprovals).length > 0) {
      setExpandedProjects(new Set(Object.keys(groupedApprovals)));
    }
  }, [filter, Object.keys(groupedApprovals).length]);

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
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">File Approvals</h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount} pending file{pendingCount !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className={filter === status ? 'bg-gradient-warm' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Approvals List Grouped by Project -> Task */}
      {Object.keys(groupedApprovals).length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No file approvals found.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              File approvals will appear here when team members upload files to tasks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedApprovals).map(([projectId, projectData], projectIndex) => {
            const projectPendingCount = Object.values(projectData.tasks)
              .flatMap(t => t.files)
              .filter(f => f.approval_status === 'pending').length;
            const isProjectExpanded = expandedProjects.has(projectId);

            return (
              <Card 
                key={projectId} 
                className="glass-card animate-fade-in"
                style={{ animationDelay: `${projectIndex * 50}ms` }}
              >
                <Collapsible open={isProjectExpanded} onOpenChange={() => toggleProject(projectId)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isProjectExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <CardTitle className="text-lg font-display">
                            {projectData.projectName}
                          </CardTitle>
                          {projectPendingCount > 0 && (
                            <Badge className="bg-warning/20 text-warning border-0">
                              {projectPendingCount} pending
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Object.keys(projectData.tasks).length} task{Object.keys(projectData.tasks).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {Object.entries(projectData.tasks).map(([taskKey, taskData]) => {
                        const isTaskExpanded = expandedTasks.has(taskKey);
                        const taskPendingCount = taskData.files.filter(f => f.approval_status === 'pending').length;

                        return (
                          <Collapsible 
                            key={taskKey} 
                            open={isTaskExpanded} 
                            onOpenChange={() => toggleTask(taskKey)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  {isTaskExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  {taskData.type === 'design' ? (
                                    <Palette className="w-4 h-4 text-accent" />
                                  ) : (
                                    <HardHat className="w-4 h-4 text-primary" />
                                  )}
                                  <span className="font-medium text-sm">{taskData.taskName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {taskData.type === 'design' ? 'Design' : 'Execution'}
                                  </Badge>
                                  {taskPendingCount > 0 && (
                                    <Badge className="bg-warning/20 text-warning border-0 text-xs">
                                      {taskPendingCount} pending
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {taskData.files.length} file{taskData.files.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="mt-2 ml-6 space-y-2">
                              {taskData.files.map((file, fileIndex) => (
                                <div 
                                  key={file.id}
                                  className={cn(
                                    "flex items-start justify-between p-3 rounded-lg border",
                                    file.approval_status === 'pending' && 'border-warning/30 bg-warning/5',
                                    file.approval_status === 'approved' && 'border-success/30 bg-success/5',
                                    file.approval_status === 'rejected' && 'border-destructive/30 bg-destructive/5'
                                  )}
                                >
                                  <div className="flex items-start gap-3 flex-1">
                                    <FileImage className="w-8 h-8 text-muted-foreground mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{file.file_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Uploaded by {file.uploader?.name || 'Unknown'} • {new Date(file.uploaded_at).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                      {file.approval_status !== 'pending' && file.approver && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {file.approval_status === 'approved' ? 'Approved' : 'Rejected'} by {file.approver.name}
                                        </p>
                                      )}
                                      {file.rejection_reason && (
                                        <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                          {file.rejection_reason}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2 ml-3">
                                    {getStatusBadge(file.approval_status)}
                                    <div className="flex gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="h-7 px-2"
                                        onClick={() => handlePreview(file)}
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="h-7 px-2"
                                        onClick={() => handleDownload(file)}
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                      {file.approval_status === 'pending' && (
                                        <>
                                          <Button 
                                            size="sm" 
                                            className="h-7 px-2 bg-success hover:bg-success/90 text-white"
                                            onClick={() => handleApprove(file)}
                                            disabled={approveFile.isPending}
                                          >
                                            <CheckCircle2 className="w-3 h-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive"
                                            className="h-7 px-2"
                                            onClick={() => setRejectingFile(file)}
                                          >
                                            <XCircle className="w-3 h-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectingFile} onOpenChange={(open) => !open && setRejectingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject File</DialogTitle>
            <DialogDescription>
              Please provide feedback on why this file is being rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              File: <span className="text-foreground">{rejectingFile?.file_name}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Task: <span className="text-foreground">{rejectingFile?.task_name}</span>
            </p>
          </div>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingFile(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectComment.trim() || rejectFile.isPending}
            >
              Reject with Reason
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
