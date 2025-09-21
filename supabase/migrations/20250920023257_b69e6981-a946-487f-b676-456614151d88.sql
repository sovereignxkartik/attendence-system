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
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- ATTENDANCE
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;

CREATE POLICY "Admins can view all attendance"
ON public.attendance
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update attendance"
ON public.attendance
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete attendance"
ON public.attendance
FOR DELETE
USING (public.is_admin(auth.uid()));

-- EVENTS
DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
DROP POLICY IF EXISTS "events_update_admin" ON public.events;
DROP POLICY IF EXISTS "events_delete_admin" ON public.events;

CREATE POLICY "events_insert_admin"
ON public.events
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "events_update_admin"
ON public.events
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "events_delete_admin"
ON public.events
FOR DELETE
USING (public.is_admin(auth.uid()));

-- TASKS
DROP POLICY IF EXISTS "tasks_select_own_or_admin" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_own_or_admin" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_admin" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_admin" ON public.tasks;

CREATE POLICY "tasks_select_own_or_admin"
ON public.tasks
FOR SELECT
USING (auth.uid() = assigned_to OR public.is_admin(auth.uid()));

CREATE POLICY "tasks_update_own_or_admin"
ON public.tasks
FOR UPDATE
USING (auth.uid() = assigned_to OR public.is_admin(auth.uid()));

CREATE POLICY "tasks_insert_admin"
ON public.tasks
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "tasks_delete_admin"
ON public.tasks
FOR DELETE
USING (public.is_admin(auth.uid()));

-- NOTICES
DROP POLICY IF EXISTS "notices_insert_admin" ON public.notices;
DROP POLICY IF EXISTS "notices_update_admin" ON public.notices;
DROP POLICY IF EXISTS "notices_delete_admin" ON public.notices;

CREATE POLICY "notices_insert_admin"
ON public.notices
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "notices_update_admin"
ON public.notices
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "notices_delete_admin"
ON public.notices
FOR DELETE
USING (public.is_admin(auth.uid()));

COMMIT;