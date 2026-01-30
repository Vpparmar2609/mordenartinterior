-- Create payment stages enum for better type safety
CREATE TYPE public.payment_stage AS ENUM (
  'booking',
  'pop_stage',
  'plywood_stage',
  'lamination_stage',
  'paint_stage',
  'fabric_stage'
);

-- Create project_costs table to store total project cost
CREATE TABLE public.project_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Create payment_stages table with auto-calculated amounts
CREATE TABLE public.payment_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  stage payment_stage NOT NULL,
  percentage numeric(5,2) NOT NULL,
  required_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage)
);

-- Create payment_transactions table to track individual payments
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  stage_id uuid REFERENCES public.payment_stages(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference_number text,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create extra_work table for additional work entries
CREATE TABLE public.extra_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed')),
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create extra_work_payments table for extra work payment tracking
CREATE TABLE public.extra_work_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_work_id uuid REFERENCES public.extra_work(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference_number text,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_work_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_costs
CREATE POLICY "Admin can manage project costs"
ON public.project_costs FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountant can view project costs"
ON public.project_costs FOR SELECT
USING (has_role(auth.uid(), 'account_manager'));

-- RLS Policies for payment_stages
CREATE POLICY "Admin can manage payment stages"
ON public.payment_stages FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountant can view payment stages"
ON public.payment_stages FOR SELECT
USING (has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Accountant can update payment stages"
ON public.payment_stages FOR UPDATE
USING (has_role(auth.uid(), 'account_manager'));

-- RLS Policies for payment_transactions
CREATE POLICY "Admin and Accountant can manage transactions"
ON public.payment_transactions FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'account_manager'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'account_manager'));

-- RLS Policies for extra_work
CREATE POLICY "Admin can manage extra work"
ON public.extra_work FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountant can view extra work"
ON public.extra_work FOR SELECT
USING (has_role(auth.uid(), 'account_manager'));

-- RLS Policies for extra_work_payments
CREATE POLICY "Admin and Accountant can manage extra work payments"
ON public.extra_work_payments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'account_manager'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'account_manager'));

-- Function to create default payment stages when project cost is set
CREATE OR REPLACE FUNCTION public.create_payment_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert all payment stages with calculated amounts
  INSERT INTO public.payment_stages (project_id, stage, percentage, required_amount)
  VALUES
    (NEW.project_id, 'booking', 5, NEW.total_cost * 0.05),
    (NEW.project_id, 'pop_stage', 25, NEW.total_cost * 0.25),
    (NEW.project_id, 'plywood_stage', 25, NEW.total_cost * 0.25),
    (NEW.project_id, 'lamination_stage', 30, NEW.total_cost * 0.30),
    (NEW.project_id, 'paint_stage', 10, NEW.total_cost * 0.10),
    (NEW.project_id, 'fabric_stage', 5, NEW.total_cost * 0.05)
  ON CONFLICT (project_id, stage) DO UPDATE SET
    required_amount = EXCLUDED.required_amount,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to create payment stages when project cost is inserted or updated
CREATE TRIGGER on_project_cost_change
AFTER INSERT OR UPDATE OF total_cost ON public.project_costs
FOR EACH ROW
EXECUTE FUNCTION public.create_payment_stages();

-- Function to update payment stage status based on payments
CREATE OR REPLACE FUNCTION public.update_payment_stage_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid numeric;
  stage_required numeric;
  target_stage_id uuid;
BEGIN
  -- Handle DELETE case
  IF TG_OP = 'DELETE' THEN
    target_stage_id := OLD.stage_id;
  ELSE
    target_stage_id := NEW.stage_id;
  END IF;
  
  -- Calculate total paid for this stage
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payment_transactions
  WHERE stage_id = target_stage_id;
  
  -- Get the required amount
  SELECT required_amount INTO stage_required
  FROM public.payment_stages
  WHERE id = target_stage_id;
  
  -- Update the stage with new paid amount and status
  UPDATE public.payment_stages
  SET 
    paid_amount = total_paid,
    status = CASE
      WHEN total_paid >= stage_required THEN 'completed'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE id = target_stage_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update stage status after payment transaction
CREATE TRIGGER on_payment_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_stage_status();

-- Function to update extra work status based on payments
CREATE OR REPLACE FUNCTION public.update_extra_work_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid numeric;
  work_amount numeric;
  target_work_id uuid;
BEGIN
  -- Handle DELETE case
  IF TG_OP = 'DELETE' THEN
    target_work_id := OLD.extra_work_id;
  ELSE
    target_work_id := NEW.extra_work_id;
  END IF;
  
  -- Calculate total paid for this extra work
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.extra_work_payments
  WHERE extra_work_id = target_work_id;
  
  -- Get the required amount
  SELECT amount INTO work_amount
  FROM public.extra_work
  WHERE id = target_work_id;
  
  -- Update the extra work with new paid amount and status
  UPDATE public.extra_work
  SET 
    paid_amount = total_paid,
    status = CASE
      WHEN total_paid >= work_amount THEN 'completed'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE id = target_work_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update extra work status after payment
CREATE TRIGGER on_extra_work_payment
AFTER INSERT OR UPDATE OR DELETE ON public.extra_work_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_extra_work_status();

-- Update updated_at triggers
CREATE TRIGGER update_project_costs_updated_at
BEFORE UPDATE ON public.project_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_stages_updated_at
BEFORE UPDATE ON public.payment_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extra_work_updated_at
BEFORE UPDATE ON public.extra_work
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();