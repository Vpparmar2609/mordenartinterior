-- Add admin full access to payment_transactions
CREATE POLICY "Admin can manage payment transactions"
ON public.payment_transactions
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow account managers to view ALL transactions (global visibility)
DROP POLICY IF EXISTS "Assigned account managers can view transactions" ON public.payment_transactions;
CREATE POLICY "Account managers can view all transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'account_manager'::app_role));