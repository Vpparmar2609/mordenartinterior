import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, History } from 'lucide-react';
import { useVendorExtraWork, VendorExtraWorkPayment } from '@/hooks/useVendorExtraWork';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

interface VendorExtraWorkPaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorExtraWorkId: string;
  description: string;
}

export const VendorExtraWorkPaymentHistoryDialog: React.FC<VendorExtraWorkPaymentHistoryDialogProps> = ({
  open, onOpenChange, vendorExtraWorkId, description,
}) => {
  const [payments, setPayments] = useState<VendorExtraWorkPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const { getPaymentHistory } = useVendorExtraWork();

  useEffect(() => {
    if (open && vendorExtraWorkId) {
      setLoading(true);
      getPaymentHistory(vendorExtraWorkId).then(setPayments).catch(console.error).finally(() => setLoading(false));
    }
  }, [open, vendorExtraWorkId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />Payment History
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="p-3 rounded-lg border border-border/50 bg-card/60 space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString('en-IN')}</p>
                </div>
                {p.payment_method && <p className="text-xs text-muted-foreground capitalize">{p.payment_method.replace('_', ' ')}</p>}
                {p.reference_number && <p className="text-xs text-muted-foreground">Ref: {p.reference_number}</p>}
                {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
