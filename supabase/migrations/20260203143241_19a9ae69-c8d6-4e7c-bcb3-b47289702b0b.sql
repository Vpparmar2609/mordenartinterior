-- Fix STORAGE_EXPOSURE: Add DELETE policies for design-files and execution-photos buckets

-- Allow designers and design heads to delete design files they uploaded or that they can approve
CREATE POLICY "Designers can delete own design files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'design-files' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'design_head')
  )
);

-- Allow execution team to delete execution photos they uploaded or that they can approve
CREATE POLICY "Execution team can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'execution-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'execution_manager')
  )
);

-- Fix CLIENT_SIDE_AUTH: Harden bootstrap_first_admin function with additional security
-- Add a flag table to track if bootstrap has been completed
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify system config
CREATE POLICY "Only admins can view system config"
ON public.system_config FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update system config"
ON public.system_config FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Replace the bootstrap function with a more secure version that disables itself after use
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  caller_id uuid;
  bootstrap_disabled boolean;
BEGIN
  -- Get the calling user's ID
  caller_id := auth.uid();
  
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if bootstrap has been disabled
  SELECT value = 'true' INTO bootstrap_disabled
  FROM public.system_config
  WHERE key = 'bootstrap_disabled';
  
  IF bootstrap_disabled IS TRUE THEN
    RETURN false;
  END IF;
  
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  -- If no admin exists, make the calling user an admin
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (caller_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mark bootstrap as completed to prevent future use
    INSERT INTO public.system_config (key, value)
    VALUES ('bootstrap_disabled', 'true')
    ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = now();
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;