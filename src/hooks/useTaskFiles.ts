import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskFile {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  task_id: string;
  task_name?: string;
}

// Fetch design files for a project
export const useDesignFiles = (projectId?: string) => {
  return useQuery({
    queryKey: ['design_files', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('design_task_files')
        .select(`
          id,
          file_name,
          file_url,
          uploaded_at,
          task_id,
          design_tasks!inner(name, project_id)
        `)
        .eq('design_tasks.project_id', projectId);

      if (error) throw error;

      return (data || []).map((f: any) => ({
        id: f.id,
        file_name: f.file_name,
        file_url: f.file_url,
        uploaded_at: f.uploaded_at,
        task_id: f.task_id,
        task_name: f.design_tasks?.name,
      })) as TaskFile[];
    },
    enabled: !!projectId,
  });
};

// Fetch execution photos for a project
export const useExecutionPhotos = (projectId?: string) => {
  return useQuery({
    queryKey: ['execution_photos', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('execution_task_photos')
        .select(`
          id,
          photo_url,
          caption,
          uploaded_at,
          task_id,
          execution_tasks!inner(name, project_id)
        `)
        .eq('execution_tasks.project_id', projectId);

      if (error) throw error;

      return (data || []).map((f: any) => ({
        id: f.id,
        file_name: f.caption || 'Site photo',
        file_url: f.photo_url,
        uploaded_at: f.uploaded_at,
        task_id: f.task_id,
        task_name: f.execution_tasks?.name,
      })) as TaskFile[];
    },
    enabled: !!projectId,
  });
};

// Fetch files for a specific task
export const useTaskFilesForTask = (taskId: string, taskType: 'design' | 'execution') => {
  return useQuery({
    queryKey: [taskType === 'design' ? 'design_task_files' : 'execution_task_photos', taskId],
    queryFn: async () => {
      if (taskType === 'design') {
        const { data, error } = await supabase
          .from('design_task_files')
          .select('id, file_name, file_url, uploaded_at')
          .eq('task_id', taskId);
        if (error) throw error;
        return data || [];
      } else {
        const { data, error } = await supabase
          .from('execution_task_photos')
          .select('id, caption, photo_url, uploaded_at')
          .eq('task_id', taskId);
        if (error) throw error;
        return (data || []).map((p) => ({
          id: p.id,
          file_name: p.caption || 'Photo',
          file_url: p.photo_url,
          uploaded_at: p.uploaded_at,
        }));
      }
    },
    enabled: !!taskId,
  });
};
