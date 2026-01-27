-- 1) Ensure each project has a single, idempotent 15-step checklist
CREATE UNIQUE INDEX IF NOT EXISTS design_tasks_project_order_unique
  ON public.design_tasks (project_id, order_index);

CREATE UNIQUE INDEX IF NOT EXISTS execution_tasks_project_order_unique
  ON public.execution_tasks (project_id, order_index);

-- 2) Helpers to insert default tasks (safe to call multiple times)
CREATE OR REPLACE FUNCTION public.insert_default_design_tasks(_project_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.design_tasks (project_id, order_index, name, status, updated_at)
  SELECT _project_id, v.order_index, v.name, 'pending'::task_status, now()
  FROM (VALUES
    (1,  'Living room 3D'),
    (2,  'Kitchen 3D'),
    (3,  'Bedroom 1 3D'),
    (4,  'Bedroom 2 3D'),
    (5,  'Master bedroom 3D'),
    (6,  'TV unit view'),
    (7,  'Wardrobe elevation'),
    (8,  'Kitchen layout 2D'),
    (9,  'Electrical layout plan'),
    (10, 'False ceiling plan'),
    (11, 'Material board'),
    (12, 'Color palette'),
    (13, 'Furniture plan'),
    (14, 'Partition design'),
    (15, 'Final walkthrough renders')
  ) AS v(order_index, name)
  ON CONFLICT (project_id, order_index) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.insert_default_execution_tasks(_project_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.execution_tasks (project_id, order_index, name, status, updated_at)
  SELECT _project_id, v.order_index, v.name, 'pending'::task_status, now()
  FROM (VALUES
    (1,  'POP/False ceiling start'),
    (2,  'Electrical marking'),
    (3,  'Wiring completed'),
    (4,  'Plumbing points checked'),
    (5,  'Modular kitchen base installed'),
    (6,  'Kitchen shutters installed'),
    (7,  'Wardrobe structure ready'),
    (8,  'Wardrobe shutters + handles'),
    (9,  'TV unit installation'),
    (10, 'Painting started'),
    (11, 'Paint completed'),
    (12, 'Lights installation'),
    (13, 'Cleaning + polish'),
    (14, 'Final QC check'),
    (15, 'Handover ready')
  ) AS v(order_index, name)
  ON CONFLICT (project_id, order_index) DO NOTHING;
$$;

-- 3) Auto-create checklists whenever a project is created
CREATE OR REPLACE FUNCTION public.handle_project_insert_create_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.insert_default_design_tasks(NEW.id);
  PERFORM public.insert_default_execution_tasks(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_default_tasks_after_project_insert ON public.projects;
CREATE TRIGGER create_default_tasks_after_project_insert
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_project_insert_create_tasks();

-- 4) Backfill checklists for existing projects (including your already-created projects)
DO $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT id FROM public.projects) LOOP
    PERFORM public.insert_default_design_tasks(r.id);
    PERFORM public.insert_default_execution_tasks(r.id);
  END LOOP;
END $$;
