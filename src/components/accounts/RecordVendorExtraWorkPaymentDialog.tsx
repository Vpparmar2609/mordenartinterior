import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useVendorExtraWork } from '@/hooks/useVendorExtraWork';
import { Loader2, IndianRupee, Upload, X, Image } from 'lucide-react';

interface RecordVendorExtraWorkPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorExtraWorkId: string;
  projectId: string;
}

export const RecordVendorExtraWorkPaymentDialog: React.FC<RecordVendorExtraWorkPaymentDialogProps> = ({
  open, onOpenChange, vendorExtraWorkId, projectId,
}) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recordVendorExtraWorkPayment } = useVendorExtraWork();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
      setProofFile(file);
    }
  };

  const uploadProof = async (): Promise<string | null> => {
    if (!proofFile) return null;
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `vendor-extra-work/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('payment-proofs').upload(fileName, proofFile);
    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorExtraWorkId || !amount) return;
    setIsUploading(true);
    try {
      let proofUrl: string | null = null;
      if (proofFile) proofUrl = await uploadProof();
      await recordVendorExtraWorkPayment.mutateAsync({
        vendorExtraWorkId,
        amount: parseFloat(amount),
        paymentDate,
        paymentMethod: paymentMethod || undefined,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        proofUrl: proofUrl || undefined,
      });
      setAmount(''); setPaymentMethod(''); setReferenceNumber(''); setNotes(''); setProofFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = recordVendorExtraWorkPayment.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />Record Vendor Extra Work Payment
          </DialogTitle>
          <DialogDescription>Record a payment for this vendor extra work</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="v-ew-pay-amount">Amount (₹) *</Label>
            <Input id="v-ew-pay-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" min="1" step="100" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-ew-pay-date">Payment Date *</Label>
            <Input id="v-ew-pay-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-ew-pay-ref">Reference Number</Label>
            <Input id="v-ew-pay-ref" type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Transaction ID / Cheque No." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-ew-pay-notes">Notes</Label>
            <Textarea id="v-ew-pay-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Payment Proof (Screenshot/Photo)</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {proofFile ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/50">
                <Image className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{proofFile.name}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setProofFile(null)}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />Upload Proof
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Max 5MB.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !amount}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
