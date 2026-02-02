import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface UrgentTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'critical';
  assigned_to: string;
  created_by: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  projects?: { client_name: string };
  assigned_user?: { name: string; email: string };
}

export const useUrgentTasks = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const tasksQuery = useQuery({
    queryKey: ['urgent_tasks', projectId],
    queryFn: async () => {
      let query = supabase
        .from('urgent_tasks')
        .select('*, projects(client_name)')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UrgentTask[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (taskData: {
      project_id: string;
      title: string;
      description?: string;
      priority: 'high' | 'critical';
      assigned_to: string;
      due_date?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('urgent_tasks')
        .insert({
          ...taskData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgent_tasks'] });
      toast({ title: 'Urgent task created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'in_progress' | 'completed' }) => {
      const { data, error } = await supabase
        .from('urgent_tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgent_tasks'] });
      toast({ title: 'Task status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('urgent_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgent_tasks'] });
      toast({ title: 'Urgent task deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask,
    updateTaskStatus,
    deleteTask,
    refetch: tasksQuery.refetch,
  };
};

// Fetch urgent tasks assigned to the current user
export const useMyUrgentTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['my_urgent_tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('urgent_tasks')
        .select('*, projects(client_name)')
        .eq('assigned_to', user.id)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as UrgentTask[];
    },
    enabled: !!user?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'in_progress' | 'completed' }) => {
      const { data, error } = await supabase
        .from('urgent_tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_urgent_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['urgent_tasks'] });
      toast({ title: 'Task status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    updateStatus,
    refetch: tasksQuery.refetch,
  };
};
