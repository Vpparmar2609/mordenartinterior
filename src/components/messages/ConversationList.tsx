import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/hooks/useConversations';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  isLoading: boolean;
  searchQuery: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  searchQuery,
}) => {
  const filteredConversations = conversations.filter(
    (c) =>
      c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-20rem)]">
      {filteredConversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className={cn(
            "p-4 cursor-pointer border-b border-border hover:bg-secondary/50 transition-colors",
            selectedId === conversation.id && "bg-secondary"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm truncate">
                  {conversation.projectName}
                </span>
                {conversation.type === 'internal' ? (
                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                    <Lock className="w-2 h-2" />
                    Internal
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                    <Users className="w-2 h-2" />
                    Client
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {conversation.lastMessage ? (
                  <>
                    <span className="font-medium">{conversation.lastSenderName}:</span>{' '}
                    {conversation.lastMessage}
                  </>
                ) : (
                  <span className="italic">No messages yet</span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {conversation.lastMessageTime && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(conversation.lastMessageTime)}
                </span>
              )}
              {conversation.unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </ScrollArea>
  );
};
