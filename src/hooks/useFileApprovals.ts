import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FileApproval {
  id: string;
  file_name: string;
  file_url: string;
  approval_status: string;
  uploaded_at: string;
  uploaded_by: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  task_id: string;
  task_name: string;
  project_id: string;
  project_name: string;
  type: 'design' | 'execution';
  uploader?: {
    name: string;
    email: string;
  };
  approver?: {
    name: string;
    email: string;
  };
}

export const useFileApprovals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approvalsQuery = useQuery({
    queryKey: ['file_approvals'],
    queryFn: async () => {
      // Fetch design task files with task and project info
      const { data: designFiles, error: designError } = await supabase
        .from('design_task_files')
        .select(`
          *,
          design_tasks!inner(id, name, project_id, projects(id, client_name))
        `)
        .order('uploaded_at', { ascending: false });

      if (designError) throw designError;

      // Fetch execution task photos with task and project info
      const { data: executionPhotos, error: executionError } = await supabase
        .from('execution_task_photos')
        .select(`
          *,
          execution_tasks!inner(id, name, project_id, projects(id, client_name))
        `)
        .order('uploaded_at', { ascending: false });

      if (executionError) throw executionError;

      // Get all unique user IDs for fetching profiles
      const userIds = new Set<string>();
      designFiles?.forEach(f => {
        userIds.add(f.uploaded_by);
        if (f.approved_by) userIds.add(f.approved_by);
      });
      executionPhotos?.forEach(p => {
        userIds.add(p.uploaded_by);
        if (p.approved_by) userIds.add(p.approved_by);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Transform design files
      const designApprovals: FileApproval[] = (designFiles || []).map(f => ({
        id: f.id,
        file_name: f.file_name,
        file_url: f.file_url,
        approval_status: f.approval_status,
        uploaded_at: f.uploaded_at,
        uploaded_by: f.uploaded_by,
        approved_by: f.approved_by,
        approved_at: f.approved_at,
        rejection_reason: f.rejection_reason,
        task_id: f.task_id,
        task_name: f.design_tasks?.name || 'Unknown Task',
        project_id: f.design_tasks?.project_id || '',
        project_name: f.design_tasks?.projects?.client_name || 'Unknown Project',
        type: 'design' as const,
        uploader: profileMap.get(f.uploaded_by),
        approver: f.approved_by ? profileMap.get(f.approved_by) : undefined,
      }));

      // Transform execution photos
      const executionApprovals: FileApproval[] = (executionPhotos || []).map(p => ({
        id: p.id,
        file_name: p.caption || 'Site Photo',
        file_url: p.photo_url,
        approval_status: p.approval_status,
        uploaded_at: p.uploaded_at,
        uploaded_by: p.uploaded_by,
        approved_by: p.approved_by,
        approved_at: p.approved_at,
        rejection_reason: p.rejection_reason,
        task_id: p.task_id,
        task_name: p.execution_tasks?.name || 'Unknown Task',
        project_id: p.execution_tasks?.project_id || '',
        project_name: p.execution_tasks?.projects?.client_name || 'Unknown Project',
        type: 'execution' as const,
        uploader: profileMap.get(p.uploaded_by),
        approver: p.approved_by ? profileMap.get(p.approved_by) : undefined,
      }));

      return [...designApprovals, ...executionApprovals].sort(
        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
    },
  });

  const approveFile = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'design' | 'execution' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const table = type === 'design' ? 'design_task_files' : 'execution_task_photos';
      const { error } = await supabase
        .from(table)
        .update({
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_approvals'] });
      toast({ title: 'File approved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const rejectFile = useMutation({
    mutationFn: async ({ id, type, reason }: { id: string; type: 'design' | 'execution'; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const table = type === 'design' ? 'design_task_files' : 'execution_task_photos';
      const { error } = await supabase
        .from(table)
        .update({
          approval_status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_approvals'] });
      toast({ title: 'File rejected' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const pendingCount = approvalsQuery.data?.filter(a => a.approval_status === 'pending').length || 0;

  return {
    approvals: approvalsQuery.data || [],
    isLoading: approvalsQuery.isLoading,
    error: approvalsQuery.error,
    pendingCount,
    approveFile,
    rejectFile,
    refetch: approvalsQuery.refetch,
  };
};
