
-- Add resolution tracking to custom_tasks
ALTER TABLE public.custom_tasks 
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Create custom_task_files table for file uploads on custom tasks
CREATE TABLE public.custom_task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.custom_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT
);

ALTER TABLE public.custom_task_files ENABLE ROW LEVEL SECURITY;

-- RLS: Team can view files for tasks on their projects
CREATE POLICY "Team can view custom task files" ON public.custom_task_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.custom_tasks ct 
      WHERE ct.id = custom_task_files.task_id 
      AND (is_on_project_team(auth.uid(), ct.project_id) OR has_role(auth.uid(), 'admin'))
    )
  );

-- RLS: Assigned users can upload files
CREATE POLICY "Assigned users can upload task files" ON public.custom_task_files
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- RLS: Admin and heads can approve/reject files
CREATE POLICY "Managers can update task files" ON public.custom_task_files
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'design_head') OR 
    has_role(auth.uid(), 'execution_manager')
  );

-- RLS: Admin and heads can delete files
CREATE POLICY "Managers can delete task files" ON public.custom_task_files
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'design_head') OR 
    has_role(auth.uid(), 'execution_manager')
  );

-- RLS: Uploaders can delete own files
CREATE POLICY "Uploaders can delete own task files" ON public.custom_task_files
  FOR DELETE USING (uploaded_by = auth.uid());

-- Create storage bucket for task files
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task-files bucket
CREATE POLICY "Auth users can upload task files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'task-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can view task files" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete task files" ON storage.objects
  FOR DELETE USING (bucket_id = 'task-files' AND auth.uid() IS NOT NULL);
