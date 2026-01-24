import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  MessageSquare,
  Palette,
  HardHat
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Mock approval requests
const mockApprovals = [
  {
    id: '1',
    project: 'Kumar Residence',
    type: 'design',
    title: 'Design Approval',
    description: 'All 15 design tasks completed. Ready for final approval.',
    requestedBy: 'Amit Kumar',
    requestedAt: '2026-01-23T14:00:00',
    status: 'pending',
    progress: 100,
    tasksCompleted: 15,
    totalTasks: 15,
  },
  {
    id: '2',
    project: 'Sharma Villa',
    type: 'design',
    title: 'Design Review',
    description: 'Kitchen and living room designs ready for review.',
    requestedBy: 'Sneha Gupta',
    requestedAt: '2026-01-22T10:30:00',
    status: 'pending',
    progress: 53,
    tasksCompleted: 8,
    totalTasks: 15,
  },
  {
    id: '3',
    project: 'Patel Apartment',
    type: 'execution',
    title: 'Handover Approval',
    description: 'Project ready for handover. QC completed.',
    requestedBy: 'Deepak Verma',
    requestedAt: '2026-01-24T09:00:00',
    status: 'pending',
    progress: 93,
    tasksCompleted: 14,
    totalTasks: 15,
  },
  {
    id: '4',
    project: 'Singh Home',
    type: 'design',
    title: 'Design Approval',
    description: 'Full design package completed and ready.',
    requestedBy: 'Amit Kumar',
    requestedAt: '2026-01-20T11:00:00',
    status: 'approved',
    progress: 100,
    tasksCompleted: 15,
    totalTasks: 15,
    respondedBy: 'Priya Patel',
    respondedAt: '2026-01-21T16:00:00',
  },
  {
    id: '5',
    project: 'Mehta Residence',
    type: 'design',
    title: 'Design Review',
    description: 'Initial designs submitted for review.',
    requestedBy: 'Sneha Gupta',
    requestedAt: '2026-01-19T14:30:00',
    status: 'rejected',
    progress: 67,
    tasksCompleted: 10,
    totalTasks: 15,
    respondedBy: 'Priya Patel',
    respondedAt: '2026-01-20T10:00:00',
    comments: 'Kitchen layout needs revision. Please update the island placement.',
  },
];

const Approvals: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectComment, setRejectComment] = useState('');

  const filteredApprovals = mockApprovals.filter((approval) => {
    return filter === 'all' || approval.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-success/20 text-success border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      default:
        return <Badge className="bg-destructive/20 text-destructive border-0"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  const pendingCount = mockApprovals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Approvals</h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className={filter === status ? 'bg-gradient-warm' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.map((approval, index) => (
          <Card 
            key={approval.id} 
            className={cn(
              "glass-card animate-fade-in",
              approval.status === 'pending' && 'border-warning/30'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {approval.type === 'design' ? (
                      <Palette className="w-5 h-5 text-accent" />
                    ) : (
                      <HardHat className="w-5 h-5 text-primary" />
                    )}
                    <span className="font-medium text-foreground">{approval.project}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{approval.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{approval.description}</p>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{approval.tasksCompleted}/{approval.totalTasks} tasks</span>
                      </div>
                      <Progress value={approval.progress} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Requested by {approval.requestedBy}</span>
                    <span>•</span>
                    <span>{new Date(approval.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {approval.status !== 'pending' && (
                    <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      <span>{approval.status === 'approved' ? 'Approved' : 'Rejected'} by {approval.respondedBy}</span>
                      {approval.comments && (
                        <p className="mt-1 text-sm text-foreground flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5" />
                          {approval.comments}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(approval.status)}
                  {approval.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                      <Button size="sm" className="bg-success hover:bg-success/90 text-white">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Approval</DialogTitle>
                            <DialogDescription>
                              Please provide feedback on what needs to be revised.
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Enter your comments..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button variant="destructive">Reject with Comments</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApprovals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No approvals found.</p>
        </div>
      )}
    </div>
  );
};

export default Approvals;
