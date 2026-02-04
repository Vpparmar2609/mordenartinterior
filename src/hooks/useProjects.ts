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
  execution_manager_profile?: { id: string; name: string; email: string } | null;
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
      
      // Then get profiles for design_head_id and execution_manager_id
      const headIds = [
        ...new Set([
          ...projects.filter(p => p.design_head_id).map(p => p.design_head_id),
          ...projects.filter(p => p.execution_manager_id).map(p => p.execution_manager_id),
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
        execution_manager_profile: p.execution_manager_id ? profiles[p.execution_manager_id] : null,
      })) as ProjectWithDetails[];
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<ProjectInsert, 'created_by'> & { 
      designer_id?: string | null; 
      site_supervisor_id?: string | null;
      account_manager_id?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Extract team members that go to project_team table
      const { designer_id, site_supervisor_id, account_manager_id, ...projectData } = project;
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Assign designer if provided
      if (designer_id) {
        await supabase.from('project_team').insert({
          project_id: data.id,
          user_id: designer_id,
          role: 'designer',
          assigned_by: user.id,
        });
      }

      // Assign site supervisor if provided
      if (site_supervisor_id) {
        await supabase.from('project_team').insert({
          project_id: data.id,
          user_id: site_supervisor_id,
          role: 'site_supervisor',
          assigned_by: user.id,
        });
      }

      // Assign account manager if provided
      if (account_manager_id) {
        await supabase.from('project_team').insert({
          project_id: data.id,
          user_id: account_manager_id,
          role: 'account_manager',
          assigned_by: user.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-team'] });
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

  const updateLifecycleStatus = useMutation({
    mutationFn: async ({ id, lifecycle_status }: { id: string; lifecycle_status: 'active' | 'stopped' }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ lifecycle_status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: variables.lifecycle_status === 'active' ? 'Project Activated' : 'Project Stopped',
        description: variables.lifecycle_status === 'active' 
          ? 'Project is now visible to team members.' 
          : 'Project is now hidden from team members.',
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

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project Deleted',
        description: 'Project has been permanently deleted.',
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
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject,
    updateProject,
    updateProjectStatus,
    updateLifecycleStatus,
    deleteProject,
    refetch: projectsQuery.refetch,
  };
};

export const useProjectStats = () => {
  const { projects, isLoading } = useProjects();

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status !== 'completed' && p.lifecycle_status === 'active').length,
    designPending: projects.filter(p => p.status.includes('design')).length,
    inExecution: projects.filter(p => ['execution_started', 'work_in_progress', 'finishing'].includes(p.status)).length,
    nearCompletion: projects.filter(p => p.progress >= 80 && p.status !== 'completed').length,
    completed: projects.filter(p => p.status === 'completed').length,
    leads: projects.filter(p => p.status === 'lead').length,
  };

  return { stats, isLoading };
};
