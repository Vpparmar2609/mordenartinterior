import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Send,
  MessageSquare,
  Users,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock conversations
const mockConversations = [
  {
    id: '1',
    project: 'Kumar Residence',
    type: 'internal',
    lastMessage: 'The TV unit is looking great. Can we proceed with painting?',
    lastSender: 'Rajesh Nair',
    lastTime: '2026-01-24T11:30:00',
    unread: 2,
  },
  {
    id: '2',
    project: 'Kumar Residence',
    type: 'client',
    lastMessage: 'Thank you for the update. The progress looks good!',
    lastSender: 'Mr. Kumar',
    lastTime: '2026-01-24T10:15:00',
    unread: 0,
  },
  {
    id: '3',
    project: 'Patel Apartment',
    type: 'internal',
    lastMessage: 'QC inspection scheduled for tomorrow morning.',
    lastSender: 'Deepak Verma',
    lastTime: '2026-01-24T09:45:00',
    unread: 1,
  },
  {
    id: '4',
    project: 'Sharma Villa',
    type: 'client',
    lastMessage: 'Please share the updated kitchen design.',
    lastSender: 'Mrs. Sharma',
    lastTime: '2026-01-23T16:30:00',
    unread: 1,
  },
];

// Mock messages for selected conversation
const mockMessages = [
  {
    id: 'm1',
    sender: 'Anjali Reddy',
    role: 'Execution Manager',
    message: 'Team, the client has approved the TV unit design. We can proceed with installation.',
    time: '2026-01-24T09:00:00',
    isOwn: false,
  },
  {
    id: 'm2',
    sender: 'Rajesh Nair',
    role: 'Site Supervisor',
    message: 'Great! The materials are ready. We will start installation today.',
    time: '2026-01-24T09:15:00',
    isOwn: false,
  },
  {
    id: 'm3',
    sender: 'You',
    role: 'Design Head',
    message: 'Please ensure the cable management is done as per the design.',
    time: '2026-01-24T09:30:00',
    isOwn: true,
  },
  {
    id: 'm4',
    sender: 'Rajesh Nair',
    role: 'Site Supervisor',
    message: 'Yes, we have the cable channels ready. Will share photos once done.',
    time: '2026-01-24T10:00:00',
    isOwn: false,
  },
  {
    id: 'm5',
    sender: 'Rajesh Nair',
    role: 'Site Supervisor',
    message: 'The TV unit is looking great. Can we proceed with painting?',
    time: '2026-01-24T11:30:00',
    isOwn: false,
  },
];

const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
            <ScrollArea className="h-[calc(100vh-20rem)]">
              {mockConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={cn(
                    "p-4 cursor-pointer border-b border-border hover:bg-secondary/50 transition-colors",
                    selectedConversation.id === conversation.id && "bg-secondary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm truncate">
                          {conversation.project}
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
                        <span className="font-medium">{conversation.lastSender}:</span> {conversation.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.lastTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {conversation.unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="glass-card lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedConversation.project}</CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  {selectedConversation.type === 'internal' ? (
                    <>
                      <Lock className="w-3 h-3" />
                      Internal Team Chat
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      Client Updates
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.isOwn && "flex-row-reverse"
                    )}
                  >
                    {!message.isOwn && (
                      <Avatar className="h-8 w-8 bg-gradient-warm shrink-0">
                        <AvatarFallback className="bg-transparent text-primary-foreground text-xs">
                          {message.sender.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "max-w-[70%]",
                      message.isOwn && "text-right"
                    )}>
                      {!message.isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{message.sender}</span>
                          <span className="text-xs text-muted-foreground">{message.role}</span>
                        </div>
                      )}
                      <div className={cn(
                        "rounded-lg p-3 text-sm",
                        message.isOwn 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-foreground"
                      )}>
                        {message.message}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(message.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && setNewMessage('')}
                />
                <Button className="bg-gradient-warm hover:opacity-90">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
