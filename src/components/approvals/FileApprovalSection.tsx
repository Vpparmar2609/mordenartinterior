import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import {
  usePendingDesignFiles,
  usePendingExecutionPhotos,
  useFileApproval,
  PendingFile,
} from '@/hooks/useFileApproval';
import { useUserRole } from '@/hooks/useUserRole';
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileImage,
  Clock,
  Loader2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FileApprovalSectionProps {
  type: 'design' | 'execution';
  projectId?: string;
}

export const FileApprovalSection: React.FC<FileApprovalSectionProps> = ({
  type,
  projectId,
}) => {
  const { isAdmin, isDesignHead, isExecutionManager } = useUserRole();
  const [selectedFile, setSelectedFile] = useState<PendingFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [fileToReject, setFileToReject] = useState<PendingFile | null>(null);

  const { data: designFiles, isLoading: designLoading } = usePendingDesignFiles();
  const { data: executionPhotos, isLoading: executionLoading } = usePendingExecutionPhotos();
  const { approveDesignFile, approveExecutionPhoto } = useFileApproval();

  const canApprove = type === 'design' 
    ? (isAdmin || isDesignHead)
    : (isAdmin || isExecutionManager);

  const files = type === 'design' ? designFiles : executionPhotos;
  const isLoading = type === 'design' ? designLoading : executionLoading;

  // Filter by project if specified
  const filteredFiles = projectId 
    ? files?.filter(f => f.project_id === projectId)
    : files;

  const pendingFiles = filteredFiles?.filter(f => f.approval_status === 'pending') || [];
  const approvedFiles = filteredFiles?.filter(f => f.approval_status === 'approved') || [];
  const rejectedFiles = filteredFiles?.filter(f => f.approval_status === 'rejected') || [];

  const bucketName = type === 'design' ? 'design-files' : 'execution-photos';

  const handlePreview = async (file: PendingFile) => {
    setSelectedFile(file);
    try {
      const { data } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(file.file_url, 60 * 60);
      setPreviewUrl(data?.signedUrl || null);
    } catch {
      setPreviewUrl(null);
    }
  };

  const handleApprove = (file: PendingFile) => {
    if (type === 'design') {
      approveDesignFile.mutate({ fileId: file.id, approved: true });
    } else {
      approveExecutionPhoto.mutate({ fileId: file.id, approved: true });
    }
  };

  const handleRejectClick = (file: PendingFile) => {
    setFileToReject(file);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (!fileToReject) return;
    if (type === 'design') {
      approveDesignFile.mutate({ fileId: fileToReject.id, approved: false, rejectionReason });
    } else {
      approveExecutionPhoto.mutate({ fileId: fileToReject.id, approved: false, rejectionReason });
    }
    setShowRejectDialog(false);
    setFileToReject(null);
  };

  const handleDownload = async (file: PendingFile) => {
    try {
      const { data } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(file.file_url, 60 * 60);
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = file.file_name;
        link.click();
      }
    } catch {
      // ignore
    }
  };

  const renderFileCard = (file: PendingFile, showActions = true) => (
    <div
      key={file.id}
      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border"
    >
      <FileImage className="w-8 h-8 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {file.task_name} • {file.project_name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{file.uploader_name}</span>
          <Clock className="w-3 h-3 text-muted-foreground ml-2" />
          <span className="text-xs text-muted-foreground">
            {format(new Date(file.uploaded_at), 'MMM d, h:mm a')}
          </span>
        </div>
        {file.rejection_reason && (
          <p className="text-xs text-destructive mt-1">
            Reason: {file.rejection_reason}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => handlePreview(file)}
        >
          <Eye className="w-4 h-4" />
        </Button>
        {file.approval_status === 'approved' ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleDownload(file)}
          >
            <Download className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8 opacity-40" disabled>
            <Lock className="w-4 h-4" />
          </Button>
        )}
        {showActions && canApprove && file.approval_status === 'pending' && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-success hover:text-success"
              onClick={() => handleApprove(file)}
              disabled={approveDesignFile.isPending || approveExecutionPhoto.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleRejectClick(file)}
              disabled={approveDesignFile.isPending || approveExecutionPhoto.isPending}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            {type === 'design' ? 'Design Files' : 'Execution Photos'}
            {pendingFiles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingFiles.length} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending */}
          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-warning flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Pending Approval ({pendingFiles.length})
              </p>
              <div className="space-y-2">
                {pendingFiles.map(file => renderFileCard(file, true))}
              </div>
            </div>
          )}

          {/* Approved */}
          {approvedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-success flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Approved ({approvedFiles.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {approvedFiles.slice(0, 5).map(file => renderFileCard(file, false))}
                {approvedFiles.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{approvedFiles.length - 5} more approved files
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rejected */}
          {rejectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Rejected ({rejectedFiles.length})
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {rejectedFiles.slice(0, 3).map(file => renderFileCard(file, false))}
              </div>
            </div>
          )}

          {filteredFiles?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No files uploaded yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={selectedFile?.file_name}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                <p className="text-muted-foreground">Preview not available</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <Badge
                variant={
                  selectedFile?.approval_status === 'approved'
                    ? 'default'
                    : selectedFile?.approval_status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {selectedFile?.approval_status}
              </Badge>
            </div>
            {canApprove && selectedFile?.approval_status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedFile) handleRejectClick(selectedFile);
                    setSelectedFile(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    if (selectedFile) handleApprove(selectedFile);
                    setSelectedFile(null);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this file. This will help the uploader understand what needs to be fixed.
            </p>
            <Input
              placeholder="Rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
