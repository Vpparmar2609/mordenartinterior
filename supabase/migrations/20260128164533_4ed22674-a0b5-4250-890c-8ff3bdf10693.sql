-- Add approval columns to design_task_files
ALTER TABLE public.design_task_files 
ADD COLUMN approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by uuid,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Add approval columns to execution_task_photos
ALTER TABLE public.execution_task_photos 
ADD COLUMN approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by uuid,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Create RLS policy for heads to update file approval status
CREATE POLICY "Heads can approve design files"
ON public.design_task_files
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'design_head')
);

CREATE POLICY "Heads can approve execution photos"
ON public.execution_task_photos
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'execution_head') OR
  has_role(auth.uid(), 'execution_manager')
);