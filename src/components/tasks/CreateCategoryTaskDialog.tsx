import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';

interface CreateCategoryTaskDialogProps {
  category: 'designing' | 'execution' | 'account_manager';
  defaultProjectId?: string;
  trigger?: React.ReactNode;
}

const categoryRoleMap: Record<string, string[]> = {
  designing: ['designer', 'design_head'],
  execution: ['execution_manager', 'site_supervisor', 'execution_head'],
  account_manager: ['account_manager'],
};

const categoryLabels: Record<string, string> = {
  designing: 'Design Task',
  execution: 'Execution Task',
  account_manager: 'Account Task',
};

export const CreateCategoryTaskDialog: React.FC<CreateCategoryTaskDialogProps> = ({
  category,
  defaultProjectId,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { createTask } = useCustomTasks();
  const { projects } = useProjects();
  const { users } = useUsers();

  const filteredUsers = users.filter(u => categoryRoleMap[category]?.includes(u.role || ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !assignedTo) return;

    createTask.mutate({
      project_id: projectId,
      category,
      priority,
      assigned_to: assignedTo,
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setTitle('');
        setDescription('');
        if (!defaultProjectId) setProjectId('');
        setAssignedTo('');
        setDueDate('');
        setPriority('normal');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            New {categoryLabels[category]}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Create {categoryLabels[category]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." maxLength={200} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.client_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Assign To *</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {filteredUsers.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">No users available</div>
                  ) : filteredUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Task details..." maxLength={1000} rows={3} />
          </div>

          <Button type="submit" className="w-full" disabled={createTask.isPending || !title.trim() || !projectId || !assignedTo}>
            {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
