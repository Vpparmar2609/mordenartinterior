-- Drop the existing overly permissive SELECT policy on user_roles
DROP POLICY IF EXISTS "Users can view relevant roles" ON public.user_roles;

-- Create a helper function to check if two users share any project
CREATE OR REPLACE FUNCTION public.shares_project_with(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Both users are on the same project team
    SELECT 1 
    FROM public.project_team pt1
    JOIN public.project_team pt2 ON pt1.project_id = pt2.project_id
    WHERE pt1.user_id = _user_id AND pt2.user_id = _other_user_id
  )
  OR EXISTS (
    -- User is on a project where the other user is design_head or execution_manager
    SELECT 1
    FROM public.project_team pt
    JOIN public.projects p ON pt.project_id = p.id
    WHERE pt.user_id = _user_id 
      AND (p.design_head_id = _other_user_id OR p.execution_manager_id = _other_user_id OR p.created_by = _other_user_id)
  )
  OR EXISTS (
    -- User is design_head or execution_manager of a project where the other user is on the team
    SELECT 1
    FROM public.projects p
    JOIN public.project_team pt ON p.id = pt.project_id
    WHERE (p.design_head_id = _user_id OR p.execution_manager_id = _user_id OR p.created_by = _user_id)
      AND pt.user_id = _other_user_id
  )
  OR EXISTS (
    -- Both users are design_head/execution_manager/creator on the same project
    SELECT 1
    FROM public.projects p1
    JOIN public.projects p2 ON p1.id = p2.id
    WHERE (p1.design_head_id = _user_id OR p1.execution_manager_id = _user_id OR p1.created_by = _user_id)
      AND (p2.design_head_id = _other_user_id OR p2.execution_manager_id = _other_user_id OR p2.created_by = _other_user_id)
  )
$$;

-- Create new restrictive SELECT policy on user_roles
-- Users can view:
-- 1. Their own role
-- 2. All roles (if admin)
-- 3. Roles of users they share projects with (if design_head or execution_manager)
CREATE POLICY "Users can view relevant roles"
ON public.user_roles FOR SELECT
USING (
  -- Everyone can see their own role
  user_id = auth.uid()
  -- Admins can see all roles
  OR public.has_role(auth.uid(), 'admin')
  -- Design heads and execution managers can see roles of users on their projects
  OR (
    (public.has_role(auth.uid(), 'design_head') OR public.has_role(auth.uid(), 'execution_manager'))
    AND public.shares_project_with(auth.uid(), user_id)
  )
);