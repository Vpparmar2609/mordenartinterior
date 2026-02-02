import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Image, ExternalLink, History } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageId: string;
  stageName: string;
}

interface Transaction {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  proof_url: string | null;
  created_at: string;
  recorded_by: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  card: 'Card',
};

export const PaymentHistoryDialog: React.FC<PaymentHistoryDialogProps> = ({
  open,
  onOpenChange,
  stageId,
  stageName,
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['payment-transactions', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('stage_id', stageId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: open && !!stageId,
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      // First check if there's a proof file to delete
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('proof_url')
        .eq('id', id)
        .single();

      if (transaction?.proof_url) {
        // Extract file path from URL and delete
        const urlParts = transaction.proof_url.split('/');
        const filePath = urlParts.slice(-2).join('/');
        await supabase.storage.from('payment-proofs').remove([filePath]);
      }

      const { error } = await supabase
        .from('payment_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions', stageId] });
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      toast({
        title: 'Payment Reversed',
        description: 'The payment transaction has been deleted.',
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getSignedUrl = async (proofUrl: string) => {
    // Extract file path from URL
    const urlParts = proofUrl.split('/');
    const filePath = urlParts.slice(-2).join('/');
    
    const { data } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(filePath, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Payment History
            </DialogTitle>
            <DialogDescription>
              Transaction history for {stageName}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions?.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-lg border border-border/50 bg-card/60 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {formatCurrency(transaction.amount)}
                        </span>
                        {transaction.payment_method && (
                          <Badge variant="outline">
                            {paymentMethodLabels[transaction.payment_method] || transaction.payment_method}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.payment_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {transaction.proof_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => getSignedUrl(transaction.proof_url!)}
                        >
                          <Image className="w-4 h-4 mr-1" />
                          Proof
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(transaction.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {transaction.reference_number && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Ref: </span>
                      {transaction.reference_number}
                    </p>
                  )}
                  
                  {transaction.notes && (
                    <p className="text-sm text-muted-foreground italic">
                      {transaction.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the payment transaction and update the stage balance accordingly.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteTransaction.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTransaction.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
