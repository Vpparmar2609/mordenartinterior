import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjectPayments } from '@/hooks/useProjectPayments';
import { Loader2, Plus } from 'lucide-react';

interface AddExtraWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddExtraWorkDialog: React.FC<AddExtraWorkDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const { addExtraWork } = useProjectPayments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !amount || !description) return;

    await addExtraWork.mutateAsync({
      projectId,
      amount: parseFloat(amount),
      description,
    });

    // Reset form
    setAmount('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Extra Work
          </DialogTitle>
          <DialogDescription>
            Add an extra work entry for this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the extra work..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="100"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addExtraWork.isPending || !amount || !description}>
              {addExtraWork.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Extra Work
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
