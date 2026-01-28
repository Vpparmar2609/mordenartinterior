-- Fix RLS policy for user_roles to allow design_head and execution_head to view team member roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view relevant roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (
    (user_id = auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'design_head'::app_role)
    OR has_role(auth.uid(), 'execution_head'::app_role)
    OR has_role(auth.uid(), 'execution_manager'::app_role)
  );