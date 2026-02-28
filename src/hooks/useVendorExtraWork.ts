import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VendorExtraWork {
  id: string;
  project_id: string;
  amount: number;
  description: string;
  status: 'pending' | 'partial' | 'completed';
  paid_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VendorExtraWorkPayment {
  id: string;
  vendor_extra_work_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  proof_url: string | null;
  recorded_by: string;
  created_at: string;
}

export const useVendorExtraWork = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const extraWorkQuery = useQuery({
    queryKey: ['vendor-extra-work'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_extra_work' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as VendorExtraWork[];
    },
    enabled: !!user,
  });

  const addVendorExtraWork = useMutation({
    mutationFn: async ({ projectId, amount, description }: { projectId: string; amount: number; description: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('vendor_extra_work' as any)
        .insert({ project_id: projectId, amount, description, created_by: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-extra-work'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
      toast({ title: 'Vendor Extra Work Added', description: 'Extra work entry added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const recordVendorExtraWorkPayment = useMutation({
    mutationFn: async ({
      vendorExtraWorkId, amount, paymentDate, paymentMethod, referenceNumber, notes, proofUrl,
    }: {
      vendorExtraWorkId: string;
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      referenceNumber?: string;
      notes?: string;
      proofUrl?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('vendor_extra_work_payments' as any)
        .insert({
          vendor_extra_work_id: vendorExtraWorkId,
          amount,
          payment_date: paymentDate,
          payment_method: paymentMethod || null,
          reference_number: referenceNumber || null,
          notes: notes || null,
          proof_url: proofUrl || null,
          recorded_by: user.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-extra-work'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
      toast({ title: 'Payment Recorded', description: 'Vendor extra work payment recorded.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getPaymentHistory = async (vendorExtraWorkId: string) => {
    const { data, error } = await supabase
      .from('vendor_extra_work_payments' as any)
      .select('*')
      .eq('vendor_extra_work_id', vendorExtraWorkId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data as any[]) as VendorExtraWorkPayment[];
  };

  return {
    extraWorks: extraWorkQuery.data || [],
    isLoading: extraWorkQuery.isLoading,
    addVendorExtraWork,
    recordVendorExtraWorkPayment,
    getPaymentHistory,
  };
};
