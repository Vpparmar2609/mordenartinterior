
-- Vendor extra work table
CREATE TABLE public.vendor_extra_work (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_extra_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage vendor extra work" ON public.vendor_extra_work FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accountant can view vendor extra work" ON public.vendor_extra_work FOR SELECT
  USING (has_role(auth.uid(), 'account_manager'::app_role));

-- Vendor extra work payments table
CREATE TABLE public.vendor_extra_work_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_extra_work_id UUID NOT NULL REFERENCES public.vendor_extra_work(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  proof_url TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_extra_work_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin or accountant can view vendor extra work payments" ON public.vendor_extra_work_payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Admin can manage vendor extra work payments" ON public.vendor_extra_work_payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Assigned accountant can insert vendor extra work payments" ON public.vendor_extra_work_payments FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role) AND EXISTS (
    SELECT 1 FROM vendor_extra_work vew WHERE vew.id = vendor_extra_work_payments.vendor_extra_work_id AND is_on_project_team(auth.uid(), vew.project_id)
  ));

CREATE POLICY "Assigned accountant can update vendor extra work payments" ON public.vendor_extra_work_payments FOR UPDATE
  USING (has_role(auth.uid(), 'account_manager'::app_role) AND EXISTS (
    SELECT 1 FROM vendor_extra_work vew WHERE vew.id = vendor_extra_work_payments.vendor_extra_work_id AND is_on_project_team(auth.uid(), vew.project_id)
  ));

CREATE POLICY "Assigned accountant can delete vendor extra work payments" ON public.vendor_extra_work_payments FOR DELETE
  USING (has_role(auth.uid(), 'account_manager'::app_role) AND EXISTS (
    SELECT 1 FROM vendor_extra_work vew WHERE vew.id = vendor_extra_work_payments.vendor_extra_work_id AND is_on_project_team(auth.uid(), vew.project_id)
  ));

-- Trigger to update paid_amount and status on vendor_extra_work
CREATE OR REPLACE FUNCTION public.update_vendor_extra_work_paid()
RETURNS TRIGGER AS $$
DECLARE
  total NUMERIC;
  work_amount NUMERIC;
  work_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    work_id := OLD.vendor_extra_work_id;
  ELSE
    work_id := NEW.vendor_extra_work_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO total FROM vendor_extra_work_payments WHERE vendor_extra_work_id = work_id;
  SELECT amount INTO work_amount FROM vendor_extra_work WHERE id = work_id;

  UPDATE vendor_extra_work SET
    paid_amount = total,
    status = CASE WHEN total >= work_amount THEN 'completed' WHEN total > 0 THEN 'partial' ELSE 'pending' END,
    updated_at = now()
  WHERE id = work_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_vendor_extra_work_paid_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vendor_extra_work_payments
FOR EACH ROW EXECUTE FUNCTION public.update_vendor_extra_work_paid();
