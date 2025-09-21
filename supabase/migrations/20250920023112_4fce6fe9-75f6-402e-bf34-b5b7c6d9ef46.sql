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
ALTER POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- ATTENDANCE
ALTER POLICY "Admins can view all attendance" ON public.attendance USING (public.is_admin(auth.uid()));
ALTER POLICY "Admins can update attendance" ON public.attendance USING (public.is_admin(auth.uid()));
ALTER POLICY "Admins can delete attendance" ON public.attendance USING (public.is_admin(auth.uid()));

-- DOCUMENT ATTACHMENTS
ALTER POLICY "attachments_insert_admin" ON public.document_attachments WITH CHECK (public.is_admin(auth.uid()));
ALTER POLICY "attachments_update_admin" ON public.document_attachments USING (public.is_admin(auth.uid()));
ALTER POLICY "attachments_delete_admin" ON public.document_attachments USING (public.is_admin(auth.uid()));
ALTER POLICY "attachments_insert_admin_notice_event" ON public.document_attachments WITH CHECK (
  ((entity_type = ANY (ARRAY['notice','event'])) AND public.is_admin(auth.uid()))
  OR
  ((entity_type = 'task') AND ((auth.uid() = uploaded_by) OR public.is_admin(auth.uid())))
);

-- EVENTS
ALTER POLICY "events_insert_admin" ON public.events WITH CHECK (public.is_admin(auth.uid()));
ALTER POLICY "events_update_admin" ON public.events USING (public.is_admin(auth.uid()));
ALTER POLICY "events_delete_admin" ON public.events USING (public.is_admin(auth.uid()));

-- MESSAGES
ALTER POLICY "messages_insert_admin" ON public.messages WITH CHECK (public.is_admin(auth.uid()));
ALTER POLICY "messages_update_admin" ON public.messages USING (public.is_admin(auth.uid()));
ALTER POLICY "messages_delete_admin" ON public.messages USING (public.is_admin(auth.uid()));
ALTER POLICY "Admins can view all messages" ON public.messages USING (public.is_admin(auth.uid()));
ALTER POLICY "messages_select_relevant" ON public.messages USING (
  public.is_admin(auth.uid())
  OR recipient_type = 'all'
  OR (recipient_type = 'department' AND department = public.get_user_department(auth.uid()))
  OR (recipient_type = 'individual' AND recipient_id = auth.uid())
);
ALTER POLICY "Users can view messages sent to them" ON public.messages USING (
  recipient_type = 'all'
  OR (recipient_type = 'individual' AND recipient_id = auth.uid())
  OR (recipient_type = 'department' AND department = public.get_user_department(auth.uid()))
);

-- MESSAGE RECIPIENTS
ALTER POLICY "message_recipients_select_own" ON public.message_recipients USING (
  recipient_id = auth.uid() OR public.is_admin(auth.uid())
);

-- TASKS
ALTER POLICY "tasks_select_own_or_admin" ON public.tasks USING (
  auth.uid() = assigned_to OR public.is_admin(auth.uid())
);
ALTER POLICY "tasks_update_own_or_admin" ON public.tasks USING (
  auth.uid() = assigned_to OR public.is_admin(auth.uid())
);
ALTER POLICY "tasks_insert_admin" ON public.tasks WITH CHECK (public.is_admin(auth.uid()));
ALTER POLICY "tasks_delete_admin" ON public.tasks USING (public.is_admin(auth.uid()));

-- NOTICES
ALTER POLICY "notices_insert_admin" ON public.notices WITH CHECK (public.is_admin(auth.uid()));
ALTER POLICY "notices_update_admin" ON public.notices USING (public.is_admin(auth.uid()));
ALTER POLICY "notices_delete_admin" ON public.notices USING (public.is_admin(auth.uid()));

COMMIT;