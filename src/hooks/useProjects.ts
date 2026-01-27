import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type ProjectStatus = Database['public']['Enums']['project_status'];

export interface ProjectWithDetails extends Project {
  design_head_profile?: { id: string; name: string; email: string } | null;
  execution_head_profile?: { id: string; name: string; email: string } | null;
}

export const useProjects = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects', user?.id, role],
    queryFn: async () => {
      // First get projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Then get profiles for design_head_id and execution_head_id
      const headIds = [
        ...new Set([
          ...projects.filter(p => p.design_head_id).map(p => p.design_head_id),
          ...projects.filter(p => p.execution_head_id).map(p => p.execution_head_id),
        ].filter(Boolean) as string[])
      ];

      let profiles: Record<string, { id: string; name: string; email: string }> = {};
      if (headIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', headIds);
        
        if (profilesData) {
          profiles = profilesData.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, { id: string; name: string; email: string }>);
        }
      }

      return projects.map(p => ({
        ...p,
        design_head_profile: p.design_head_id ? profiles[p.design_head_id] : null,
        execution_head_profile: p.execution_head_id ? profiles[p.execution_head_id] : null,
      })) as ProjectWithDetails[];
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<ProjectInsert, 'created_by'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project created',
        description: 'New project has been created successfully.',
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

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project updated',
        description: 'Project has been updated successfully.',
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

  const updateProjectStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProjectStatus }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject,
    updateProject,
    updateProjectStatus,
    refetch: projectsQuery.refetch,
  };
};

export const useProjectStats = () => {
  const { projects, isLoading } = useProjects();

  const stats = {
    total: projects.length,
    active: projects.filter(p => !['completed', 'lead'].includes(p.status)).length,
    designPending: projects.filter(p => p.status.includes('design')).length,
    inExecution: projects.filter(p => ['execution_started', 'work_in_progress', 'finishing'].includes(p.status)).length,
    nearCompletion: projects.filter(p => p.progress >= 80 && p.status !== 'completed').length,
    completed: projects.filter(p => p.status === 'completed').length,
    leads: projects.filter(p => p.status === 'lead').length,
  };

  return { stats, isLoading };
};
