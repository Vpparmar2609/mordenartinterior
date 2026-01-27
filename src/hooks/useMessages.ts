import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['project_messages']['Row'];

export interface MessageWithSender extends Message {
  sender?: { id: string; name: string; avatar_url: string | null } | null;
}

export const useMessages = (projectId: string, isInternal: boolean = true) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['messages', projectId, isInternal],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_internal', isInternal)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', senderIds);

      const profilesMap = (profiles ?? []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { id: string; name: string; avatar_url: string | null }>);

      return messages.map(m => ({
        ...m,
        sender: profilesMap[m.sender_id] ?? null,
      })) as MessageWithSender[];
    },
    enabled: !!user && !!projectId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`messages-${projectId}-${isInternal}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', projectId, isInternal] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, isInternal, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          message,
          is_internal: isInternal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', projectId, isInternal] });
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
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage,
    refetch: messagesQuery.refetch,
  };
};
