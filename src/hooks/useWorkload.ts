import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface WorkloadData {
  userId: string;
  projectCount: number;
}

export const useWorkload = (roles?: AppRole[]) => {
  const workloadQuery = useQuery({
    queryKey: ['workload', roles],
    queryFn: async () => {
      // Get all project team assignments
      const { data: teamData, error: teamError } = await supabase
        .from('project_team')
        .select('user_id, role, project_id');

      if (teamError) throw teamError;

      // Also get direct assignments from projects table
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, design_head_id, execution_manager_id')
        .not('status', 'eq', 'completed');

      if (projectError) throw projectError;

      // Build workload map
      const workloadMap = new Map<string, number>();

      // Count project_team assignments
      teamData?.forEach(item => {
        if (!roles || roles.includes(item.role)) {
          const currentCount = workloadMap.get(item.user_id) || 0;
          workloadMap.set(item.user_id, currentCount + 1);
        }
      });

      // Count direct head assignments from projects
      projectData?.forEach(project => {
        if (project.design_head_id) {
          const currentCount = workloadMap.get(project.design_head_id) || 0;
          workloadMap.set(project.design_head_id, currentCount + 1);
        }
        if (project.execution_manager_id) {
          const currentCount = workloadMap.get(project.execution_manager_id) || 0;
          workloadMap.set(project.execution_manager_id, currentCount + 1);
        }
      });

      // Convert to array
      const result: WorkloadData[] = Array.from(workloadMap.entries()).map(([userId, projectCount]) => ({
        userId,
        projectCount,
      }));

      return result;
    },
  });

  const getWorkloadForUser = (userId: string): number => {
    const entry = workloadQuery.data?.find(w => w.userId === userId);
    return entry?.projectCount ?? 0;
  };

  return {
    workloads: workloadQuery.data ?? [],
    isLoading: workloadQuery.isLoading,
    error: workloadQuery.error,
    getWorkloadForUser,
    refetch: workloadQuery.refetch,
  };
};
