import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  projectId: string;
  projectName: string;
  type: 'internal';
  lastMessage: string | null;
  lastSenderName: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      // Fetch all projects the user has access to
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, client_name, location');

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const conversations: Conversation[] = [];

      for (const project of projects) {
        const projectName = `${project.client_name} - ${project.location}`;

        // Fetch last internal message only (no client conversations)
        const { data: internalMessages } = await supabase
          .from('project_messages')
          .select('id, message, created_at, sender_id')
          .eq('project_id', project.id)
          .eq('is_internal', true)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get sender names for last messages
        const senderIds = internalMessages?.[0]?.sender_id ? [internalMessages[0].sender_id] : [];

        let senderNames: Record<string, string> = {};
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', senderIds);
          
          senderNames = (profiles ?? []).reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
          }, {} as Record<string, string>);
        }

        // Add internal conversation only
        conversations.push({
          id: `${project.id}-internal`,
          projectId: project.id,
          projectName,
          type: 'internal',
          lastMessage: internalMessages?.[0]?.message ?? null,
          lastSenderName: internalMessages?.[0]?.sender_id 
            ? senderNames[internalMessages[0].sender_id] ?? 'Unknown'
            : null,
          lastMessageTime: internalMessages?.[0]?.created_at ?? null,
          unreadCount: 0,
        });
      }

      // Sort by last message time (most recent first)
      return conversations.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    },
    enabled: !!user,
  });
};
