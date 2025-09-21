BEGIN;

-- Helper: admin check without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.profiles
    where id = _user_id and role = 'admin'
  );
$$;

-- Helper: get user's department without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select department from public.profiles where id = _user_id limit 1;
$$;

-- PROFILES
DROP POLICY "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- ATTENDANCE
DROP POLICY "Admins can view all attendance" ON public.attendance;
CREATE POLICY "Admins can view all attendance" 
ON public.attendance 
FOR SELECT 
USING (public.is_admin(auth.uid()));

DROP POLICY "Admins can update attendance" ON public.attendance;
CREATE POLICY "Admins can update attendance" 
ON public.attendance 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

DROP POLICY "Admins can delete attendance" ON public.attendance;
CREATE POLICY "Admins can delete attendance" 
ON public.attendance 
FOR DELETE 
USING (public.is_admin(auth.uid()));

COMMIT;