-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Admin and Accountant can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
);

CREATE POLICY "Admin and Accountant can view payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
);

CREATE POLICY "Admin and Accountant can delete payment proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-proofs' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
);

-- Add proof_url column to payment_transactions
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS proof_url TEXT DEFAULT NULL;

-- Add proof_url column to extra_work_payments
ALTER TABLE public.extra_work_payments 
ADD COLUMN IF NOT EXISTS proof_url TEXT DEFAULT NULL;

-- Allow DELETE on payment_transactions for reversals
CREATE POLICY "Admin and Accountant can delete transactions"
ON public.payment_transactions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role));

-- Allow DELETE on extra_work_payments for reversals
CREATE POLICY "Admin and Accountant can delete extra work payments"
ON public.extra_work_payments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role));