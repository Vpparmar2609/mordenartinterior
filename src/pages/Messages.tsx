import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, ArrowLeft } from 'lucide-react';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatArea } from '@/components/messages/ChatArea';
import { useIsMobile } from '@/hooks/use-mobile';

const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversations = [], isLoading } = useConversations();
  const isMobile = useIsMobile();

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  // Mobile: show either conversation list OR chat
  if (isMobile) {
    if (selectedConversation) {
      return (
        <div className="h-[calc(100dvh-8rem)] animate-fade-in flex flex-col">
          <ChatArea conversation={selectedConversation} onBack={handleBack} />
        </div>
      );
    }

    return (
      <div className="h-[calc(100dvh-8rem)] animate-fade-in">
        <Card className="glass-card h-full flex flex-col">
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
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id ?? null}
              onSelect={handleSelectConversation}
              isLoading={isLoading}
              searchQuery={searchQuery}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop: side-by-side layout
  return (
    <div className="h-[calc(100vh-12rem)] animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Conversations List */}
        <Card className="glass-card lg:col-span-1 flex flex-col">
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
          <CardContent className="p-0 flex-1 overflow-hidden">
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
