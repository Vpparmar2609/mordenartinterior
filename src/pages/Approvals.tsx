import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  HardHat,
  Loader2
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
import { useApprovals } from '@/hooks/useApprovals';
import { useDesignTasks, useExecutionTasks } from '@/hooks/useProjectTasks';
import { useNavigate } from 'react-router-dom';

const Approvals: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { approvals, isLoading, pendingCount, approveRequest, rejectRequest } = useApprovals();

  const filteredApprovals = approvals.filter((approval) => {
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

  const handleApprove = (id: string) => {
    approveRequest.mutate({ id });
  };

  const handleReject = (id: string) => {
    rejectRequest.mutate({ id, comments: rejectComment });
    setRejectComment('');
    setRejectingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
      {filteredApprovals.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No approvals found.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Approval requests will appear here when team members submit work for review.
            </p>
          </CardContent>
        </Card>
      ) : (
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
                      {approval.approval_type.includes('design') ? (
                        <Palette className="w-5 h-5 text-accent" />
                      ) : (
                        <HardHat className="w-5 h-5 text-primary" />
                      )}
                      <span className="font-medium text-foreground">
                        {approval.project?.client_name || 'Unknown Project'}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {approval.approval_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Requested by {approval.requester?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(approval.requested_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>

                    {approval.status !== 'pending' && (
                      <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                        <span>
                          {approval.status === 'approved' ? 'Approved' : 'Rejected'} by {approval.responder?.name || 'Unknown'}
                        </span>
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approval.project && navigate(`/projects/${approval.project.id}`)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-success hover:bg-success/90 text-white"
                          onClick={() => handleApprove(approval.id)}
                          disabled={approveRequest.isPending}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Dialog open={rejectingId === approval.id} onOpenChange={(open) => {
                          if (!open) setRejectingId(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => setRejectingId(approval.id)}
                            >
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
                              <Button variant="outline" onClick={() => setRejectingId(null)}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => handleReject(approval.id)}
                                disabled={!rejectComment.trim() || rejectRequest.isPending}
                              >
                                Reject with Comments
                              </Button>
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
      )}
    </div>
  );
};

export default Approvals;
