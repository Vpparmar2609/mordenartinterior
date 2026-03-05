
-- Create enum for task category
CREATE TYPE public.task_category AS ENUM ('designing', 'execution', 'account_manager');

-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('normal', 'urgent');

-- Create custom_tasks table
CREATE TABLE public.custom_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category task_category NOT NULL,
  priority task_priority NOT NULL DEFAULT 'normal',
  assigned_to UUID NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_tasks ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can manage custom tasks"
  ON public.custom_tasks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Team members on the project can view tasks
CREATE POLICY "Team can view custom tasks"
  ON public.custom_tasks FOR SELECT
  USING (
    public.is_on_project_team(auth.uid(), project_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- Assigned users can update their own tasks
CREATE POLICY "Assigned users can update custom tasks"
  ON public.custom_tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- Design head and execution manager can create tasks
CREATE POLICY "Heads can create custom tasks"
  ON public.custom_tasks FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'design_head')
    OR public.has_role(auth.uid(), 'execution_manager')
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_tasks;
