-- Create urgent tasks table
CREATE TABLE public.urgent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'high' CHECK (priority IN ('high', 'critical')),
  assigned_to uuid NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.urgent_tasks ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can manage urgent tasks"
ON public.urgent_tasks
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Assigned users can view their urgent tasks
CREATE POLICY "Assigned users can view urgent tasks"
ON public.urgent_tasks
FOR SELECT
USING (assigned_to = auth.uid());

-- Assigned users can update status
CREATE POLICY "Assigned users can update urgent tasks"
ON public.urgent_tasks
FOR UPDATE
USING (assigned_to = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_urgent_tasks_updated_at
BEFORE UPDATE ON public.urgent_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();