-- Fix the overly permissive INSERT policy on notifications table
-- Replace WITH CHECK (true) with proper role-based restriction

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a secure wrapper function for system-generated notifications
CREATE OR REPLACE FUNCTION public.create_system_notification(
  _user_id uuid,
  _type text,
  _title text,
  _message text,
  _link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (_user_id, _type, _title, _message, _link);
END;
$$;

-- Create restrictive INSERT policy - only admins can manually insert
CREATE POLICY "Only admins can insert notifications"
ON public.notifications FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger functions to use the secure wrapper function

-- Update notify_on_project_assignment trigger function
CREATE OR REPLACE FUNCTION public.notify_on_project_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_name text;
BEGIN
  SELECT client_name INTO project_name 
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  PERFORM public.create_system_notification(
    NEW.user_id,
    'project_assigned',
    'New Project Assigned',
    'You have been assigned to project: ' || COALESCE(project_name, 'Unknown'),
    '/projects/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$$;

-- Update notify_on_issue_created trigger function
CREATE OR REPLACE FUNCTION public.notify_on_issue_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
BEGIN
  SELECT client_name, execution_manager_id INTO project_record
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  IF project_record.execution_manager_id IS NOT NULL THEN
    PERFORM public.create_system_notification(
      project_record.execution_manager_id,
      'issue_raised',
      'New Issue Reported',
      'A ' || NEW.severity || ' severity issue was reported for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/issues'
    );
  END IF;
  
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.reported_by THEN
    PERFORM public.create_system_notification(
      NEW.assigned_to,
      'issue_raised',
      'Issue Assigned to You',
      'You have been assigned an issue for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/issues'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update notify_on_approval_request trigger function
CREATE OR REPLACE FUNCTION public.notify_on_approval_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
BEGIN
  SELECT client_name, design_head_id, execution_manager_id INTO project_record
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  IF NEW.approval_type LIKE 'design%' AND project_record.design_head_id IS NOT NULL THEN
    PERFORM public.create_system_notification(
      project_record.design_head_id,
      'approval_requested',
      'Approval Requested',
      'Design approval requested for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/approvals'
    );
  END IF;
  
  IF NEW.approval_type LIKE 'execution%' AND project_record.execution_manager_id IS NOT NULL THEN
    PERFORM public.create_system_notification(
      project_record.execution_manager_id,
      'approval_requested',
      'Approval Requested',
      'Execution approval requested for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/approvals'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update notify_on_approval_response trigger function
CREATE OR REPLACE FUNCTION public.notify_on_approval_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    SELECT client_name INTO project_name 
    FROM public.projects 
    WHERE id = NEW.project_id;
    
    PERFORM public.create_system_notification(
      NEW.requested_by,
      'approval_responded',
      CASE WHEN NEW.status = 'approved' THEN 'Approval Granted' ELSE 'Approval Rejected' END,
      'Your ' || NEW.approval_type || ' for ' || COALESCE(project_name, 'project') || ' was ' || NEW.status,
      '/approvals'
    );
  END IF;
  
  RETURN NEW;
END;
$$;