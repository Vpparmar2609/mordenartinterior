import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  role: UserRole | null;
}

export const useUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map(profile => ({
        ...profile,
        role: roles.find(r => r.user_id === profile.id)?.role as UserRole | null ?? null,
      }));

      return usersWithRoles;
    },
    enabled: !!user,
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { data, error } = await supabase.rpc('assign_user_role', {
        target_user_id: userId,
        target_role: role,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Role assigned',
        description: 'User role has been updated successfully.',
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

  const getUsersByRole = (role: UserRole) => {
    return usersQuery.data?.filter(u => u.role === role) ?? [];
  };

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    assignRole,
    getUsersByRole,
    refetch: usersQuery.refetch,
  };
};
