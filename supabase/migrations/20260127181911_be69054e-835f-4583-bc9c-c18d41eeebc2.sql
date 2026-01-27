-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- System can insert notifications (via triggers/functions)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create storage bucket for design files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('design-files', 'design-files', false);

-- Create storage bucket for execution photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('execution-photos', 'execution-photos', false);

-- Storage policies for design-files bucket
-- Designers can upload files
CREATE POLICY "Designers can upload design files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'design-files' 
    AND (
      has_role(auth.uid(), 'admin') 
      OR has_role(auth.uid(), 'design_head') 
      OR has_role(auth.uid(), 'designer')
    )
  );

-- Team members can view design files
CREATE POLICY "Team can view design files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'design-files'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'design_head')
      OR has_role(auth.uid(), 'designer')
      OR has_role(auth.uid(), 'execution_head')
      OR has_role(auth.uid(), 'client')
    )
  );

-- Storage policies for execution-photos bucket
-- Execution team can upload photos
CREATE POLICY "Execution team can upload photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'execution-photos'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'execution_head')
      OR has_role(auth.uid(), 'execution_manager')
      OR has_role(auth.uid(), 'site_supervisor')
    )
  );

-- Team can view execution photos
CREATE POLICY "Team can view execution photos"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'execution-photos'
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'execution_head')
      OR has_role(auth.uid(), 'execution_manager')
      OR has_role(auth.uid(), 'site_supervisor')
      OR has_role(auth.uid(), 'client')
    )
  );

-- Create function to notify user on project team assignment
CREATE OR REPLACE FUNCTION public.notify_on_project_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_name text;
BEGIN
  -- Get project client name
  SELECT client_name INTO project_name 
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  -- Insert notification for assigned user
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
$$;

-- Create trigger for project team assignments
CREATE TRIGGER on_project_team_insert
  AFTER INSERT ON public.project_team
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_project_assignment();

-- Create function to notify on issue creation
CREATE OR REPLACE FUNCTION public.notify_on_issue_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Get project details
  SELECT client_name, execution_head_id INTO project_record
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  -- Notify execution head if exists
  IF project_record.execution_head_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_record.execution_head_id,
      'issue_raised',
      'New Issue Reported',
      'A ' || NEW.severity || ' severity issue was reported for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/issues'
    );
  END IF;
  
  -- Notify assigned person if different from reporter
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
$$;

-- Create trigger for issue creation
CREATE TRIGGER on_issue_insert
  AFTER INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_issue_created();

-- Create function to notify on approval request
CREATE OR REPLACE FUNCTION public.notify_on_approval_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Get project details
  SELECT client_name, design_head_id, execution_head_id INTO project_record
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  -- For design approvals, notify design head
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
  
  -- For execution approvals, notify execution head
  IF NEW.approval_type LIKE 'execution%' AND project_record.execution_head_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_record.execution_head_id,
      'approval_requested',
      'Approval Requested',
      'Execution approval requested for: ' || COALESCE(project_record.client_name, 'Unknown'),
      '/approvals'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for approval requests
CREATE TRIGGER on_approval_insert
  AFTER INSERT ON public.approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_approval_request();

-- Create function to notify on approval response
CREATE OR REPLACE FUNCTION public.notify_on_approval_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_name text;
BEGIN
  -- Only trigger when status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    -- Get project name
    SELECT client_name INTO project_name 
    FROM public.projects 
    WHERE id = NEW.project_id;
    
    -- Notify the requester
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
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

-- Create trigger for approval responses
CREATE TRIGGER on_approval_update
  AFTER UPDATE ON public.approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_approval_response();