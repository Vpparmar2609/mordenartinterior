import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserRole } from '@/hooks/useUserRole';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCheck, ExternalLink, Send, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'project_assigned': return '📁';
    case 'issue_raised': return '⚠️';
    case 'approval_requested': return '📝';
    case 'approval_responded': return '✅';
    case 'announcement': return '📢';
    case 'reminder': return '⏰';
    case 'message': return '💬';
    default: return '🔔';
  }
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const { isAdmin, isDesignHead, isExecutionManager } = useUserRole();
  const { users } = useUsers();
  const { toast } = useToast();

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'announcement' | 'reminder' | 'message'>('announcement');
  const [isSending, setIsSending] = useState(false);

  const canSendNotification = isAdmin || isDesignHead || isExecutionManager;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) markAsRead.mutate(notification.id);
    if (notification.link) navigate(notification.link);
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setIsSending(true);
    try {
      const targets = targetUserId === 'all' ? users.map(u => u.id) : [targetUserId];
      for (const uid of targets) {
        await supabase.rpc('create_system_notification', {
          _user_id: uid,
          _type: notifType,
          _title: notifTitle,
          _message: notifMessage,
          _link: null,
        });
      }
      toast({
        title: 'Notification sent!',
        description: `Sent to ${targetUserId === 'all' ? `${targets.length} members` : users.find(u => u.id === targetUserId)?.name || 'user'}.`,
      });
      setShowSendDialog(false);
      setNotifTitle('');
      setNotifMessage('');
      setTargetUserId('all');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(notification);
    return acc;
  }, {} as Record<string, typeof notifications>);

  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {canSendNotification && (
            <Button onClick={() => setShowSendDialog(true)} variant="hero" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              You'll be notified when projects are assigned, issues are raised, or approvals are needed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {groupedNotifications[date].map((notification, index) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "glass-card cursor-pointer hover:bg-muted/30 transition-colors animate-fade-in",
                      !notification.read && "border-primary/30 bg-primary/5"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        <span className="text-xl sm:text-2xl shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={cn("font-medium text-sm", !notification.read && "text-foreground")}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!notification.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          {notification.link && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs mt-1"
                              onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                            >
                              View details <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Notification Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Send Notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Target */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                Send to
              </label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      📢 All Team Members ({users.length})
                    </span>
                  </SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — <span className="text-muted-foreground text-xs">{u.role?.replace(/_/g, ' ')}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select value={notifType} onValueChange={(v) => setNotifType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">📢 Announcement</SelectItem>
                  <SelectItem value="reminder">⏰ Reminder</SelectItem>
                  <SelectItem value="message">💬 Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g. Weekly Reminder, Important Update..."
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Write your message here..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSendDialog(false)}>Cancel</Button>
            <Button
              className="flex-1"
              variant="hero"
              onClick={handleSendNotification}
              disabled={!notifTitle.trim() || !notifMessage.trim() || isSending}
            >
              {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
