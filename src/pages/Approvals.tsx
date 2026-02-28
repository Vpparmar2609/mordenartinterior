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
  Download,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useFileApprovals, FileApproval } from '@/hooks/useFileApprovals';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Approvals: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingFile, setRejectingFile] = useState<FileApproval | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<FileApproval | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  

  const { approvals, isLoading, pendingCount, approveFile, rejectFile, deleteFile, refetch } = useFileApprovals();
  const { toast } = useToast();

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      return filter === 'all' || approval.approval_status === filter;
    });
  }, [approvals, filter]);

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
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });
  };

  const toggleTask = (taskKey: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(taskKey) ? next.delete(taskKey) : next.add(taskKey);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-success/20 text-success border-0 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      default:
        return <Badge className="bg-destructive/20 text-destructive border-0 text-xs"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
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
    setPreviewFile(file);
    setPreviewUrl(null);
    setPreviewLoading(true);
    const url = await getFileUrl(file);
    setPreviewUrl(url || null);
    setPreviewLoading(false);
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

  const handleRemoveFile = (file: FileApproval) => {
    deleteFile.mutate({ id: file.id, type: file.type, fileUrl: file.file_url });
  };

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
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">File Approvals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pendingCount} pending file{pendingCount !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
      </div>

      {/* Filters - horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className={cn("shrink-0", filter === status ? 'bg-gradient-warm' : '')}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Approvals List */}
      {Object.keys(groupedApprovals).length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No file approvals found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedApprovals).map(([projectId, projectData], projectIndex) => {
            const projectPendingCount = Object.values(projectData.tasks)
              .flatMap(t => t.files)
              .filter(f => f.approval_status === 'pending').length;
            const isProjectExpanded = expandedProjects.has(projectId);

            return (
              <Card key={projectId} className="glass-card animate-fade-in" style={{ animationDelay: `${projectIndex * 50}ms` }}>
                <Collapsible open={isProjectExpanded} onOpenChange={() => toggleProject(projectId)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isProjectExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                          <CardTitle className="text-base font-display truncate">{projectData.projectName}</CardTitle>
                          {projectPendingCount > 0 && (
                            <Badge className="bg-warning/20 text-warning border-0 text-xs shrink-0">{projectPendingCount}</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{Object.keys(projectData.tasks).length} task{Object.keys(projectData.tasks).length !== 1 ? 's' : ''}</span>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-3 space-y-2">
                      {Object.entries(projectData.tasks).map(([taskKey, taskData]) => {
                        const isTaskExpanded = expandedTasks.has(taskKey);
                        const taskPendingCount = taskData.files.filter(f => f.approval_status === 'pending').length;

                        return (
                          <Collapsible key={taskKey} open={isTaskExpanded} onOpenChange={() => toggleTask(taskKey)}>
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isTaskExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                  {taskData.type === 'design' ? <Palette className="w-3.5 h-3.5 text-accent shrink-0" /> : <HardHat className="w-3.5 h-3.5 text-primary shrink-0" />}
                                  <span className="font-medium text-sm truncate">{taskData.taskName}</span>
                                  {taskPendingCount > 0 && <Badge className="bg-warning/20 text-warning border-0 text-xs shrink-0">{taskPendingCount}</Badge>}
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">{taskData.files.length}</span>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="mt-1 ml-2 space-y-2">
                              {taskData.files.map((file) => (
                                <div
                                  key={file.id}
                                  className={cn(
                                    "rounded-lg border overflow-hidden",
                                    file.approval_status === 'pending' && 'border-warning/30 bg-warning/5',
                                    file.approval_status === 'approved' && 'border-success/30 bg-success/5',
                                    file.approval_status === 'rejected' && 'border-destructive/30 bg-destructive/5'
                                  )}
                                >
                                  {/* File info */}
                                  <div className="flex items-start gap-2 p-2">
                                    <FileImage className="w-6 h-6 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{file.file_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {file.uploader?.name || 'Unknown'} • {new Date(file.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      {file.rejection_reason && (
                                        <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                          {file.rejection_reason}
                                        </p>
                                      )}
                                    </div>
                                    {getStatusBadge(file.approval_status)}
                                  </div>

                                  {/* Action buttons - full width row on mobile */}
                                  <div className="flex flex-wrap gap-1 px-2 pb-2">
                                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => handlePreview(file)}>
                                      <Eye className="w-3 h-3 mr-1" /> View
                                    </Button>
                                    {file.approval_status === 'approved' ? (
                                      <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => handleDownload(file)}>
                                        <Download className="w-3 h-3 mr-1" /> Save
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="outline" className="h-8 px-3 text-xs opacity-50 cursor-not-allowed" disabled>
                                        <Lock className="w-3 h-3 mr-1" /> Save
                                      </Button>
                                    )}
                                    {file.approval_status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          className="h-8 px-3 text-xs bg-success hover:bg-success/90 text-white"
                                          onClick={() => handleApprove(file)}
                                          disabled={approveFile.isPending}
                                        >
                                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-8 px-3 text-xs"
                                          onClick={() => setRejectingFile(file)}
                                          disabled={rejectFile.isPending}
                                        >
                                          <XCircle className="w-3 h-3 mr-1" /> Reject
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive ml-auto"
                                      onClick={() => handleRemoveFile(file)}
                                      disabled={deleteFile.isPending}
                                    >
                                      {deleteFile.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </Button>
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

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle className="truncate text-sm">{previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {previewLoading ? (
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt={previewFile?.file_name} className="w-full max-h-[60vh] object-contain rounded-lg" />
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                <p className="text-muted-foreground text-sm">Preview not available</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            {previewFile && getStatusBadge(previewFile.approval_status)}
            {previewFile && previewFile.approval_status === 'pending' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRejectingFile(previewFile); setPreviewFile(null); }}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button size="sm" className="bg-success hover:bg-success/90 text-white" onClick={() => { handleApprove(previewFile!); setPreviewFile(null); }}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingFile} onOpenChange={(open) => !open && setRejectingFile(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Reject File</DialogTitle>
            <DialogDescription>Please provide feedback on why this file is being rejected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">File: <span className="text-foreground">{rejectingFile?.file_name}</span></p>
          </div>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejectingFile(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={!rejectComment.trim() || rejectFile.isPending}>
              {rejectFile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reject File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
