import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages, MessageWithSender } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, Lock, Globe, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/hooks/useConversations';

interface ChatAreaProps {
  conversation: Conversation | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const isInternal = conversation?.type === 'internal';
  const { messages, isLoading, sendMessage } = useMessages(
    conversation?.projectId ?? '',
    isInternal
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !conversation) return;
    await sendMessage.mutateAsync(message.trim());
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

  const renderMessages = (msgs: MessageWithSender[]) => {
    let lastDate = '';

    return msgs.map((msg) => {
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

  if (!conversation) {
    return (
      <Card className="glass-card lg:col-span-2 flex flex-col items-center justify-center h-full">
        <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card lg:col-span-2 flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{conversation.projectName}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              {isInternal ? (
                <>
                  <Lock className="w-3 h-3" />
                  Internal Team Chat
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" />
                  Client Updates
                </>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {isInternal ? (
                <>
                  <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Internal team chat</p>
                  <p className="text-xs">Not visible to clients</p>
                </>
              ) : (
                <>
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Client updates channel</p>
                  <p className="text-xs">Share progress with the client</p>
                </>
              )}
            </div>
          ) : (
            renderMessages(messages)
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder={isInternal ? "Message your team..." : "Update the client..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!message.trim() || sendMessage.isPending}
              size="icon"
              className="bg-gradient-warm hover:opacity-90"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
