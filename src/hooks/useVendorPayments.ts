import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type VendorPaymentStage =
  | 'pop_work'
  | 'material_unload'
  | 'raw_work'
  | 'laminate_work'
  | 'color_fabric'
  | 'final_inspection';

export const vendorStageLabels: Record<VendorPaymentStage, string> = {
  pop_work: 'POP Work Complete',
  material_unload: 'Material Unload (Ply + Hardware)',
  raw_work: 'After Raw Work Complete',
  laminate_work: 'After Laminate Complete',
  color_fabric: 'After Color & Fabric Work',
  final_inspection: 'Final Inspection + Post-Handover',
};

export const vendorStagePercentages: Record<VendorPaymentStage, number> = {
  pop_work: 10,
  material_unload: 20,
  raw_work: 20,
  laminate_work: 20,
  color_fabric: 20,
  final_inspection: 10,
};

export interface VendorCost {
  id: string;
  project_id: string;
  total_cost: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPaymentStageData {
  id: string;
  project_id: string;
  stage: VendorPaymentStage;
  percentage: number;
  required_amount: number;
  paid_amount: number;
  status: 'pending' | 'partial' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface VendorPaymentTransaction {
  id: string;
  project_id: string;
  stage_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  proof_url: string | null;
  recorded_by: string;
  created_at: string;
}

export interface VendorPaymentSummary {
  project_id: string;
  client_name: string;
  total_cost: number;
  total_paid: number;
  total_pending: number;
  stages: VendorPaymentStageData[];
}

export const useVendorPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['vendor-payments'],
    queryFn: async () => {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, client_name')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Use raw query approach since types aren't updated yet
      const { data: costs, error: costsError } = await supabase
        .from('vendor_costs' as any)
        .select('*');

      if (costsError) throw costsError;

      const { data: stages, error: stagesError } = await supabase
        .from('vendor_payment_stages' as any)
        .select('*')
        .order('stage');

      if (stagesError) throw stagesError;

      const summaries: VendorPaymentSummary[] = projects.map(project => {
        const cost = (costs as any[])?.find((c: any) => c.project_id === project.id);
        const projectStages = ((stages as any[])?.filter((s: any) => s.project_id === project.id) || []) as VendorPaymentStageData[];

        const totalPaid = projectStages.reduce((sum, s) => sum + Number(s.paid_amount), 0);
        const totalCost = cost ? Number(cost.total_cost) : 0;

        return {
          project_id: project.id,
          client_name: project.client_name,
          total_cost: totalCost,
          total_paid: totalPaid,
          total_pending: Math.max(0, totalCost - totalPaid),
          stages: projectStages,
        };
      });

      return summaries;
    },
    enabled: !!user,
  });

  const setVendorCost = useMutation({
    mutationFn: async ({ projectId, totalCost }: { projectId: string; totalCost: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vendor_costs' as any)
        .upsert({
          project_id: projectId,
          total_cost: totalCost,
          created_by: user.id,
        } as any, { onConflict: 'project_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
      toast({
        title: 'Vendor Cost Updated',
        description: 'Vendor payment milestones have been auto-calculated.',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const recordVendorPayment = useMutation({
    mutationFn: async ({
      projectId, stageId, amount, paymentDate, paymentMethod, referenceNumber, notes, proofUrl,
    }: {
      projectId: string;
      stageId: string;
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      referenceNumber?: string;
      notes?: string;
      proofUrl?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vendor_payment_transactions' as any)
        .insert({
          project_id: projectId,
          stage_id: stageId,
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
      queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
      toast({ title: 'Vendor Payment Recorded', description: 'Payment recorded successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const totals = {
    totalPaid: paymentsQuery.data?.reduce((sum, p) => sum + p.total_paid, 0) || 0,
    totalPending: paymentsQuery.data?.reduce((sum, p) => sum + p.total_pending, 0) || 0,
    totalCost: paymentsQuery.data?.reduce((sum, p) => sum + p.total_cost, 0) || 0,
  };

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    totals,
    setVendorCost,
    recordVendorPayment,
    refetch: paymentsQuery.refetch,
  };
};
