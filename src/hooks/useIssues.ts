import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Issue = Database['public']['Tables']['issues']['Row'];
type IssueInsert = Database['public']['Tables']['issues']['Insert'];

export interface IssueWithDetails extends Issue {
  project?: { id: string; client_name: string } | null;
  reporter?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
}

export const useIssues = (projectId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const issuesQuery = useQuery({
    queryKey: ['issues', projectId],
    queryFn: async () => {
      let query = supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: issues, error } = await query;
      if (error) throw error;

      // Get related data
      const projectIds = [...new Set(issues.map(i => i.project_id))];
      const userIds = [...new Set([
        ...issues.map(i => i.reported_by),
        ...issues.filter(i => i.assigned_to).map(i => i.assigned_to),
      ].filter(Boolean) as string[])];

      const [projectsRes, profilesRes] = await Promise.all([
        supabase.from('projects').select('id, client_name').in('id', projectIds),
        supabase.from('profiles').select('id, name').in('id', userIds),
      ]);

      const projectsMap = (projectsRes.data ?? []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { id: string; client_name: string }>);

      const profilesMap = (profilesRes.data ?? []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { id: string; name: string }>);

      return issues.map(i => ({
        ...i,
        project: projectsMap[i.project_id] ?? null,
        reporter: profilesMap[i.reported_by] ?? null,
        assignee: i.assigned_to ? profilesMap[i.assigned_to] : null,
      })) as IssueWithDetails[];
    },
    enabled: !!user,
  });

  const createIssue = useMutation({
    mutationFn: async (issue: Omit<IssueInsert, 'reported_by'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...issue,
          reported_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast({
        title: 'Issue reported',
        description: 'Issue has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateIssue = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Issue> & { id: string }) => {
      const { data, error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast({
        title: 'Issue updated',
        description: 'Issue has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    issues: issuesQuery.data ?? [],
    isLoading: issuesQuery.isLoading,
    error: issuesQuery.error,
    createIssue,
    updateIssue,
    refetch: issuesQuery.refetch,
  };
};
