import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface ProjectTeamMember {
  id: string;
  user_id: string;
  project_id: string;
  role: AppRole;
  assigned_at: string;
  assigned_by: string;
  profile?: {
    id: string;
    name: string;
    email: string;
  };
}

export const useProjectTeam = (projectId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team members for a project
  const teamQuery = useQuery({
    queryKey: ['project-team', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: teamData, error } = await supabase
        .from('project_team')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Get profiles for team members
      const userIds = teamData.map(t => t.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return teamData.map(t => ({
        ...t,
        profile: profileMap.get(t.user_id),
      })) as ProjectTeamMember[];
    },
    enabled: !!projectId && !!user,
  });

  // Assign a team member to a project
  const assignMember = useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: AppRole;
    }) => {
      if (!projectId || !user) throw new Error('Missing project or user');

      // For designers and site_supervisors: allow multiple per project
      // For all other roles: enforce 1 per role
      if (role !== 'designer' && role !== 'site_supervisor') {
        await supabase
          .from('project_team')
          .delete()
          .eq('project_id', projectId)
          .eq('role', role);
      } else {
        // Check if this user is already assigned with this role
        const { data: existing } = await supabase
          .from('project_team')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', userId)
          .eq('role', role);
        if (existing && existing.length > 0) {
          throw new Error(`This ${role === 'designer' ? 'designer' : 'site supervisor'} is already assigned to the project.`);
        }
      }

      // Then add the new assignment
      const { data, error } = await supabase
        .from('project_team')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      queryClient.invalidateQueries({ queryKey: ['workload'] });
      toast({
        title: 'Team member assigned',
        description: 'Successfully assigned team member to project.',
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

  // Remove a team member from a project
  const removeMember = useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: AppRole;
    }) => {
      if (!projectId) throw new Error('Missing project');

      const { error } = await supabase
        .from('project_team')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      queryClient.invalidateQueries({ queryKey: ['workload'] });
      toast({
        title: 'Team member removed',
        description: 'Successfully removed team member from project.',
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

  // Get single member by role (for roles with 1 person)
  const getMemberByRole = (role: AppRole): ProjectTeamMember | undefined => {
    return teamQuery.data?.find(m => m.role === role);
  };

  // Get ALL members by role (for designers who can be multiple)
  const getMembersByRole = (role: AppRole): ProjectTeamMember[] => {
    return teamQuery.data?.filter(m => m.role === role) ?? [];
  };

  return {
    teamMembers: teamQuery.data ?? [],
    isLoading: teamQuery.isLoading,
    error: teamQuery.error,
    assignMember,
    removeMember,
    getMemberByRole,
    getMembersByRole,
    refetch: teamQuery.refetch,
  };
};
