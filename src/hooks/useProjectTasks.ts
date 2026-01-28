import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DesignTask = Database['public']['Tables']['design_tasks']['Row'];
type ExecutionTask = Database['public']['Tables']['execution_tasks']['Row'];
type TaskStatus = Database['public']['Enums']['task_status'];

export const useDesignTasks = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['design_tasks', projectId],
    queryFn: async () => {
      let query = supabase
        .from('design_tasks')
        .select('*')
        .order('order_index', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DesignTask[];
    },
    enabled: projectId !== undefined,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('design_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design_tasks'] });
      toast({ title: 'Task updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    updateTask,
    refetch: tasksQuery.refetch,
  };
};

export const useExecutionTasks = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['execution_tasks', projectId],
    queryFn: async () => {
      let query = supabase
        .from('execution_tasks')
        .select('*')
        .order('order_index', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExecutionTask[];
    },
    enabled: projectId !== undefined,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('execution_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution_tasks'] });
      toast({ title: 'Task updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    updateTask,
    refetch: tasksQuery.refetch,
  };
};

// Fetch all design tasks across projects that the current user can view
export const useAllDesignTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['design_tasks_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_tasks')
        .select('*, projects(id, client_name)')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('design_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design_tasks_all'] });
      toast({ title: 'Task updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    updateTask,
    refetch: tasksQuery.refetch,
  };
};

// Fetch all execution tasks across projects that the current user can view
export const useAllExecutionTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['execution_tasks_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('execution_tasks')
        .select('*, projects(id, client_name)')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('execution_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution_tasks_all'] });
      toast({ title: 'Task updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    updateTask,
    refetch: tasksQuery.refetch,
  };
};
