import React, { useState, useEffect } from 'react';
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
import { useProjectPayments, stageLabels, stagePercentages, PaymentStage } from '@/hooks/useProjectPayments';
import { Loader2, IndianRupee } from 'lucide-react';

interface SetProjectCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  currentCost: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const SetProjectCostDialog: React.FC<SetProjectCostDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  currentCost,
}) => {
  const [totalCost, setTotalCost] = useState('');
  const { setProjectCost } = useProjectPayments();

  useEffect(() => {
    if (open && currentCost > 0) {
      setTotalCost(currentCost.toString());
    } else if (open) {
      setTotalCost('');
    }
  }, [open, currentCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !totalCost) return;

    await setProjectCost.mutateAsync({
      projectId,
      totalCost: parseFloat(totalCost),
    });

    onOpenChange(false);
  };

  const costValue = parseFloat(totalCost) || 0;
  const stages: PaymentStage[] = ['booking', 'pop_stage', 'plywood_stage', 'lamination_stage', 'paint_stage', 'fabric_stage'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Set Project Cost
          </DialogTitle>
          <DialogDescription>
            Enter the total project cost. Payment stages will be auto-calculated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="totalCost">Total Project Cost (₹)</Label>
            <Input
              id="totalCost"
              type="number"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              placeholder="e.g., 2000000"
              min="0"
              step="1000"
              required
            />
          </div>

          {costValue > 0 && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm">Stage-wise Breakdown</h4>
              <div className="space-y-2 text-sm">
                {stages.map(stage => (
                  <div key={stage} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {stageLabels[stage]} ({stagePercentages[stage]}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(costValue * (stagePercentages[stage] / 100))}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(costValue)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={setProjectCost.isPending || !totalCost}>
              {setProjectCost.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {currentCost > 0 ? 'Update Cost' : 'Set Cost'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
