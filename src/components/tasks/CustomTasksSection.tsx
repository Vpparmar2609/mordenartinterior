import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Zap, Calendar, CheckCircle2, Clock, AlertCircle, Trash2,
  Upload, FileText, Download, X, Eye, Loader2, Search,
  ListTodo, Plus, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomTasks, CustomTask } from '@/hooks/useCustomTasks';
import { useCustomTaskFiles, CustomTaskFile } from '@/hooks/useCustomTaskFiles';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { format, isPast, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomTasksSectionProps {
  category: 'designing' | 'execution' | 'account_manager';
  canCreate: boolean;
  canApprove: boolean;
  projectFilter?: string; // If set, only show tasks for this project
  showProjectGrouping?: boolean; // Group tasks by project
}

// File viewer for a single task
const TaskFileManager: React.FC<{
  task: CustomTask;
  canApprove: boolean;
  isAssignee: boolean;
}> = ({ task, canApprove, isAssignee }) => {
  const { files, isLoading, uploadFile, approveFile, rejectFile, deleteFile, getSignedUrl } = useCustomTaskFiles(task.id);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFileId, setRejectFileId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile.mutate({ taskId: task.id, file });
    e.target.value = '';
  };

  const handleView = async (fileUrl: string) => {
    try {
      const url = await getSignedUrl(fileUrl);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to open file');
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectFile.mutate({ fileId: rejectFileId, reason: rejectReason.trim() });
    setRejectDialogOpen(false);
    setRejectReason('');
    setRejectFileId('');
  };

  return (
    <div className="space-y-2 mt-2">
      {/* Upload button for assignee */}
      {isAssignee && task.status !== 'completed' && (
        <div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="*/*" />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadFile.isPending}
          >
            {uploadFile.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload File
          </Button>
        </div>
      )}

      {/* File list */}
      {isLoading ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading files...
        </div>
      ) : files.length > 0 ? (
        <div className="space-y-1.5">
          {files.map(file => (
            <div key={file.id} className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-xs border",
              file.approval_status === 'approved' ? 'border-success/30 bg-success/5' :
              file.approval_status === 'rejected' ? 'border-destructive/30 bg-destructive/5' :
              'border-border/50 bg-muted/20'
            )}>
              <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{file.file_name}</span>
              
              <Badge className={cn(
                'border-0 text-[10px] shrink-0',
                file.approval_status === 'approved' ? 'bg-success/20 text-success' :
                file.approval_status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                'bg-warning/20 text-warning'
              )}>
                {file.approval_status}
              </Badge>

              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleView(file.file_url)}>
                  <Eye className="w-3 h-3" />
                </Button>
                
                {canApprove && file.approval_status === 'pending' && (
                  <>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-success hover:text-success"
                      onClick={() => approveFile.mutate({ fileId: file.id, taskId: task.id })}
                      disabled={approveFile.isPending}>
                      <CheckCircle2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => { setRejectFileId(file.id); setRejectDialogOpen(true); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                )}

                {(canApprove || isAssignee) && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteFile.mutate({ fileId: file.id, fileUrl: file.file_url })}
                    disabled={deleteFile.isPending}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {file.rejection_reason && (
                <p className="text-[10px] text-destructive w-full mt-1">Reason: {file.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject File</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason *</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this was rejected..." rows={3} />
            </div>
            <Button onClick={handleReject} disabled={!rejectReason.trim() || rejectFile.isPending} className="w-full">
              {rejectFile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const CustomTasksSection: React.FC<CustomTasksSectionProps> = ({
  category,
  canCreate,
  canApprove,
  projectFilter,
  showProjectGrouping = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  const { tasks, isLoading, updateTask, deleteTask } = useCustomTasks();
  const { projects } = useProjects();
  const { users } = useUsers();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Filter by category and optionally project
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => t.category === category);
    
    if (projectFilter) {
      result = result.filter(t => t.project_id === projectFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }

    // Urgent first, then pending, then completed
    result.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [tasks, category, projectFilter, searchQuery]);

  // Group by project
  const groupedByProject = useMemo(() => {
    if (!showProjectGrouping) return null;
    const groups: Record<string, { project: any; tasks: CustomTask[]; stats: { total: number; completed: number; urgent: number } }> = {};
    
    filteredTasks.forEach(task => {
      if (!groups[task.project_id]) {
        const project = projects.find(p => p.id === task.project_id);
        groups[task.project_id] = {
          project,
          tasks: [],
          stats: { total: 0, completed: 0, urgent: 0 },
        };
      }
      groups[task.project_id].tasks.push(task);
      groups[task.project_id].stats.total++;
      if (task.status === 'completed') groups[task.project_id].stats.completed++;
      if (task.priority === 'urgent' && task.status !== 'completed') groups[task.project_id].stats.urgent++;
    });

    return Object.entries(groups);
  }, [filteredTasks, projects, showProjectGrouping]);

  const getUserName = (userId: string, task: CustomTask) => {
    if (task.assigned_profile?.name) return task.assigned_profile.name;
    const u = users.find(x => x.id === userId);
    return u?.name || 'Unknown';
  };

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Stats
  const stats = useMemo(() => ({
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    pending: filteredTasks.filter(t => t.status !== 'completed').length,
    urgent: filteredTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
  }), [filteredTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderTaskCard = (task: CustomTask) => {
    const isExpanded = expandedTasks.includes(task.id);
    const isAssignee = user?.id === task.assigned_to;
    const isOverdue = task.due_date && task.status !== 'completed' && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    const name = getUserName(task.assigned_to, task);

    return (
      <div
        key={task.id}
        className={cn(
          "border rounded-lg overflow-hidden transition-all",
          task.priority === 'urgent' && task.status !== 'completed' && 'border-destructive/40',
          task.status === 'completed' && 'opacity-60'
        )}
      >
        <div
          className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleTask(task.id)}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn("font-medium text-sm", task.status === 'completed' && 'line-through text-muted-foreground')}>
                {task.title}
              </h4>
              <div className="flex items-center gap-1 shrink-0">
                {task.priority === 'urgent' && task.status !== 'completed' && (
                  <Badge className="bg-destructive/20 text-destructive border-0 text-[10px] gap-0.5 animate-pulse">
                    <Zap className="w-2.5 h-2.5" /> Urgent
                  </Badge>
                )}
                <Badge className={cn(
                  'border-0 text-[10px]',
                  task.status === 'completed' ? 'bg-success/20 text-success' :
                  task.status === 'in_progress' ? 'bg-warning/20 text-warning' :
                  'bg-muted text-muted-foreground'
                )}>
                  {task.status === 'completed' ? 'Closed' : task.status === 'in_progress' ? 'In Progress' : 'Open'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Avatar className="w-4 h-4">
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                {name}
              </div>
              {task.due_date && (
                <div className={cn("flex items-center gap-1 text-xs", isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.due_date), 'dd MMM')}
                  {isOverdue && ' (overdue)'}
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border/30 p-3 bg-background/50 space-y-2">
            {task.description && (
              <p className="text-xs text-muted-foreground">{task.description}</p>
            )}

            {/* File management */}
            <TaskFileManager task={task} canApprove={canApprove} isAssignee={isAssignee} />

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              {canApprove && task.status !== 'completed' && (
                <Button size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => updateTask.mutate({ id: task.id, status: 'completed' })}
                  disabled={updateTask.isPending}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Close Task
                </Button>
              )}
              {canApprove && task.status === 'completed' && (
                <Button size="sm" variant="ghost" className="h-7 text-xs"
                  onClick={() => updateTask.mutate({ id: task.id, status: 'pending' })}
                  disabled={updateTask.isPending}>
                  <Clock className="w-3 h-3 mr-1" /> Reopen
                </Button>
              )}
              {(isAdmin || canApprove) && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => deleteTask.mutate(task.id)}
                  disabled={deleteTask.isPending}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'text-primary' },
          { label: 'Open', value: stats.pending, color: 'text-warning' },
          { label: 'Closed', value: stats.completed, color: 'text-success' },
          { label: 'Urgent', value: stats.urgent, color: 'text-destructive' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <span className={cn("text-lg font-bold", s.color)}>{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-30" />
          No tasks found
        </div>
      ) : showProjectGrouping && groupedByProject ? (
        <div className="space-y-4">
          {groupedByProject.map(([projectId, group]) => (
            <Card key={projectId} className="glass-card">
              <CardHeader
                className="cursor-pointer hover:bg-muted/30 transition-colors py-3"
                onClick={() => toggleProject(projectId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedProjects.includes(projectId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <CardTitle className="text-base">{group.project?.client_name || 'Unknown'}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{group.stats.completed}/{group.stats.total} done</Badge>
                    {group.stats.urgent > 0 && (
                      <Badge className="bg-destructive/20 text-destructive border-0 text-xs gap-0.5">
                        <Zap className="w-3 h-3" /> {group.stats.urgent}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedProjects.includes(projectId) && (
                <CardContent className="pt-0 space-y-2">
                  {group.tasks.map(renderTaskCard)}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(renderTaskCard)}
        </div>
      )}
    </div>
  );
};
