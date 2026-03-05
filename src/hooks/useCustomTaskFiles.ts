import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomTaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
}

export function useCustomTaskFiles(taskId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['custom-task-files', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('custom_task_files')
        .select('*')
        .eq('task_id', taskId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CustomTaskFile[];
    },
    enabled: !!taskId && !!user,
  });

  const uploadFile = useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      if (!user) throw new Error('Not authenticated');
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${taskId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('task-files').getPublicUrl(filePath);
      
      const { error: insertError } = await supabase
        .from('custom_task_files')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_url: filePath,
          uploaded_by: user.id,
        } as any);
      if (insertError) throw insertError;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['custom-task-files', vars.taskId] });
      queryClient.invalidateQueries({ queryKey: ['custom-tasks'] });
      toast.success('File uploaded successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Upload failed'),
  });

  const approveFile = useMutation({
    mutationFn: async ({ fileId, taskId: tId }: { fileId: string; taskId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('custom_task_files')
        .update({
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', fileId);
      if (error) throw error;

      // Auto-close the task when file is approved
      const { error: taskError } = await supabase
        .from('custom_tasks')
        .update({
          status: 'completed',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', tId);
      if (taskError) throw taskError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-task-files'] });
      queryClient.invalidateQueries({ queryKey: ['custom-tasks'] });
      toast.success('File approved & task closed');
    },
    onError: (err: any) => toast.error(err.message || 'Approval failed'),
  });

  const rejectFile = useMutation({
    mutationFn: async ({ fileId, reason }: { fileId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('custom_task_files')
        .update({
          approval_status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        } as any)
        .eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-task-files'] });
      toast.success('File rejected');
    },
    onError: (err: any) => toast.error(err.message || 'Rejection failed'),
  });

  const deleteFile = useMutation({
    mutationFn: async ({ fileId, fileUrl }: { fileId: string; fileUrl: string }) => {
      // Delete from storage
      await supabase.storage.from('task-files').remove([fileUrl]);
      // Delete record
      const { error } = await supabase
        .from('custom_task_files')
        .delete()
        .eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-task-files'] });
      toast.success('File deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Delete failed'),
  });

  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('task-files')
      .createSignedUrl(filePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  };

  return { files, isLoading, uploadFile, approveFile, rejectFile, deleteFile, getSignedUrl };
}
