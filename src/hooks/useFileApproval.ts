import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PendingFile {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  task_id: string;
  task_name: string;
  project_name: string;
  project_id: string;
  uploaded_by: string;
  uploader_name?: string;
}

// Fetch all pending design files for approval
export const usePendingDesignFiles = () => {
  return useQuery({
    queryKey: ['pending_design_files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_task_files')
        .select(`
          id,
          file_name,
          file_url,
          uploaded_at,
          approval_status,
          rejection_reason,
          task_id,
          uploaded_by,
          design_tasks!inner(name, project_id, projects!inner(client_name))
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Get uploader profiles
      const uploaderIds = [...new Set((data || []).map((f: any) => f.uploaded_by))];
      let profiles: Record<string, string> = {};
      if (uploaderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uploaderIds);
        if (profilesData) {
          profiles = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
        }
      }

      return (data || []).map((f: any) => ({
        id: f.id,
        file_name: f.file_name,
        file_url: f.file_url,
        uploaded_at: f.uploaded_at,
        approval_status: f.approval_status,
        rejection_reason: f.rejection_reason,
        task_id: f.task_id,
        task_name: f.design_tasks?.name,
        project_name: f.design_tasks?.projects?.client_name,
        project_id: f.design_tasks?.project_id,
        uploaded_by: f.uploaded_by,
        uploader_name: profiles[f.uploaded_by],
      })) as PendingFile[];
    },
  });
};

// Fetch all pending execution photos for approval
export const usePendingExecutionPhotos = () => {
  return useQuery({
    queryKey: ['pending_execution_photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('execution_task_photos')
        .select(`
          id,
          caption,
          photo_url,
          uploaded_at,
          approval_status,
          rejection_reason,
          task_id,
          uploaded_by,
          execution_tasks!inner(name, project_id, projects!inner(client_name))
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Get uploader profiles
      const uploaderIds = [...new Set((data || []).map((f: any) => f.uploaded_by))];
      let profiles: Record<string, string> = {};
      if (uploaderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uploaderIds);
        if (profilesData) {
          profiles = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
        }
      }

      return (data || []).map((f: any) => ({
        id: f.id,
        file_name: f.caption || 'Site photo',
        file_url: f.photo_url,
        uploaded_at: f.uploaded_at,
        approval_status: f.approval_status,
        rejection_reason: f.rejection_reason,
        task_id: f.task_id,
        task_name: f.execution_tasks?.name,
        project_name: f.execution_tasks?.projects?.client_name,
        project_id: f.execution_tasks?.project_id,
        uploaded_by: f.uploaded_by,
        uploader_name: profiles[f.uploaded_by],
      })) as PendingFile[];
    },
  });
};

// Approve or reject a file
export const useFileApproval = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveDesignFile = useMutation({
    mutationFn: async ({ fileId, approved, rejectionReason }: { fileId: string; approved: boolean; rejectionReason?: string }) => {
      const { error } = await supabase
        .from('design_task_files')
        .update({
          approval_status: approved ? 'approved' : 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['pending_design_files'] });
      queryClient.invalidateQueries({ queryKey: ['design_files'] });
      toast({
        title: approved ? 'File approved' : 'File rejected',
        description: `The design file has been ${approved ? 'approved' : 'rejected'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveExecutionPhoto = useMutation({
    mutationFn: async ({ fileId, approved, rejectionReason }: { fileId: string; approved: boolean; rejectionReason?: string }) => {
      const { error } = await supabase
        .from('execution_task_photos')
        .update({
          approval_status: approved ? 'approved' : 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['pending_execution_photos'] });
      queryClient.invalidateQueries({ queryKey: ['execution_photos'] });
      toast({
        title: approved ? 'Photo approved' : 'Photo rejected',
        description: `The execution photo has been ${approved ? 'approved' : 'rejected'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    approveDesignFile,
    approveExecutionPhoto,
  };
};
