
-- Create vendor payment stages enum
CREATE TYPE public.vendor_payment_stage AS ENUM (
  'pop_work',
  'material_unload',
  'raw_work',
  'laminate_work',
  'color_fabric',
  'final_inspection'
);

-- Vendor cost per project (like project_costs but for vendor side)
CREATE TABLE public.vendor_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  total_cost numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE public.vendor_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage vendor costs"
  ON public.vendor_costs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accountant can view vendor costs"
  ON public.vendor_costs FOR SELECT
  USING (has_role(auth.uid(), 'account_manager'::app_role));

-- Vendor payment stages (milestone tracking)
CREATE TABLE public.vendor_payment_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage vendor_payment_stage NOT NULL,
  percentage numeric NOT NULL,
  required_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage)
);

ALTER TABLE public.vendor_payment_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage vendor payment stages"
  ON public.vendor_payment_stages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accountant can view vendor payment stages"
  ON public.vendor_payment_stages FOR SELECT
  USING (has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Accountant can update vendor payment stages"
  ON public.vendor_payment_stages FOR UPDATE
  USING (has_role(auth.uid(), 'account_manager'::app_role));

-- Vendor payment transactions
CREATE TABLE public.vendor_payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.vendor_payment_stages(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference_number text,
  notes text,
  proof_url text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage vendor transactions"
  ON public.vendor_payment_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Assigned accountant can view vendor transactions"
  ON public.vendor_payment_transactions FOR SELECT
  USING (has_role(auth.uid(), 'account_manager'::app_role) AND is_on_project_team(auth.uid(), project_id));

CREATE POLICY "Assigned accountant can insert vendor transactions"
  ON public.vendor_payment_transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role) AND is_on_project_team(auth.uid(), project_id));

CREATE POLICY "Assigned accountant can update vendor transactions"
  ON public.vendor_payment_transactions FOR UPDATE
  USING (has_role(auth.uid(), 'account_manager'::app_role) AND is_on_project_team(auth.uid(), project_id));

CREATE POLICY "Assigned accountant can delete vendor transactions"
  ON public.vendor_payment_transactions FOR DELETE
  USING (has_role(auth.uid(), 'account_manager'::app_role) AND is_on_project_team(auth.uid(), project_id));

-- Trigger to auto-create vendor payment stages when vendor cost is set
CREATE OR REPLACE FUNCTION public.create_vendor_payment_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.vendor_payment_stages (project_id, stage, percentage, required_amount)
  VALUES
    (NEW.project_id, 'pop_work', 10, NEW.total_cost * 0.10),
    (NEW.project_id, 'material_unload', 20, NEW.total_cost * 0.20),
    (NEW.project_id, 'raw_work', 20, NEW.total_cost * 0.20),
    (NEW.project_id, 'laminate_work', 20, NEW.total_cost * 0.20),
    (NEW.project_id, 'color_fabric', 20, NEW.total_cost * 0.20),
    (NEW.project_id, 'final_inspection', 10, NEW.total_cost * 0.10)
  ON CONFLICT (project_id, stage) DO UPDATE SET
    required_amount = EXCLUDED.required_amount,
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vendor_cost_change
  AFTER INSERT OR UPDATE ON public.vendor_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_vendor_payment_stages();

-- Trigger to update vendor stage status when transactions change
CREATE OR REPLACE FUNCTION public.update_vendor_payment_stage_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_paid numeric;
  stage_required numeric;
  target_stage_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_stage_id := OLD.stage_id;
  ELSE
    target_stage_id := NEW.stage_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.vendor_payment_transactions
  WHERE stage_id = target_stage_id;

  SELECT required_amount INTO stage_required
  FROM public.vendor_payment_stages
  WHERE id = target_stage_id;

  UPDATE public.vendor_payment_stages
  SET
    paid_amount = total_paid,
    status = CASE
      WHEN total_paid >= stage_required THEN 'completed'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE id = target_stage_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vendor_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_payment_stage_status();
