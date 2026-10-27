-- PERFORMANCE: indexes and RLS initplan rewrites.
--
-- *** REVIEW BEFORE APPLYING. NOT APPLIED. ***
-- Written from the files in supabase/migrations only. Tables created outside
-- these files (the accounting tables, etc.) are not touched. Before applying,
-- compare each policy below with the live definition (pg_policies) and confirm
-- it matches; ALTER POLICY replaces the USING / WITH CHECK expression with the
-- one written here.
--
-- Part 1: indexes on foreign keys the app filters or joins on.
-- Part 2: auth.uid() -> (select auth.uid()) and has_role(auth.uid(), 'x') ->
--         (select public.has_role((select auth.uid()), 'x')) so Postgres
--         evaluates them once per statement instead of once per row. The
--         logic of every policy is unchanged. ALTER POLICY keeps the policy
--         name, command and roles, and fails (rolling everything back) if a
--         policy does not exist, so it can never create a new, looser one.
--
-- Safe to re-run. No data statements.

BEGIN;

-- Part 1: indexes
CREATE INDEX IF NOT EXISTS quotations_project_id_idx ON public.quotations (project_id);
CREATE INDEX IF NOT EXISTS inspections_project_id_idx ON public.inspections (project_id);
CREATE INDEX IF NOT EXISTS worksheets_project_id_idx ON public.worksheets (project_id);
CREATE INDEX IF NOT EXISTS messages_project_id_idx ON public.messages (project_id);
CREATE INDEX IF NOT EXISTS notifications_project_id_idx ON public.notifications (project_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS project_vendor_assignments_project_id_idx ON public.project_vendor_assignments (project_id);
CREATE INDEX IF NOT EXISTS project_progress_project_id_idx ON public.project_progress (project_id);
CREATE INDEX IF NOT EXISTS work_tasks_project_id_idx ON public.work_tasks (project_id);
CREATE INDEX IF NOT EXISTS whatsapp_logs_project_id_idx ON public.whatsapp_logs (project_id);
CREATE INDEX IF NOT EXISTS quotation_items_quotation_id_idx ON public.quotation_items (quotation_id);
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS projects_engineer_id_idx ON public.projects (engineer_id);
CREATE INDEX IF NOT EXISTS staff_todos_staff_user_id_idx ON public.staff_todos (staff_user_id);
CREATE INDEX IF NOT EXISTS project_view_admin_assignments_viewer_id_idx ON public.project_view_admin_assignments (viewer_id);

-- Part 2: RLS policies

ALTER POLICY "Users update own profile" ON public.profiles
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Users insert own profile" ON public.profiles
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Users see own roles" ON public.user_roles
  USING (user_id = (select auth.uid()) or (select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Admins manage roles" ON public.user_roles
  USING ((select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Clients create own projects" ON public.projects
  WITH CHECK (client_id = (select auth.uid()));

ALTER POLICY "Engineers/admins update projects" ON public.projects
  USING ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')) or client_id = (select auth.uid()));

ALTER POLICY "Admins delete projects" ON public.projects
  USING ((select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Engineers manage quotations" ON public.quotations
  USING ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Clients update status" ON public.quotations
  USING (exists(select 1 from public.projects p where p.id = project_id and p.client_id = (select auth.uid())));

ALTER POLICY "Engineers manage items" ON public.quotation_items
  USING ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Engineers manage inspections" ON public.inspections
  USING ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Task read" ON public.work_tasks
  USING (exists(select 1 from public.projects p where p.id = project_id and (p.client_id = (select auth.uid()) or p.engineer_id = (select auth.uid()))) or (select public.has_role((select auth.uid()), 'admin')) or (select public.has_role((select auth.uid()), 'engineer')));

ALTER POLICY "Engineers manage tasks" ON public.work_tasks
  USING ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK ((select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Message read" ON public.messages
  USING (exists(select 1 from public.projects p where p.id = project_id and (p.client_id = (select auth.uid()) or p.engineer_id = (select auth.uid()))) or (select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Message insert" ON public.messages
  WITH CHECK (sender_id = (select auth.uid()) and exists( select 1 from public.projects p where p.id = project_id and (p.client_id = (select auth.uid()) or p.engineer_id = (select auth.uid()) or (select public.has_role((select auth.uid()), 'admin'))) ));

ALTER POLICY "Engineers and admins manage worksheets" ON public.worksheets
  USING ((select public.has_role((select auth.uid()), 'engineer'::app_role)) OR (select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'engineer'::app_role)) OR (select public.has_role((select auth.uid()), 'admin'::app_role)));

ALTER POLICY "Clients can view their worksheets" ON public.worksheets
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = worksheets.project_id AND p.client_id = (select auth.uid())));

ALTER POLICY "Users insert their own WA logs" ON public.whatsapp_logs
  WITH CHECK (sender_id = (select auth.uid()));

ALTER POLICY "Admins and senders view WA logs" ON public.whatsapp_logs
  USING (sender_id = (select auth.uid()) OR (select public.has_role((select auth.uid()), 'admin'::app_role)));

ALTER POLICY "Users see own notifications" ON public.notifications
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users update own notifications" ON public.notifications
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Self-insert notifications" ON public.notifications
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY "Admins manage vendors" ON public.vendors
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

ALTER POLICY "Project members can read vendor assignments" ON public.project_vendor_assignments
  USING (exists( select 1 from public.projects p where p.id = project_id and (p.client_id = (select auth.uid()) or p.engineer_id = (select auth.uid())) ) or (select public.has_role((select auth.uid()), 'admin'::app_role)));

ALTER POLICY "Engineers assign vendors to their projects" ON public.project_vendor_assignments
  WITH CHECK ((select public.has_role((select auth.uid()), 'engineer'::app_role)) and assigned_by = (select auth.uid()) and status = 'pending_approval' and exists( select 1 from public.projects p where p.id = project_id and p.engineer_id = (select auth.uid()) ));

ALTER POLICY "Admins manage project vendor assignments" ON public.project_vendor_assignments
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

ALTER POLICY "Admins manage staff todos" ON public.staff_todos
  USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

ALTER POLICY "Engineers read own staff todos" ON public.staff_todos
  USING (staff_user_id = (select auth.uid()));

ALTER POLICY "Engineers create own staff todos" ON public.staff_todos
  WITH CHECK (staff_user_id = (select auth.uid()) and created_by = (select auth.uid()) and (select public.has_role((select auth.uid()), 'engineer'::app_role)));

ALTER POLICY "Engineers update own staff todos" ON public.staff_todos
  USING (staff_user_id = (select auth.uid()) and (select public.has_role((select auth.uid()), 'engineer'::app_role)))
  WITH CHECK (staff_user_id = (select auth.uid()) and (select public.has_role((select auth.uid()), 'engineer'::app_role)));

ALTER POLICY "Viewer assignment read" ON public.project_view_admin_assignments
  USING (viewer_id = (select auth.uid()) or (select public.has_role((select auth.uid()), 'mini_admin')) or (select public.has_role((select auth.uid()), 'admin')));

ALTER POLICY "Mini-admins manage viewer assignments" ON public.project_view_admin_assignments
  USING ((select public.has_role((select auth.uid()), 'mini_admin')) or (select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK (((select public.has_role((select auth.uid()), 'mini_admin')) or (select public.has_role((select auth.uid()), 'admin'))) and assigned_by = (select auth.uid()));

ALTER POLICY "Project read access" ON public.projects
  USING (client_id = (select auth.uid()) or engineer_id = (select auth.uid()) or (select public.has_role((select auth.uid()), 'admin')) or (select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'mini_admin')) or exists ( select 1 from public.project_view_admin_assignments pva where pva.project_id = projects.id and pva.viewer_id = (select auth.uid()) ));

ALTER POLICY "Quotation read" ON public.quotations
  USING (exists(select 1 from public.projects p where p.id = project_id and (p.client_id = (select auth.uid()) or p.engineer_id = (select auth.uid()))) or (select public.has_role((select auth.uid()), 'admin')) or (select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'mini_admin')) or exists ( select 1 from public.project_view_admin_assignments pva where pva.project_id = quotations.project_id and pva.viewer_id = (select auth.uid()) ));

ALTER POLICY "Item read" ON public.quotation_items
  USING (exists(select 1 from public.quotations q join public.projects p on p.id=q.project_id where q.id = quotation_id and (p.client_id = (select auth.uid()) or p.engineer_id = (select auth.uid()))) or (select public.has_role((select auth.uid()), 'admin')) or (select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'mini_admin')) or exists ( select 1 from public.quotations q join public.project_view_admin_assignments pva on pva.project_id = q.project_id where q.id = quotation_items.quotation_id and pva.viewer_id = (select auth.uid()) ));

ALTER POLICY "Inspection read" ON public.inspections
  USING (exists(select 1 from public.projects p where p.id = project_id and (p.client_id = (select auth.uid()) or p.engineer_id = (select auth.uid()))) or (select public.has_role((select auth.uid()), 'admin')) or (select public.has_role((select auth.uid()), 'engineer')) or (select public.has_role((select auth.uid()), 'mini_admin')) or exists ( select 1 from public.project_view_admin_assignments pva where pva.project_id = inspections.project_id and pva.viewer_id = (select auth.uid()) ));

ALTER POLICY "Mini-admins can view worksheets" ON public.worksheets
  USING ((select public.has_role((select auth.uid()), 'mini_admin'::app_role)));

ALTER POLICY "gallery_items_admin_manage" ON public.gallery_items
  USING (exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role in ('admin', 'mini_admin')))
  WITH CHECK (exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role in ('admin', 'mini_admin')));

ALTER POLICY "gallery_sets_admin_manage" ON public.gallery_sets
  USING (exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role in ('admin', 'mini_admin')))
  WITH CHECK (exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role in ('admin', 'mini_admin')));

ALTER POLICY "project_progress_staff_all" ON public.project_progress
  USING ((select public.has_role((select auth.uid()), 'mini_admin')) or (select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK ((select public.has_role((select auth.uid()), 'mini_admin')) or (select public.has_role((select auth.uid()), 'admin')));

COMMIT;
