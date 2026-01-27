import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Approval {
  id: string;
  project_id: string;
  approval_type: string;
  status: string;
  comments: string | null;
  requested_by: string;
  requested_at: string;
  approved_by: string | null;
  responded_at: string | null;
  project?: {
    id: string;
    client_name: string;
    status: string;
  };
  requester?: {
    id: string;
    name: string;
  };
  responder?: {
    id: string;
    name: string;
  };
}

export const useApprovals = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const approvalsQuery = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          project:projects(id, client_name, status)
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Fetch requester and responder names
      const userIds = new Set<string>();
      data?.forEach(a => {
        if (a.requested_by) userIds.add(a.requested_by);
        if (a.approved_by) userIds.add(a.approved_by);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data?.map(approval => ({
        ...approval,
        requester: profileMap.get(approval.requested_by),
        responder: approval.approved_by ? profileMap.get(approval.approved_by) : undefined,
      })) as Approval[];
    },
  });

  const requestApproval = useMutation({
    mutationFn: async ({ projectId, approvalType }: { projectId: string; approvalType: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('approvals')
        .insert({
          project_id: projectId,
          approval_type: approvalType,
          requested_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Approval requested', description: 'Your request has been submitted.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const approveRequest = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('approvals')
        .update({
          status: 'approved',
          approved_by: user.id,
          responded_at: new Date().toISOString(),
          comments: comments || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Approved', description: 'Request has been approved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('approvals')
        .update({
          status: 'rejected',
          approved_by: user.id,
          responded_at: new Date().toISOString(),
          comments,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Rejected', description: 'Request has been rejected with feedback.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const pendingCount = approvalsQuery.data?.filter(a => a.status === 'pending').length ?? 0;

  return {
    approvals: approvalsQuery.data ?? [],
    isLoading: approvalsQuery.isLoading,
    error: approvalsQuery.error,
    pendingCount,
    requestApproval,
    approveRequest,
    rejectRequest,
    refetch: approvalsQuery.refetch,
  };
};
