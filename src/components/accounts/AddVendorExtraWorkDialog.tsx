import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVendorExtraWork } from '@/hooks/useVendorExtraWork';
import { Loader2, Plus } from 'lucide-react';

interface AddVendorExtraWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddVendorExtraWorkDialog: React.FC<AddVendorExtraWorkDialogProps> = ({
  open, onOpenChange, projectId,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { addVendorExtraWork } = useVendorExtraWork();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !amount || !description) return;
    await addVendorExtraWork.mutateAsync({ projectId, amount: parseFloat(amount), description });
    setAmount('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />Add Vendor Extra Work
          </DialogTitle>
          <DialogDescription>Add an extra work entry for vendor payments</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="v-ew-desc">Description *</Label>
            <Textarea id="v-ew-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the extra work..." rows={3} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-ew-amount">Amount (₹) *</Label>
            <Input id="v-ew-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" min="1" step="100" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={addVendorExtraWork.isPending || !amount || !description}>
              {addVendorExtraWork.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Extra Work
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
