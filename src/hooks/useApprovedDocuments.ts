import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ApprovedDocument {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  uploaded_by: string;
  task_name: string;
  project_name: string;
  project_id: string;
  type: 'design' | 'execution';
}

export const useApprovedDocuments = () => {
  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['approved-documents'],
    queryFn: async () => {
      // Fetch design task files from completed tasks
      const { data: designFiles, error: designError } = await supabase
        .from('design_task_files')
        .select(`
          id,
          file_name,
          file_url,
          uploaded_at,
          uploaded_by,
          task_id,
          design_tasks!inner (
            id,
            name,
            status,
            project_id,
            projects!inner (
              id,
              client_name,
              location
            )
          )
        `)
        .eq('design_tasks.status', 'completed');

      if (designError) throw designError;

      // Fetch execution task photos from completed tasks
      const { data: executionPhotos, error: execError } = await supabase
        .from('execution_task_photos')
        .select(`
          id,
          photo_url,
          caption,
          uploaded_at,
          uploaded_by,
          task_id,
          execution_tasks!inner (
            id,
            name,
            status,
            project_id,
            projects!inner (
              id,
              client_name,
              location
            )
          )
        `)
        .eq('execution_tasks.status', 'completed');

      if (execError) throw execError;

      // Transform design files
      const designDocs: ApprovedDocument[] = (designFiles || []).map((file: any) => ({
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url,
        uploaded_at: file.uploaded_at,
        uploaded_by: file.uploaded_by,
        task_name: file.design_tasks.name,
        project_name: `${file.design_tasks.projects.client_name} - ${file.design_tasks.projects.location}`,
        project_id: file.design_tasks.project_id,
        type: 'design' as const,
      }));

      // Transform execution photos
      const execDocs: ApprovedDocument[] = (executionPhotos || []).map((photo: any) => ({
        id: photo.id,
        file_name: photo.caption || 'Site Photo',
        file_url: photo.photo_url,
        uploaded_at: photo.uploaded_at,
        uploaded_by: photo.uploaded_by,
        task_name: photo.execution_tasks.name,
        project_name: `${photo.execution_tasks.projects.client_name} - ${photo.execution_tasks.projects.location}`,
        project_id: photo.execution_tasks.project_id,
        type: 'execution' as const,
      }));

      // Combine and sort by date (newest first)
      return [...designDocs, ...execDocs].sort(
        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
    },
  });

  return { documents, isLoading, error, refetch };
};
