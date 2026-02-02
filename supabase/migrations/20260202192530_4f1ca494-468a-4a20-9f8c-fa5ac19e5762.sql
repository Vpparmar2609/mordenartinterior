-- Enable realtime for design_task_files table
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_task_files;

-- Enable realtime for execution_task_photos table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_task_photos;