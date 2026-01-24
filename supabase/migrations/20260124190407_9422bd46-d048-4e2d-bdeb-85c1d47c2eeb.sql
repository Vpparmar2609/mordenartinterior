-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop the permissive policy and create a proper one
DROP POLICY IF EXISTS "Reporters can upload photos" ON public.daily_report_photos;

-- Create proper policy that checks ownership through the report
CREATE POLICY "Reporters can upload photos" ON public.daily_report_photos FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_reports dr 
      WHERE dr.id = report_id AND dr.reported_by = auth.uid()
    )
  );