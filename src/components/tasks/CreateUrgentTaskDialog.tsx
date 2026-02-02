import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Zap, Loader2 } from 'lucide-react';
import { useUrgentTasks } from '@/hooks/useUrgentTasks';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

interface CreateUrgentTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export const CreateUrgentTaskDialog: React.FC<CreateUrgentTaskDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  projectName,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'critical'>('high');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { createTask } = useUrgentTasks();
  const { users } = useUsers();

  // Filter users to show only execution managers and site supervisors
  const assignableUsers = users.filter(
    (u) => u.role === 'execution_manager' || u.role === 'site_supervisor'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !assignedTo) return;

    await createTask.mutateAsync({
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigned_to: assignedTo,
      due_date: dueDate || undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('high');
    setAssignedTo('');
    setDueDate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Create Urgent Task
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            For project: <span className="font-medium">{projectName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the task details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'high' | 'critical')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-warning" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-destructive" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign To *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No execution team members found
                  </div>
                ) : (
                  assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {user.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || !assignedTo || createTask.isPending}
              className={cn(
                priority === 'critical' 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-warning hover:bg-warning/90 text-warning-foreground'
              )}
            >
              {createTask.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Urgent Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
