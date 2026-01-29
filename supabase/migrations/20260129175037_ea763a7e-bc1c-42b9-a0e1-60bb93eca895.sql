-- Step 1: Migrate existing execution_head users to execution_manager
UPDATE public.user_roles 
SET role = 'execution_manager'::app_role 
WHERE role = 'execution_head'::app_role;

-- Step 2: Update projects to use execution_manager instead of execution_head
-- First, we need to handle the execution_head_id column - rename it to execution_manager_id
ALTER TABLE public.projects RENAME COLUMN execution_head_id TO execution_manager_id;

-- Step 3: Update project_team entries from execution_head to execution_manager
UPDATE public.project_team 
SET role = 'execution_manager'::app_role 
WHERE role = 'execution_head'::app_role;

-- Step 4: Remove client role from project_team
DELETE FROM public.project_team WHERE role = 'client'::app_role;

-- Step 5: Remove client role from user_roles
DELETE FROM public.user_roles WHERE role = 'client'::app_role;

-- Step 6: Drop and recreate the app_role enum without client and execution_head
-- First, we need to update all RLS policies and functions that reference the old enum

-- Update has_role function to handle new roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update is_on_project_team to use execution_manager_id instead of execution_head_id
CREATE OR REPLACE FUNCTION public.is_on_project_team(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_team WHERE user_id = _user_id AND project_id = _project_id
  ) OR EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND (
      design_head_id = _user_id OR 
      execution_manager_id = _user_id OR 
      created_by = _user_id
    )
  )
$$;

-- Update RLS policies for projects
DROP POLICY IF EXISTS "Admin and heads can update projects" ON public.projects;
CREATE POLICY "Admin and heads can update projects" ON public.projects
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  ((lifecycle_status = 'active'::text) AND (
    (design_head_id = auth.uid()) OR 
    (execution_manager_id = auth.uid())
  ))
);

DROP POLICY IF EXISTS "Team members can view active projects" ON public.projects;
CREATE POLICY "Team members can view active projects" ON public.projects
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  ((lifecycle_status = 'active'::text) AND is_on_project_team(auth.uid(), id))
);

-- Update RLS policy for project_messages (remove client restriction)
DROP POLICY IF EXISTS "Team can view messages" ON public.project_messages;
CREATE POLICY "Team can view messages" ON public.project_messages
FOR SELECT USING (
  is_on_project_team(auth.uid(), project_id) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update RLS policies for design_task_files - execution_manager can now approve
DROP POLICY IF EXISTS "Heads can approve design files" ON public.design_task_files;
CREATE POLICY "Heads can approve design files" ON public.design_task_files
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'design_head'::app_role)
);

-- Update RLS policies for execution_task_photos
DROP POLICY IF EXISTS "Heads can approve execution photos" ON public.execution_task_photos;
CREATE POLICY "Heads can approve execution photos" ON public.execution_task_photos
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'execution_manager'::app_role)
);

-- Update approvals RLS policy
DROP POLICY IF EXISTS "Heads can respond to approvals" ON public.approvals;
CREATE POLICY "Heads can respond to approvals" ON public.approvals
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'design_head'::app_role) OR 
  has_role(auth.uid(), 'execution_manager'::app_role)
);

-- Update issues RLS policy
DROP POLICY IF EXISTS "Assigned or heads can update issues" ON public.issues;
CREATE POLICY "Assigned or heads can update issues" ON public.issues
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'execution_manager'::app_role) OR 
  (assigned_to = auth.uid())
);

-- Update project_team RLS policies
DROP POLICY IF EXISTS "Heads can manage team" ON public.project_team;
CREATE POLICY "Heads can manage team" ON public.project_team
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'design_head'::app_role) OR 
  has_role(auth.uid(), 'execution_manager'::app_role)
);

DROP POLICY IF EXISTS "Heads can remove team" ON public.project_team;
CREATE POLICY "Heads can remove team" ON public.project_team
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'design_head'::app_role) OR 
  has_role(auth.uid(), 'execution_manager'::app_role)
);

DROP POLICY IF EXISTS "Heads can update team" ON public.project_team;
CREATE POLICY "Heads can update team" ON public.project_team
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'design_head'::app_role) OR 
  has_role(auth.uid(), 'execution_manager'::app_role)
);

-- Update user_roles RLS policy
DROP POLICY IF EXISTS "Users can view relevant roles" ON public.user_roles;
CREATE POLICY "Users can view relevant roles" ON public.user_roles
FOR SELECT USING (
  (user_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'design_head'::app_role) OR 
  has_role(auth.uid(), 'execution_manager'::app_role)
);

-- Update notification trigger for project assignment
CREATE OR REPLACE FUNCTION public.notify_on_project_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  project_name text;
BEGIN
  SELECT client_name INTO project_name 
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'project_assigned',
    'New Project Assigned',
    'You have been assigned to project: ' || COALESCE(project_name, 'Unknown'),
    '/projects/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$function$;

-- Update issue notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_issue_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  project_record RECORD;
BEGIN
  SELECT client_name, execution_manager_id INTO project_record
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  IF project_record.execution_manager_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_record.execution_manager_id,
      'issue_raised',
      'New Issue Reported',
      'A ' || NEW.severity || ' severity issue was reported for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/issues'
    );
  END IF;
  
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.reported_by THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.assigned_to,
      'issue_raised',
      'Issue Assigned to You',
      'You have been assigned an issue for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/issues'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update approval notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_approval_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  project_record RECORD;
BEGIN
  SELECT client_name, design_head_id, execution_manager_id INTO project_record
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  IF NEW.approval_type LIKE 'design%' AND project_record.design_head_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_record.design_head_id,
      'approval_requested',
      'Approval Requested',
      'Design approval requested for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/approvals'
    );
  END IF;
  
  IF NEW.approval_type LIKE 'execution%' AND project_record.execution_manager_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_record.execution_manager_id,
      'approval_requested',
      'Approval Requested',
      'Execution approval requested for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/approvals'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;