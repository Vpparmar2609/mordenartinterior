-- Update the projects SELECT policy to allow account managers to view all projects for financial tracking
DROP POLICY IF EXISTS "Team members can view active projects" ON public.projects;

CREATE POLICY "Team members can view active projects"
ON public.projects FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'account_manager'::app_role) OR
  ((lifecycle_status = 'active'::text) AND is_on_project_team(auth.uid(), id))
);

-- Also allow account managers to view all project-related payment data regardless of team assignment
-- (they already have access via role-based policies, this just ensures projects are visible)