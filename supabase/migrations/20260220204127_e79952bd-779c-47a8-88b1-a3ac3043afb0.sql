
-- Allow uploaders to delete their own files (for rejected files re-upload flow)
CREATE POLICY "Uploaders can delete own files"
ON public.design_task_files
FOR DELETE
USING (uploaded_by = auth.uid());

-- Allow admins and design heads to delete any design file
CREATE POLICY "Heads can delete design files"
ON public.design_task_files
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'design_head'::app_role)
);

-- Allow uploaders to delete their own execution photos
CREATE POLICY "Uploaders can delete own execution photos"
ON public.execution_task_photos
FOR DELETE
USING (uploaded_by = auth.uid());

-- Allow admins and execution managers to delete any execution photo
CREATE POLICY "Heads can delete execution photos"
ON public.execution_task_photos
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'execution_manager'::app_role)
);
