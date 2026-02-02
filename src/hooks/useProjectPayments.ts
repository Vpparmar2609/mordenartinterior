import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type PaymentStage = 
  | 'booking'
  | 'pop_stage'
  | 'plywood_stage'
  | 'lamination_stage'
  | 'paint_stage'
  | 'fabric_stage';

export const stageLabels: Record<PaymentStage, string> = {
  booking: 'Booking Amount',
  pop_stage: 'POP Stage',
  plywood_stage: 'Plywood Stage',
  lamination_stage: 'Lamination Stage',
  paint_stage: 'Paint Stage',
  fabric_stage: 'Fabric Stage',
};

export const stagePercentages: Record<PaymentStage, number> = {
  booking: 5,
  pop_stage: 25,
  plywood_stage: 25,
  lamination_stage: 30,
  paint_stage: 10,
  fabric_stage: 5,
};

export interface ProjectCost {
  id: string;
  project_id: string;
  total_cost: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PaymentStageData {
  id: string;
  project_id: string;
  stage: PaymentStage;
  percentage: number;
  required_amount: number;
  paid_amount: number;
  status: 'pending' | 'partial' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  project_id: string;
  stage_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface ExtraWork {
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

export interface ExtraWorkPayment {
  id: string;
  extra_work_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface ProjectPaymentSummary {
  project_id: string;
  client_name: string;
  total_cost: number;
  total_paid: number;
  total_pending: number;
  extra_work_total: number;
  extra_work_paid: number;
  stages: PaymentStageData[];
  extra_works: ExtraWork[];
}

export const useProjectPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all project costs with their payment stages
  const paymentsQuery = useQuery({
    queryKey: ['project-payments'],
    queryFn: async () => {
      // Get all projects first
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, client_name')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Get project costs
      const { data: costs, error: costsError } = await supabase
        .from('project_costs')
        .select('*');

      if (costsError) throw costsError;

      // Get payment stages
      const { data: stages, error: stagesError } = await supabase
        .from('payment_stages')
        .select('*')
        .order('stage');

      if (stagesError) throw stagesError;

      // Get extra works
      const { data: extraWorks, error: extraWorksError } = await supabase
        .from('extra_work')
        .select('*')
        .order('created_at', { ascending: false });

      if (extraWorksError) throw extraWorksError;

      // Build summaries for each project
      const summaries: ProjectPaymentSummary[] = projects.map(project => {
        const cost = costs?.find(c => c.project_id === project.id);
        const projectStages = (stages?.filter(s => s.project_id === project.id) || []) as PaymentStageData[];
        const projectExtraWorks = (extraWorks?.filter(e => e.project_id === project.id) || []) as ExtraWork[];

        const totalPaid = projectStages.reduce((sum, s) => sum + Number(s.paid_amount), 0);
        const totalCost = cost ? Number(cost.total_cost) : 0;
        const extraWorkTotal = projectExtraWorks.reduce((sum, e) => sum + Number(e.amount), 0);
        const extraWorkPaid = projectExtraWorks.reduce((sum, e) => sum + Number(e.paid_amount), 0);

        return {
          project_id: project.id,
          client_name: project.client_name,
          total_cost: totalCost,
          total_paid: totalPaid,
          total_pending: totalCost - totalPaid,
          extra_work_total: extraWorkTotal,
          extra_work_paid: extraWorkPaid,
          stages: projectStages,
          extra_works: projectExtraWorks,
        };
      });

      return summaries;
    },
    enabled: !!user,
  });

  // Set project cost (Admin only)
  const setProjectCost = useMutation({
    mutationFn: async ({ projectId, totalCost }: { projectId: string; totalCost: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_costs')
        .upsert({
          project_id: projectId,
          total_cost: totalCost,
          created_by: user.id,
        }, { onConflict: 'project_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      toast({
        title: 'Project Cost Updated',
        description: 'Payment stages have been automatically calculated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Record payment transaction
  const recordPayment = useMutation({
    mutationFn: async ({
      projectId,
      stageId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
      proofUrl,
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
        .from('payment_transactions')
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
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      toast({
        title: 'Payment Recorded',
        description: 'Payment has been recorded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add extra work (Admin only)
  const addExtraWork = useMutation({
    mutationFn: async ({
      projectId,
      amount,
      description,
    }: {
      projectId: string;
      amount: number;
      description: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('extra_work')
        .insert({
          project_id: projectId,
          amount,
          description,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      toast({
        title: 'Extra Work Added',
        description: 'Extra work entry has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update extra work (Admin only)
  const updateExtraWork = useMutation({
    mutationFn: async ({
      id,
      amount,
      description,
    }: {
      id: string;
      amount: number;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('extra_work')
        .update({ amount, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      toast({
        title: 'Extra Work Updated',
        description: 'Extra work entry has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Record extra work payment
  const recordExtraWorkPayment = useMutation({
    mutationFn: async ({
      extraWorkId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
      proofUrl,
    }: {
      extraWorkId: string;
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      referenceNumber?: string;
      notes?: string;
      proofUrl?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('extra_work_payments')
        .insert({
          extra_work_id: extraWorkId,
          amount,
          payment_date: paymentDate,
          payment_method: paymentMethod || null,
          reference_number: referenceNumber || null,
          notes: notes || null,
          proof_url: proofUrl || null,
          recorded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      toast({
        title: 'Payment Recorded',
        description: 'Extra work payment has been recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate totals
  const totals = {
    totalReceived: paymentsQuery.data?.reduce((sum, p) => sum + p.total_paid + p.extra_work_paid, 0) || 0,
    totalPending: paymentsQuery.data?.reduce((sum, p) => sum + p.total_pending + (p.extra_work_total - p.extra_work_paid), 0) || 0,
    extraWorkTotal: paymentsQuery.data?.reduce((sum, p) => sum + p.extra_work_total, 0) || 0,
  };

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    totals,
    setProjectCost,
    recordPayment,
    addExtraWork,
    updateExtraWork,
    recordExtraWorkPayment,
    refetch: paymentsQuery.refetch,
  };
};
