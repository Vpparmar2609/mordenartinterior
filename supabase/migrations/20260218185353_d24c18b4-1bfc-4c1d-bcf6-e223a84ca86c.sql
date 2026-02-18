
-- Fix 1: Profiles table - require authentication explicitly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of shared project members" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view profiles of shared project members"
ON public.profiles FOR SELECT
TO authenticated
USING ((auth.uid() IS NOT NULL) AND shares_project_with(auth.uid(), id));

-- Fix 2: Projects policy - change TO public to TO authenticated
DROP POLICY IF EXISTS "Team members can view active projects" ON public.projects;

CREATE POLICY "Team members can view active projects"
ON public.projects FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'account_manager'::app_role) OR
  ((lifecycle_status = 'active'::text) AND is_on_project_team(auth.uid(), id))
);

-- Fix 3: Payment transactions - restrict SELECT to only assigned account managers
DROP POLICY IF EXISTS "Account managers can view all transactions" ON public.payment_transactions;

CREATE POLICY "Assigned account managers can view transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'account_manager'::app_role) AND is_on_project_team(auth.uid(), project_id)
);
