import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMessages, MessageWithSender } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, Lock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectChatProps {
  projectId: string;
  isClient?: boolean;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ projectId, isClient = false }) => {
  const [activeTab, setActiveTab] = useState(isClient ? 'client' : 'internal');
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Internal chat (not visible to clients)
  const internalChat = useMessages(projectId, true);
  // Client-facing chat
  const clientChat = useMessages(projectId, false);

  const activeChat = activeTab === 'internal' ? internalChat : clientChat;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat.messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    await activeChat.sendMessage.mutateAsync(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const renderMessages = (messages: MessageWithSender[]) => {
    let lastDate = '';

    return messages.map((msg) => {
      const msgDate = formatDate(msg.created_at);
      const showDateSeparator = msgDate !== lastDate;
      lastDate = msgDate;
      const isOwn = msg.sender_id === user?.id;

      return (
        <React.Fragment key={msg.id}>
          {showDateSeparator && (
            <div className="flex items-center justify-center my-4">
              <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {msgDate}
              </span>
            </div>
          )}
          <div className={cn('flex gap-2 mb-3', isOwn && 'flex-row-reverse')}>
            {!isOwn && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {msg.sender?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
              {!isOwn && (
                <p className="text-xs text-muted-foreground mb-1">{msg.sender?.name}</p>
              )}
              <div className={cn(
                'inline-block px-3 py-2 rounded-2xl',
                isOwn 
                  ? 'bg-primary text-primary-foreground rounded-br-sm' 
                  : 'bg-muted rounded-bl-sm'
              )}>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
              <p className={cn('text-xs text-muted-foreground mt-1', isOwn && 'text-right')}>
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  // Clients can only see the client chat
  if (isClient) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Project Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {clientChat.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : clientChat.messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                renderMessages(clientChat.messages)
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!message.trim() || clientChat.sendMessage.isPending}
                  size="icon"
                >
                  {clientChat.sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border p-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="internal" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Internal Team
              </TabsTrigger>
              <TabsTrigger value="client" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Client Updates
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="internal" className="m-0">
            <div className="h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {internalChat.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : internalChat.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Internal team chat</p>
                    <p className="text-xs">Not visible to clients</p>
                  </div>
                ) : (
                  renderMessages(internalChat.messages)
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Message your team..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!message.trim() || internalChat.sendMessage.isPending}
                    size="icon"
                  >
                    {internalChat.sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="client" className="m-0">
            <div className="h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {clientChat.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clientChat.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Client updates channel</p>
                    <p className="text-xs">Share progress with the client</p>
                  </div>
                ) : (
                  renderMessages(clientChat.messages)
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Update the client..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!message.trim() || clientChat.sendMessage.isPending}
                    size="icon"
                  >
                    {clientChat.sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
