-- Add lifecycle_status column to projects table
ALTER TABLE public.projects 
ADD COLUMN lifecycle_status text NOT NULL DEFAULT 'active' 
CHECK (lifecycle_status IN ('active', 'stopped'));

-- Create policy for admin to delete projects permanently
CREATE POLICY "Admin can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Update the SELECT policy to only show active projects (except for admin)
DROP POLICY IF EXISTS "Team members can view projects" ON public.projects;

CREATE POLICY "Team members can view active projects" 
ON public.projects 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') 
  OR (
    lifecycle_status = 'active' 
    AND is_on_project_team(auth.uid(), id)
  )
);

-- Admin can update lifecycle_status
DROP POLICY IF EXISTS "Admin and heads can update projects" ON public.projects;

CREATE POLICY "Admin and heads can update projects" 
ON public.projects 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin') 
  OR (lifecycle_status = 'active' AND (design_head_id = auth.uid() OR execution_head_id = auth.uid()))
);