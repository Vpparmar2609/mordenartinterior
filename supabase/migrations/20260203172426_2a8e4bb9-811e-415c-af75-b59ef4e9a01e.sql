-- Drop the existing overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Create policy to allow viewing profiles of users who share a project
-- Uses the existing shares_project_with function
CREATE POLICY "Users can view profiles of shared project members"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.shares_project_with(auth.uid(), id)
);

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));