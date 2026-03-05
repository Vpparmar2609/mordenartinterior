import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomTask {
  id: string;
  project_id: string;
  category: 'designing' | 'execution' | 'account_manager';
  priority: 'normal' | 'urgent';
  assigned_to: string;
  created_by: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined
  assigned_profile?: { name: string; avatar_url: string | null } | null;
  project?: { client_name: string } | null;
}

export function useCustomTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['custom-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_tasks')
        .select('*, assigned_profile:profiles!custom_tasks_assigned_to_fkey(name, avatar_url), project:projects!custom_tasks_project_id_fkey(client_name)')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback without joins if FK names don't match
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('custom_tasks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        return (fallbackData || []) as CustomTask[];
      }
      return (data || []) as unknown as CustomTask[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (task: {
      project_id: string;
      category: 'designing' | 'execution' | 'account_manager';
      priority: 'normal' | 'urgent';
      assigned_to: string;
      title: string;
      description?: string;
      due_date?: string;
    }) => {
      const { error } = await supabase
        .from('custom_tasks')
        .insert({
          ...task,
          created_by: user!.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-tasks'] });
      toast.success('Task created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create task');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string }) => {
      const { error } = await supabase
        .from('custom_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-tasks'] });
      toast.success('Task updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update task');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-tasks'] });
      toast.success('Task deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete task');
    },
  });

  return { tasks, isLoading, createTask, updateTask, deleteTask };
}
