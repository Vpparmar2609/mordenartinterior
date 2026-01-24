-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor', 'client');

-- Create project status enum
CREATE TYPE public.project_status AS ENUM (
  'lead', 'design_in_progress', 'design_approval_pending', 'design_approved',
  'execution_started', 'work_in_progress', 'finishing', 'handover_pending', 'snag_fix', 'completed'
);

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'revision');

-- Create issue severity enum
CREATE TYPE public.issue_severity AS ENUM ('low', 'medium', 'high');

-- Create issue status enum
CREATE TYPE public.issue_status AS ENUM ('open', 'in_progress', 'resolved');

-- Profiles table (stores additional user info)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  location TEXT NOT NULL,
  flat_size TEXT NOT NULL,
  bhk TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  start_date DATE NOT NULL,
  deadline DATE NOT NULL,
  design_head_id UUID REFERENCES auth.users(id),
  execution_head_id UUID REFERENCES auth.users(id),
  client_user_id UUID REFERENCES auth.users(id),
  status project_status NOT NULL DEFAULT 'lead',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project team assignments (designers, managers, supervisors)
CREATE TABLE public.project_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE (project_id, user_id)
);

-- Design tasks table (15-step checklist)
CREATE TABLE public.design_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  status task_status NOT NULL DEFAULT 'pending',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Design task files
CREATE TABLE public.design_task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.design_tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Execution tasks table (15-step checklist)
CREATE TABLE public.execution_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  status task_status NOT NULL DEFAULT 'pending',
  expected_date DATE,
  completed_date DATE,
  notes TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Execution task photos
CREATE TABLE public.execution_task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.execution_tasks(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily reports from site supervisors
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_done TEXT NOT NULL,
  workers_count INTEGER NOT NULL DEFAULT 0,
  materials_received TEXT,
  next_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily report photos
CREATE TABLE public.daily_report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Issues tracking
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity issue_severity NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'open',
  resolution_comment TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project conversations/chat
CREATE TABLE public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client feedback and snag list
CREATE TABLE public.client_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snag items from client feedback
CREATE TABLE public.snag_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.client_feedback(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approvals tracking
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user is on project team
CREATE OR REPLACE FUNCTION public.is_on_project_team(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_team WHERE user_id = _user_id AND project_id = _project_id
  ) OR EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND (
      design_head_id = _user_id OR 
      execution_head_id = _user_id OR 
      client_user_id = _user_id OR
      created_by = _user_id
    )
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- User roles policies (only admins can manage roles)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Projects policies
CREATE POLICY "Team members can view projects" ON public.projects FOR SELECT TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_on_project_team(auth.uid(), id)
  );
CREATE POLICY "Admin and heads can create projects" ON public.projects FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin and heads can update projects" ON public.projects FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    design_head_id = auth.uid() OR
    execution_head_id = auth.uid()
  );

-- Project team policies
CREATE POLICY "Team members can view team" ON public.project_team FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Heads can manage team" ON public.project_team FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'design_head') OR
    public.has_role(auth.uid(), 'execution_head')
  );
CREATE POLICY "Heads can update team" ON public.project_team FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'design_head') OR
    public.has_role(auth.uid(), 'execution_head')
  );
CREATE POLICY "Heads can remove team" ON public.project_team FOR DELETE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'design_head') OR
    public.has_role(auth.uid(), 'execution_head')
  );

-- Design tasks policies
CREATE POLICY "Team can view design tasks" ON public.design_tasks FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Designers can manage design tasks" ON public.design_tasks FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'design_head') OR
    public.has_role(auth.uid(), 'designer')
  );
CREATE POLICY "Designers can update design tasks" ON public.design_tasks FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'design_head') OR
    assigned_to = auth.uid()
  );

-- Design task files policies
CREATE POLICY "Team can view design files" ON public.design_task_files FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.design_tasks dt 
      WHERE dt.id = task_id AND public.is_on_project_team(auth.uid(), dt.project_id)
    ) OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Designers can upload files" ON public.design_task_files FOR INSERT TO authenticated 
  WITH CHECK (uploaded_by = auth.uid());

-- Execution tasks policies
CREATE POLICY "Team can view execution tasks" ON public.execution_tasks FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Execution team can manage tasks" ON public.execution_tasks FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'execution_head') OR
    public.has_role(auth.uid(), 'execution_manager')
  );
CREATE POLICY "Execution team can update tasks" ON public.execution_tasks FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'execution_head') OR
    public.has_role(auth.uid(), 'execution_manager') OR
    assigned_to = auth.uid()
  );

-- Execution task photos policies
CREATE POLICY "Team can view execution photos" ON public.execution_task_photos FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.execution_tasks et 
      WHERE et.id = task_id AND public.is_on_project_team(auth.uid(), et.project_id)
    ) OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Supervisors can upload photos" ON public.execution_task_photos FOR INSERT TO authenticated 
  WITH CHECK (uploaded_by = auth.uid());

-- Daily reports policies
CREATE POLICY "Team can view reports" ON public.daily_reports FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can create reports" ON public.daily_reports FOR INSERT TO authenticated 
  WITH CHECK (reported_by = auth.uid());

-- Daily report photos policies
CREATE POLICY "Team can view report photos" ON public.daily_report_photos FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_reports dr 
      WHERE dr.id = report_id AND public.is_on_project_team(auth.uid(), dr.project_id)
    ) OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Reporters can upload photos" ON public.daily_report_photos FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Issues policies
CREATE POLICY "Team can view issues" ON public.issues FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Team can report issues" ON public.issues FOR INSERT TO authenticated 
  WITH CHECK (reported_by = auth.uid());
CREATE POLICY "Assigned or heads can update issues" ON public.issues FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'execution_head') OR
    public.has_role(auth.uid(), 'execution_manager') OR
    assigned_to = auth.uid()
  );

-- Project messages policies
CREATE POLICY "Team can view messages" ON public.project_messages FOR SELECT TO authenticated 
  USING (
    (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin')) AND
    (is_internal = false OR NOT public.has_role(auth.uid(), 'client'))
  );
CREATE POLICY "Team can send messages" ON public.project_messages FOR INSERT TO authenticated 
  WITH CHECK (sender_id = auth.uid() AND public.is_on_project_team(auth.uid(), project_id));

-- Client feedback policies
CREATE POLICY "Team can view feedback" ON public.client_feedback FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can submit feedback" ON public.client_feedback FOR INSERT TO authenticated 
  WITH CHECK (client_id = auth.uid());

-- Snag items policies
CREATE POLICY "Team can view snags" ON public.snag_items FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Feedback owners can create snags" ON public.snag_items FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_feedback cf 
      WHERE cf.id = feedback_id AND cf.client_id = auth.uid()
    )
  );
CREATE POLICY "Supervisors can update snags" ON public.snag_items FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'execution_head') OR
    public.has_role(auth.uid(), 'execution_manager') OR
    assigned_to = auth.uid()
  );

-- Approvals policies
CREATE POLICY "Team can view approvals" ON public.approvals FOR SELECT TO authenticated 
  USING (public.is_on_project_team(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Team can request approvals" ON public.approvals FOR INSERT TO authenticated 
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Heads can respond to approvals" ON public.approvals FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'design_head') OR
    public.has_role(auth.uid(), 'execution_head')
  );

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_design_tasks_updated_at BEFORE UPDATE ON public.design_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_execution_tasks_updated_at BEFORE UPDATE ON public.execution_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();