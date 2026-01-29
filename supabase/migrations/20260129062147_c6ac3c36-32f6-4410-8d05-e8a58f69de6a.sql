-- Update the design tasks function with new 31 items from the checklist
CREATE OR REPLACE FUNCTION public.insert_default_design_tasks(_project_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  INSERT INTO public.design_tasks (project_id, order_index, name, status, updated_at)
  SELECT _project_id, v.order_index, v.name, 'pending'::task_status, now()
  FROM (VALUES
    (1,  'POP PDF'),
    (2,  'Electrical PDF'),
    (3,  'Furniture PDF'),
    (4,  'Laminate PDF'),
    (5,  'Paint PDF'),
    (6,  'Fabric PDF'),
    (7,  'Foyer with safety door design'),
    (8,  'Safety door grill design'),
    (9,  'Shoerack design'),
    (10, 'All paneling designs'),
    (11, 'Bed design with headboard'),
    (12, 'Wardrobe design with inside layout'),
    (13, 'Sofa design'),
    (14, 'Center table design'),
    (15, 'TV unit design'),
    (16, 'Partition design'),
    (17, 'Hanging light design'),
    (18, 'Fan model selection'),
    (19, 'Dining table design'),
    (20, 'Chimney model selection'),
    (21, 'Temple design with CNC/wallpaper'),
    (22, 'Store room door design'),
    (23, 'All laminate selection'),
    (24, 'Kitchen acrylic selection'),
    (25, 'Kitchen profile shutter glass selection'),
    (26, 'All handle, knob, lock selection'),
    (27, 'All door both side design'),
    (28, 'All bedroom sidebox design'),
    (29, 'All bedroom dressing unit design'),
    (30, 'All bedroom study table design'),
    (31, 'Paint selection (wall paint/luster/PU)'),
    (32, 'Switch board selection'),
    (33, 'Fabric selection for curtains'),
    (34, 'Fabric selection for sofa'),
    (35, 'Fabric selection for bed and headboard'),
    (36, 'Fabric selection for dining chair')
  ) AS v(order_index, name)
  ON CONFLICT (project_id, order_index) DO NOTHING;
$function$;

-- Update the execution tasks function with new items from the site checklist
CREATE OR REPLACE FUNCTION public.insert_default_execution_tasks(_project_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  INSERT INTO public.execution_tasks (project_id, order_index, name, status, updated_at)
  SELECT _project_id, v.order_index, v.name, 'pending'::task_status, now()
  FROM (VALUES
    -- Pre-work
    (1,  'Client meeting and clarify POP, electric, furniture work'),
    (2,  'Write measurements on wall/layout print'),
    (3,  'Inform client for wifi, camera, inverter, speaker, AC wiring'),
    -- POP Stage (8 days)
    (4,  'Floor guard installation with tapping'),
    (5,  'POP channeling as per plan'),
    (6,  'POP channeling verification'),
    (7,  'Electrical points and wiring as per layout'),
    (8,  'Electrical work verification'),
    (9,  'Gypsum fitting with light cutting'),
    -- Furniture Stage (25 days)
    (10, 'Start carpentry work with measurements'),
    (11, 'Discuss storage layout and paneling with carpenter'),
    (12, 'Chimney selection and order'),
    (13, 'Electric board shifting + light fitting'),
    (14, 'Furniture row work and electric work check'),
    (15, 'Site garbage clearance'),
    (16, 'Hardware brand verification'),
    (17, 'Furniture and ceiling verification with client'),
    -- Laminate Stage (30 days)
    (18, 'Laminate shade and code verification'),
    (19, 'Start laminate work as per design'),
    (20, 'Order CNC, safety door, mirrors, handles'),
    (21, 'Laminate quality check (no cracks/bubbles)'),
    (22, 'Drawers, channels, hinges alignment check'),
    -- Color Stage (15 days)
    (23, 'Start lapi/putty work'),
    (24, 'Start color work'),
    (25, 'Paint code verification with designer'),
    (26, 'Groove and frame color verification'),
    (27, 'Color finishing and cleaning'),
    (28, 'Garbage and material clearance'),
    -- Other Stage (12 days)
    (29, 'Confirm sofa size with client'),
    (30, 'Order furniture (dining, sofa, mattress, curtains)'),
    (31, 'Order electrical (fan, lights, switch boards)'),
    (32, 'Complete all electric work verification'),
    (33, 'Deep cleaning verification'),
    (34, 'Deliver all furniture items'),
    (35, 'Client handover and sign-off')
  ) AS v(order_index, name)
  ON CONFLICT (project_id, order_index) DO NOTHING;
$function$;