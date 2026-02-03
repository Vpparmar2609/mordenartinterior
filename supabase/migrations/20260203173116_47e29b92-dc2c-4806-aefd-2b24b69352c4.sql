-- Update payment_transactions policies:
-- All account managers can VIEW all transactions
-- Only assigned account managers can INSERT/UPDATE/DELETE

-- Drop existing policies
DROP POLICY IF EXISTS "Accountant can view assigned project transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Accountant can insert transactions for assigned projects" ON public.payment_transactions;
DROP POLICY IF EXISTS "Accountant can update transactions for assigned projects" ON public.payment_transactions;
DROP POLICY IF EXISTS "Accountant can delete transactions for assigned projects" ON public.payment_transactions;

-- All account managers can view all payment transactions
CREATE POLICY "Account managers can view all transactions"
ON public.payment_transactions FOR SELECT
USING (public.has_role(auth.uid(), 'account_manager'));

-- Only assigned account managers can insert transactions
CREATE POLICY "Assigned account managers can insert transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'account_manager') 
  AND public.is_on_project_team(auth.uid(), project_id)
);

-- Only assigned account managers can update transactions
CREATE POLICY "Assigned account managers can update transactions"
ON public.payment_transactions FOR UPDATE
USING (
  public.has_role(auth.uid(), 'account_manager') 
  AND public.is_on_project_team(auth.uid(), project_id)
);

-- Only assigned account managers can delete transactions
CREATE POLICY "Assigned account managers can delete transactions"
ON public.payment_transactions FOR DELETE
USING (
  public.has_role(auth.uid(), 'account_manager') 
  AND public.is_on_project_team(auth.uid(), project_id)
);

-- Update extra_work_payments policies similarly
DROP POLICY IF EXISTS "Admin and Accountant can manage extra work payments" ON public.extra_work_payments;
DROP POLICY IF EXISTS "Admin and Accountant can delete extra work payments" ON public.extra_work_payments;

-- All account managers can view extra work payments
CREATE POLICY "Account managers can view extra work payments"
ON public.extra_work_payments FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'account_manager')
);

-- Only assigned account managers can insert extra work payments (check via extra_work -> project_id)
CREATE POLICY "Assigned account managers can insert extra work payments"
ON public.extra_work_payments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'account_manager')
    AND EXISTS (
      SELECT 1 FROM public.extra_work ew 
      WHERE ew.id = extra_work_id 
      AND public.is_on_project_team(auth.uid(), ew.project_id)
    )
  )
);

-- Only assigned account managers can update extra work payments
CREATE POLICY "Assigned account managers can update extra work payments"
ON public.extra_work_payments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'account_manager')
    AND EXISTS (
      SELECT 1 FROM public.extra_work ew 
      WHERE ew.id = extra_work_id 
      AND public.is_on_project_team(auth.uid(), ew.project_id)
    )
  )
);

-- Only assigned account managers can delete extra work payments
CREATE POLICY "Assigned account managers can delete extra work payments"
ON public.extra_work_payments FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'account_manager')
    AND EXISTS (
      SELECT 1 FROM public.extra_work ew 
      WHERE ew.id = extra_work_id 
      AND public.is_on_project_team(auth.uid(), ew.project_id)
    )
  )
);