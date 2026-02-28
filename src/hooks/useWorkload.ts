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

      // Build workload map - track unique (user_id, project_id) pairs to avoid double-counting
      const assignmentSet = new Set<string>();
      const workloadMap = new Map<string, number>();

      const addAssignment = (userId: string, projectId: string) => {
        const key = `${userId}:${projectId}`;
        if (assignmentSet.has(key)) return;
        assignmentSet.add(key);
        const currentCount = workloadMap.get(userId) || 0;
        workloadMap.set(userId, currentCount + 1);
      };

      // Count project_team assignments
      teamData?.forEach(item => {
        if (!roles || roles.includes(item.role)) {
          addAssignment(item.user_id, item.project_id);
        }
      });

      // Count direct head assignments from projects (design_head_id only, since execution_manager is now in project_team)
      projectData?.forEach(project => {
        if (project.design_head_id) {
          addAssignment(project.design_head_id, project.id);
        }
        // Still count execution_manager_id for backward compat
        if (project.execution_manager_id) {
          addAssignment(project.execution_manager_id, project.id);
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
