import React from 'react';
import { 
  CheckCircle2, 
  Upload, 
  MessageSquare, 
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'completed' | 'uploaded' | 'message' | 'issue' | 'update';
  title: string;
  message: string;
  time: string;
}

const typeIcons: Record<Activity['type'], React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4" />,
  uploaded: <Upload className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  issue: <AlertTriangle className="w-4 h-4" />,
  update: <Clock className="w-4 h-4" />,
};

const typeColors: Record<Activity['type'], string> = {
  completed: 'bg-success/10 text-success',
  uploaded: 'bg-primary/10 text-primary',
  message: 'bg-accent/10 text-accent',
  issue: 'bg-destructive/10 text-destructive',
  update: 'bg-muted text-muted-foreground',
};

const mapNotificationType = (type: string): Activity['type'] => {
  switch (type) {
    case 'approval_responded':
      return 'completed';
    case 'approval_requested':
      return 'uploaded';
    case 'issue_raised':
      return 'issue';
    case 'project_assigned':
      return 'update';
    default:
      return 'message';
  }
};

export const RecentActivity: React.FC = () => {
  const { notifications, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-fade-in">
        <h3 className="font-display text-lg font-semibold text-foreground mb-6">
          Recent Activity
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const activities: Activity[] = (notifications || []).slice(0, 5).map(notif => ({
    id: notif.id,
    type: mapNotificationType(notif.type),
    title: notif.title,
    message: notif.message,
    time: formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }),
  }));

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">
        Recent Activity
      </h3>
      
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent activity
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg shrink-0',
                typeColors[activity.type]
              )}>
                {typeIcons[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.message}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
