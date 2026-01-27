import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare } from 'lucide-react';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatArea } from '@/components/messages/ChatArea';

const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversations = [], isLoading } = useConversations();

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="h-[calc(100vh-12rem)] animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Conversations List */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversations
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id ?? null}
              onSelect={handleSelectConversation}
              isLoading={isLoading}
              searchQuery={searchQuery}
            />
          </CardContent>
        </Card>

        {/* Chat Area */}
        <ChatArea conversation={selectedConversation} />
      </div>
    </div>
  );
};

export default Messages;
