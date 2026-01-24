import React from 'react';
import { 
  CheckCircle2, 
  Upload, 
  MessageSquare, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'completed' | 'uploaded' | 'message' | 'issue' | 'update';
  title: string;
  project: string;
  user: string;
  time: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'completed',
    title: 'Kitchen 3D design completed',
    project: 'Sharma Residence',
    user: 'Rahul Patel',
    time: '5 min ago',
  },
  {
    id: '2',
    type: 'uploaded',
    title: 'Site photos uploaded',
    project: 'Gupta Villa',
    user: 'Rajesh Verma',
    time: '15 min ago',
  },
  {
    id: '3',
    type: 'issue',
    title: 'Material delay reported',
    project: 'Kumar Apartment',
    user: 'Amit Kumar',
    time: '1 hour ago',
  },
  {
    id: '4',
    type: 'message',
    title: 'New message from client',
    project: 'Patel House',
    user: 'Client',
    time: '2 hours ago',
  },
  {
    id: '5',
    type: 'update',
    title: 'Project status updated',
    project: 'Singh Residence',
    user: 'Vikram Singh',
    time: '3 hours ago',
  },
];

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

export const RecentActivity: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">
        Recent Activity
      </h3>
      
      <div className="space-y-4">
        {mockActivities.map((activity) => (
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
              <p className="text-xs text-muted-foreground">
                {activity.project} • {activity.user}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
