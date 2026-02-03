-- Fix: Add authentication requirement to user_roles SELECT policy
-- This prevents unauthenticated users from viewing role assignments

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view relevant roles" ON public.user_roles;

-- Create a new SELECT policy with explicit authentication requirement
-- Uses TO authenticated to restrict to logged-in users only
CREATE POLICY "Users can view relevant roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR (
    (has_role(auth.uid(), 'design_head'::app_role) OR has_role(auth.uid(), 'execution_manager'::app_role)) 
    AND shares_project_with(auth.uid(), user_id)
  )
);