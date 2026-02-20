import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FileImage,
  Loader2,
  Download,
  Clock,
  XCircle,
  CheckCircle2,
  FolderOpen,
  X,
  Trash2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface UploadedFile {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
}

interface TaskFileUploadProps {
  taskId: string;
  taskType: 'design' | 'execution';
  existingFiles?: UploadedFile[];
  onUploadComplete?: () => void;
  compact?: boolean;
}

export const TaskFileUpload: React.FC<TaskFileUploadProps> = ({
  taskId,
  taskType,
  existingFiles = [],
  onUploadComplete,
  compact = false,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin, isDesignHead, isExecutionManager } = useUserRole();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dbFiles, setDbFiles] = useState<UploadedFile[]>([]);
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rejectDialogFile, setRejectDialogFile] = useState<UploadedFile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const bucketName = taskType === 'design' ? 'design-files' : 'execution-photos';
  const tableName = taskType === 'design' ? 'design_task_files' : 'execution_task_photos';
  const fileNameColumn = taskType === 'design' ? 'file_name' : 'caption';
  const urlColumn = taskType === 'design' ? 'file_url' : 'photo_url';

  // Who can approve/reject/remove
  const canManage = isAdmin || 
    (taskType === 'design' && isDesignHead) || 
    (taskType === 'execution' && isExecutionManager);

  // Fetch files and subscribe to realtime updates
  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from(tableName)
      .select(`id, uploaded_at, approval_status, rejection_reason, ${fileNameColumn}, ${urlColumn}`)
      .eq('task_id', taskId)
      .order('uploaded_at', { ascending: false });
    
    if (!error && data) {
      const mappedFiles = data.map((f: any) => ({
        id: f.id,
        file_name: f[fileNameColumn] || 'Unnamed file',
        file_url: f[urlColumn],
        uploaded_at: f.uploaded_at,
        approval_status: f.approval_status,
        rejection_reason: f.rejection_reason,
      }));
      setDbFiles(mappedFiles);
      if (mappedFiles.length > 0) {
        setLastUploadTime(mappedFiles[0].uploaded_at);
      } else {
        setLastUploadTime(null);
        setIsDialogOpen(false);
      }
    }
  };

  useEffect(() => {
    fetchFiles();

    const channel = supabase
      .channel(`${tableName}-${taskId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: `task_id=eq.${taskId}`,
      }, () => { fetchFiles(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId, tableName, taskType]);

  const hasRejectedFiles = dbFiles.some(f => f.approval_status === 'rejected');
  const hasPendingFiles = dbFiles.some(f => f.approval_status === 'pending');

  // Uploader can only upload new if no pending/rejected (must delete first)
  const canUploadNew = canManage || (!hasRejectedFiles && !hasPendingFiles);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !user) return;

    // Block upload if there are rejected files (for non-managers)
    if (!canManage && hasRejectedFiles) {
      toast({
        title: 'Delete rejected files first',
        description: 'Please delete your rejected files before uploading new ones.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        if (taskType === 'design') {
          const { error: dbError } = await supabase
            .from('design_task_files')
            .insert({ task_id: taskId, file_name: file.name, file_url: fileName, uploaded_by: user.id })
            .select().single();
          if (dbError) throw dbError;
        } else {
          const { error: dbError } = await supabase
            .from('execution_task_photos')
            .insert({ task_id: taskId, photo_url: fileName, uploaded_by: user.id, caption: file.name })
            .select().single();
          if (dbError) throw dbError;
        }

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      toast({ title: 'Upload complete', description: `${selectedFiles.length} file(s) uploaded.` });
      queryClient.invalidateQueries({ queryKey: [taskType === 'design' ? 'design_tasks' : 'execution_tasks'] });
      onUploadComplete?.();
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 60 * 60);
    return data?.signedUrl;
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      let downloadUrl = file.file_url;
      if (!file.file_url.startsWith('http')) {
        const signedUrl = await getSignedUrl(file.file_url);
        if (signedUrl) downloadUrl = signedUrl;
      }
      window.open(downloadUrl, '_blank');
    } catch {
      toast({ title: 'Download failed', description: 'Could not download the file.', variant: 'destructive' });
    }
  };

  const handleApprove = async (file: UploadedFile) => {
    setIsActioning(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ approval_status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: null })
        .eq('id', file.id);
      if (error) throw error;
      toast({ title: 'File approved ✓' });
      fetchFiles();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsActioning(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectDialogFile) return;
    setIsActioning(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ approval_status: 'rejected', approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: rejectionReason })
        .eq('id', rejectDialogFile.id);
      if (error) throw error;
      toast({ title: 'File rejected', description: 'The uploader has been notified.' });
      setRejectDialogFile(null);
      setRejectionReason('');
      fetchFiles();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async (file: UploadedFile) => {
    // Only uploader (for rejected/own files) or managers can delete
    setDeletingId(file.id);
    // Optimistically remove from local state immediately
    setDbFiles(prev => prev.filter(f => f.id !== file.id));
    if (dbFiles.filter(f => f.id !== file.id).length === 0) {
      setLastUploadTime(null);
    }
    try {
      // Delete from storage
      if (!file.file_url.startsWith('http')) {
        await supabase.storage.from(bucketName).remove([file.file_url]);
      }
      // Delete from DB
      const { error } = await supabase.from(tableName).delete().eq('id', file.id);
      if (error) throw error;
      toast({ title: 'File removed', description: 'The file has been permanently deleted.' });
      queryClient.invalidateQueries({ queryKey: ['file_approvals'] });
      queryClient.invalidateQueries({ queryKey: [taskType === 'design' ? 'design_tasks' : 'execution_tasks'] });
    } catch (e: any) {
      // Revert optimistic update on error
      fetchFiles();
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (file: UploadedFile) => {
    if (!file.approval_status) return null;
    return (
      <Badge 
        variant={file.approval_status === 'approved' ? 'default' : file.approval_status === 'rejected' ? 'destructive' : 'secondary'}
        className="text-xs shrink-0"
      >
        {file.approval_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
        {file.approval_status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
        {file.approval_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
        {file.approval_status}
      </Badge>
    );
  };

  if (compact) {
    const hasFiles = dbFiles.length > 0;
    
    return (
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={taskType === 'design' ? 'image/*,.pdf,.dwg' : 'image/*,video/*'}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {hasFiles ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 text-xs border rounded-md bg-background hover:bg-muted/50 transition-colors"
            >
              <FolderOpen className="w-3 h-3" />
              Open
              {lastUploadTime && (
                <span className="text-muted-foreground hidden sm:inline">
                  ({format(new Date(lastUploadTime), 'dd MMM, HH:mm')})
                </span>
              )}
            </button>
            <DialogContent className="max-w-md w-[95vw]">
              <DialogHeader>
                <DialogTitle>Uploaded Files ({dbFiles.length})</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {dbFiles.map((file) => (
                  <div key={file.id} className="rounded-lg bg-muted/30 border overflow-hidden">
                    <div className="flex items-center gap-2 p-2">
                      <FileImage className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(file.uploaded_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                      {statusBadge(file)}
                    </div>

                    {/* Rejection reason display */}
                    {file.approval_status === 'rejected' && file.rejection_reason && (
                      <div className="px-3 pb-2">
                        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                          ✗ {file.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Action buttons row */}
                    <div className="flex items-center gap-1 px-2 pb-2">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownload(file)}>
                        <Download className="w-3 h-3" />
                      </Button>

                      {/* Manager: approve / reject / remove */}
                      {canManage && file.approval_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-success hover:bg-success/90 text-white"
                            onClick={() => handleApprove(file)}
                            disabled={isActioning}
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2"
                            onClick={() => { setRejectDialogFile(file); setRejectionReason(''); }}
                            disabled={isActioning}
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {/* Manager: remove button */}
                      {canManage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive ml-auto"
                          onClick={() => handleDelete(file)}
                          disabled={deletingId === file.id}
                        >
                          {deletingId === file.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      )}

                      {/* Uploader: can delete own rejected files */}
                      {!canManage && file.approval_status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive ml-auto gap-1"
                          onClick={() => handleDelete(file)}
                          disabled={deletingId === file.id}
                        >
                          {deletingId === file.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Delete & Re-upload
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Upload more - blocked if rejected */}
                {canUploadNew ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full mt-2"
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                    Upload More
                  </Button>
                ) : (
                  <div className="text-xs text-destructive text-center py-2 bg-destructive/5 rounded border border-destructive/20">
                    Delete rejected files before uploading new ones
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8"
          >
            {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            Upload
          </Button>
        )}

        {/* Reject reason dialog */}
        <Dialog open={!!rejectDialogFile} onOpenChange={(o) => !o && setRejectDialogFile(null)}>
          <DialogContent className="max-w-sm w-[95vw]">
            <DialogHeader>
              <DialogTitle>Reject File</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Give a reason so the uploader knows what to fix:</p>
            <Textarea
              placeholder="e.g. Wrong dimensions, needs revision..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[80px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogFile(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || isActioning}>
                {isActioning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={taskType === 'design' ? 'image/*,.pdf,.dwg' : 'image/*,video/*'}
        onChange={handleFileSelect}
        className="hidden"
      />

      {canUploadNew && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
            isUploading ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload {taskType === 'design' ? 'design files' : 'photos'}
              </p>
            </div>
          )}
        </div>
      )}

      {!canUploadNew && (
        <div className="border-2 border-dashed border-destructive/30 rounded-lg p-4 text-center bg-destructive/5">
          <XCircle className="w-5 h-5 mx-auto mb-1 text-destructive" />
          <p className="text-sm text-destructive">Delete your rejected files before uploading new ones.</p>
        </div>
      )}

      {dbFiles.length > 0 && (
        <div className="space-y-2">
          {dbFiles.map((file) => (
            <div key={file.id} className="rounded-lg bg-muted/30 border overflow-hidden">
              <div className="flex items-center gap-2 p-3">
                <FileImage className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(file.uploaded_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
                {statusBadge(file)}
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDownload(file)}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
              {file.approval_status === 'rejected' && file.rejection_reason && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">✗ {file.rejection_reason}</p>
                </div>
              )}
              <div className="flex items-center gap-1 px-2 pb-2">
                {canManage && file.approval_status === 'pending' && (
                  <>
                    <Button size="sm" className="h-7 px-2 bg-success hover:bg-success/90 text-white" onClick={() => handleApprove(file)} disabled={isActioning}>
                      <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => { setRejectDialogFile(file); setRejectionReason(''); }} disabled={isActioning}>
                      <ThumbsDown className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {canManage && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive ml-auto" onClick={() => handleDelete(file)} disabled={deletingId === file.id}>
                    {deletingId === file.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                )}
                {!canManage && file.approval_status === 'rejected' && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive ml-auto gap-1" onClick={() => handleDelete(file)} disabled={deletingId === file.id}>
                    {deletingId === file.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete & Re-upload
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rejectDialogFile} onOpenChange={(o) => !o && setRejectDialogFile(null)}>
        <DialogContent className="max-w-sm w-[95vw]">
          <DialogHeader>
            <DialogTitle>Reject File</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Give a reason so the uploader knows what to fix:</p>
          <Textarea
            placeholder="e.g. Wrong dimensions, needs revision..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogFile(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || isActioning}>
              {isActioning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
