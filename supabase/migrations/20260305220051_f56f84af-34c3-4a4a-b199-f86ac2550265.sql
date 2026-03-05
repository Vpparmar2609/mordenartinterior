
-- Drop existing SELECT policy on custom_tasks
DROP POLICY IF EXISTS "Team can view custom tasks" ON public.custom_tasks;

-- New SELECT policy: account_manager tasks only visible to admin + account_manager
-- designing/execution tasks visible to project team members + admin
CREATE POLICY "Filtered view custom tasks"
ON public.custom_tasks
FOR SELECT
TO authenticated
USING (
  CASE 
    WHEN category = 'account_manager' THEN
      (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
    ELSE
      (is_on_project_team(auth.uid(), project_id) OR has_role(auth.uid(), 'admin'::app_role))
  END
);

-- Drop existing INSERT policy for heads and replace with one that includes execution_manager
DROP POLICY IF EXISTS "Heads can create custom tasks" ON public.custom_tasks;

CREATE POLICY "Heads can create custom tasks"
ON public.custom_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'design_head'::app_role) 
  OR has_role(auth.uid(), 'execution_manager'::app_role)
);
