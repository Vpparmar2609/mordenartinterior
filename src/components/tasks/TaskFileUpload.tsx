import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FileImage,
  X,
  CheckCircle2,
  Loader2,
  Download,
  Trash2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);

  const bucketName = taskType === 'design' ? 'design-files' : 'execution-photos';
  const tableName = taskType === 'design' ? 'design_task_files' : 'execution_task_photos';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        // Create signed URL for private buckets
        const { data: signedData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

        const fileUrl = signedData?.signedUrl || urlData.publicUrl;

        // Insert record into database
        if (taskType === 'design') {
          const { data: fileRecord, error: dbError } = await supabase
            .from('design_task_files')
            .insert({
              task_id: taskId,
              file_name: file.name,
              file_url: fileName, // Store path, not full URL
              uploaded_by: user.id,
            })
            .select()
            .single();

          if (dbError) throw dbError;

          setFiles(prev => [...prev, {
            id: fileRecord.id,
            file_name: file.name,
            file_url: fileUrl,
            uploaded_at: fileRecord.uploaded_at,
          }]);
        } else {
          const { data: photoRecord, error: dbError } = await supabase
            .from('execution_task_photos')
            .insert({
              task_id: taskId,
              photo_url: fileName,
              uploaded_by: user.id,
              caption: file.name,
            })
            .select()
            .single();

          if (dbError) throw dbError;

          setFiles(prev => [...prev, {
            id: photoRecord.id,
            file_name: file.name,
            file_url: fileUrl,
            uploaded_at: photoRecord.uploaded_at,
          }]);
        }

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      toast({
        title: 'Upload complete',
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: [taskType === 'design' ? 'design_tasks' : 'execution_tasks'] });
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    return data?.signedUrl;
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      // file.file_url could be a path or a signed URL
      let downloadUrl = file.file_url;
      if (!file.file_url.startsWith('http')) {
        const signedUrl = await getSignedUrl(file.file_url);
        if (signedUrl) downloadUrl = signedUrl;
      }
      window.open(downloadUrl, '_blank');
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download the file.',
        variant: 'destructive',
      });
    }
  };

  if (compact) {
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-8"
        >
          {isUploading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Upload className="w-3 h-3 mr-1" />
          )}
          Upload
        </Button>
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {files.length} file{files.length > 1 ? 's' : ''}
          </span>
        )}
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

      {/* Upload area */}
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
            <p className="text-xs text-muted-foreground/60">
              {taskType === 'design' ? 'Images, PDFs, DWG files' : 'Images and videos'}
            </p>
          </div>
        )}
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Uploaded files</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
              >
                <FileImage className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm truncate flex-1">{file.file_name}</span>
                {file.approval_status && (
                  <Badge 
                    variant={
                      file.approval_status === 'approved' ? 'default' : 
                      file.approval_status === 'rejected' ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {file.approval_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                    {file.approval_status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {file.approval_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                    {file.approval_status}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
