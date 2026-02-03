-- Drop existing overly permissive policies on payment_transactions
DROP POLICY IF EXISTS "Admin and Accountant can manage transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admin and Accountant can delete transactions" ON public.payment_transactions;

-- Create new project-scoped SELECT policy for account managers only
-- Account managers can only view transactions for projects they're assigned to
CREATE POLICY "Accountant can view assigned project transactions"
ON public.payment_transactions FOR SELECT
USING (
  public.has_role(auth.uid(), 'account_manager')
  AND public.is_on_project_team(auth.uid(), project_id)
);

-- Create new project-scoped INSERT policy for account managers only
CREATE POLICY "Accountant can insert transactions for assigned projects"
ON public.payment_transactions FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'account_manager')
  AND public.is_on_project_team(auth.uid(), project_id)
);

-- Create new project-scoped UPDATE policy for account managers only
CREATE POLICY "Accountant can update transactions for assigned projects"
ON public.payment_transactions FOR UPDATE
USING (
  public.has_role(auth.uid(), 'account_manager')
  AND public.is_on_project_team(auth.uid(), project_id)
);

-- Create new project-scoped DELETE policy for account managers only
CREATE POLICY "Accountant can delete transactions for assigned projects"
ON public.payment_transactions FOR DELETE
USING (
  public.has_role(auth.uid(), 'account_manager')
  AND public.is_on_project_team(auth.uid(), project_id)
);