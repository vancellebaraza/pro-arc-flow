-- PERFORMANCE: foreign-key indexes and RLS initplan rewrites.
--
-- *** REVIEW BEFORE APPLYING. NOT APPLIED. ***
-- Generated from the LIVE pg_policies / pg_constraint of the production project
-- (not from the repo migration files, which are out of date: live policies
-- include mini_admin in many places the repo files do not).
--
-- Part 1: CREATE INDEX IF NOT EXISTS on foreign keys with no covering index.
-- Part 2: ALTER POLICY: auth.uid() -> (select auth.uid()) and
--         has_role(auth.uid(), 'x') -> (select has_role((select auth.uid()), 'x')).
--         Only these two wrappings change. Policy names, commands, roles and
--         logic are untouched. ALTER POLICY fails (rolling everything back) if a
--         policy does not exist, so it can never create a new, looser policy.
--
-- Safe to re-run. No data statements. Try it on a Supabase branch first.

BEGIN;

SET LOCAL search_path TO public;

-- Part 1: indexes
CREATE INDEX IF NOT EXISTS accounts_parent_id_idx ON public.accounts (parent_id);
CREATE INDEX IF NOT EXISTS bank_accounts_account_id_idx ON public.bank_accounts (account_id);
CREATE INDEX IF NOT EXISTS bills_expense_account_id_idx ON public.bills (expense_account_id);
CREATE INDEX IF NOT EXISTS bills_project_id_idx ON public.bills (project_id);
CREATE INDEX IF NOT EXISTS bills_vendor_id_idx ON public.bills (vendor_id);
CREATE INDEX IF NOT EXISTS inspections_project_id_idx ON public.inspections (project_id);
CREATE INDEX IF NOT EXISTS invoice_lines_invoice_id_idx ON public.invoice_lines (invoice_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS invoices_quotation_id_idx ON public.invoices (quotation_id);
CREATE INDEX IF NOT EXISTS journal_lines_account_id_idx ON public.journal_lines (account_id);
CREATE INDEX IF NOT EXISTS journal_lines_journal_entry_id_idx ON public.journal_lines (journal_entry_id);
CREATE INDEX IF NOT EXISTS messages_project_id_idx ON public.messages (project_id);
CREATE INDEX IF NOT EXISTS notifications_project_id_idx ON public.notifications (project_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS payment_allocations_invoice_id_idx ON public.payment_allocations (invoice_id);
CREATE INDEX IF NOT EXISTS payment_allocations_payment_id_idx ON public.payment_allocations (payment_id);
CREATE INDEX IF NOT EXISTS payments_client_id_idx ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS payments_deposit_account_id_idx ON public.payments (deposit_account_id);
CREATE INDEX IF NOT EXISTS project_vendor_assignments_project_id_idx ON public.project_vendor_assignments (project_id);
CREATE INDEX IF NOT EXISTS project_vendor_assignments_vendor_id_idx ON public.project_vendor_assignments (vendor_id);
CREATE INDEX IF NOT EXISTS project_view_admin_assignments_viewer_id_idx ON public.project_view_admin_assignments (viewer_id);
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS projects_engineer_id_idx ON public.projects (engineer_id);
CREATE INDEX IF NOT EXISTS quotation_items_quotation_id_idx ON public.quotation_items (quotation_id);
CREATE INDEX IF NOT EXISTS quotations_project_id_idx ON public.quotations (project_id);
CREATE INDEX IF NOT EXISTS staff_todos_staff_user_id_idx ON public.staff_todos (staff_user_id);
CREATE INDEX IF NOT EXISTS vendor_payment_allocations_bill_id_idx ON public.vendor_payment_allocations (bill_id);
CREATE INDEX IF NOT EXISTS vendor_payment_allocations_vendor_payment_id_idx ON public.vendor_payment_allocations (vendor_payment_id);
CREATE INDEX IF NOT EXISTS vendor_payments_payment_account_id_idx ON public.vendor_payments (payment_account_id);
CREATE INDEX IF NOT EXISTS vendor_payments_vendor_id_idx ON public.vendor_payments (vendor_id);
CREATE INDEX IF NOT EXISTS whatsapp_logs_project_id_idx ON public.whatsapp_logs (project_id);
CREATE INDEX IF NOT EXISTS work_tasks_project_id_idx ON public.work_tasks (project_id);
CREATE INDEX IF NOT EXISTS worksheets_project_id_idx ON public.worksheets (project_id);

-- Part 2: RLS policies
ALTER POLICY accounts_admin_accountant_full_access ON public.accounts
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY "Admin and accountant read audit logs" ON public.audit_logs
  USING (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'accountant'::app_role))));

ALTER POLICY audit_logs_admin_accountant_insert ON public.audit_logs
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY audit_logs_admin_accountant_select ON public.audit_logs
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY bank_accounts_admin_accountant_full_access ON public.bank_accounts
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY bank_transactions_admin_accountant_full_access ON public.bank_transactions
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY bills_admin_accountant ON public.bills
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY "Admin and accountant read settings" ON public.company_settings
  USING (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'accountant'::app_role))));

ALTER POLICY "Admin and accountant update settings" ON public.company_settings
  USING (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'accountant'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'accountant'::app_role))));

ALTER POLICY gallery_items_admin_manage ON public.gallery_items
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'mini_admin'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'mini_admin'::app_role]))))));

ALTER POLICY gallery_sets_admin_manage ON public.gallery_sets
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'mini_admin'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'mini_admin'::app_role]))))));

ALTER POLICY inquiries_admin_view ON public.inquiries
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'mini_admin'::app_role]))))));

ALTER POLICY "Engineers manage inspections" ON public.inspections
  USING (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Inspection read" ON public.inspections
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = inspections.project_id) AND ((p.client_id = (select auth.uid())) OR (p.engineer_id = (select auth.uid())))))) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (EXISTS ( SELECT 1
   FROM project_view_admin_assignments pva
  WHERE ((pva.project_id = inspections.project_id) AND (pva.viewer_id = (select auth.uid())))))));

ALTER POLICY invoice_lines_admin_accountant ON public.invoice_lines
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY invoices_admin_accountant ON public.invoices
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY journal_entries_admin_accountant ON public.journal_entries
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY journal_lines_admin_accountant ON public.journal_lines
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY "Message insert" ON public.messages
  WITH CHECK (((sender_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = messages.project_id) AND ((p.client_id = (select auth.uid())) OR (p.engineer_id = (select auth.uid())) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))))));

ALTER POLICY "Message read" ON public.messages
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = messages.project_id) AND ((p.client_id = (select auth.uid())) OR (p.engineer_id = (select auth.uid())))))) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Self-insert notifications" ON public.notifications
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users see own notifications" ON public.notifications
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users update own notifications" ON public.notifications
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY payment_allocations_admin_accountant ON public.payment_allocations
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY payments_admin_accountant ON public.payments
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY "Users insert own profile" ON public.profiles
  WITH CHECK (((select auth.uid()) = id));

ALTER POLICY "Users update own profile" ON public.profiles
  USING (((select auth.uid()) = id))
  WITH CHECK (((select auth.uid()) = id));

ALTER POLICY project_progress_staff_all ON public.project_progress
  USING (((select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role))));

ALTER POLICY "Admins manage project vendor assignments" ON public.project_vendor_assignments
  USING (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Engineers assign vendors to their projects" ON public.project_vendor_assignments
  WITH CHECK (((select has_role((select auth.uid()), 'engineer'::app_role)) AND (assigned_by = (select auth.uid())) AND (status = 'pending_approval'::text) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_vendor_assignments.project_id) AND (p.engineer_id = (select auth.uid())))))));

ALTER POLICY "Project members can read vendor assignments" ON public.project_vendor_assignments
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_vendor_assignments.project_id) AND ((p.client_id = (select auth.uid())) OR (p.engineer_id = (select auth.uid())))))) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Mini-admins manage viewer assignments" ON public.project_view_admin_assignments
  USING (((select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role))))
  WITH CHECK ((((select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role))) AND (assigned_by = (select auth.uid()))));

ALTER POLICY "Viewer assignment read" ON public.project_view_admin_assignments
  USING (((viewer_id = (select auth.uid())) OR (select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role))));

ALTER POLICY "Admins delete projects" ON public.projects
  USING (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Clients create own projects" ON public.projects
  WITH CHECK ((client_id = (select auth.uid())));

ALTER POLICY "Engineers/admins update projects" ON public.projects
  USING (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (client_id = (select auth.uid()))));

ALTER POLICY "Project read access" ON public.projects
  USING (((client_id = (select auth.uid())) OR (engineer_id = (select auth.uid())) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (EXISTS ( SELECT 1
   FROM project_view_admin_assignments pva
  WHERE ((pva.project_id = projects.id) AND (pva.viewer_id = (select auth.uid())))))));

ALTER POLICY accountant_readonly_projects ON public.projects
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'accountant'::app_role)))));

ALTER POLICY "Engineers manage items" ON public.quotation_items
  USING (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Item read" ON public.quotation_items
  USING (((EXISTS ( SELECT 1
   FROM (quotations q
     JOIN projects p ON ((p.id = q.project_id)))
  WHERE ((q.id = quotation_items.quotation_id) AND ((p.client_id = (select auth.uid())) OR (p.engineer_id = (select auth.uid())))))) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (EXISTS ( SELECT 1
   FROM (quotations q
     JOIN project_view_admin_assignments pva ON ((pva.project_id = q.project_id)))
  WHERE ((q.id = quotation_items.quotation_id) AND (pva.viewer_id = (select auth.uid())))))));

ALTER POLICY accountant_readonly_quotation_items ON public.quotation_items
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'accountant'::app_role)))));

ALTER POLICY "Clients update status" ON public.quotations
  USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = quotations.project_id) AND (p.client_id = (select auth.uid()))))));

ALTER POLICY "Engineers manage quotations" ON public.quotations
  USING (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Mini-admins approve quotations" ON public.quotations
  USING ((select has_role((select auth.uid()), 'mini_admin'::app_role)))
  WITH CHECK ((select has_role((select auth.uid()), 'mini_admin'::app_role)));

ALTER POLICY "Quotation read" ON public.quotations
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = quotations.project_id) AND ((p.client_id = (select auth.uid())) OR (p.engineer_id = (select auth.uid())))))) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role)) OR (EXISTS ( SELECT 1
   FROM project_view_admin_assignments pva
  WHERE ((pva.project_id = quotations.project_id) AND (pva.viewer_id = (select auth.uid())))))));

ALTER POLICY accountant_readonly_quotations ON public.quotations
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'accountant'::app_role)))));

ALTER POLICY reconciliation_matches_admin_accountant_full_access ON public.reconciliation_matches
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY "Admins manage staff todos" ON public.staff_todos
  USING (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Engineers create own staff todos" ON public.staff_todos
  WITH CHECK (((staff_user_id = (select auth.uid())) AND (created_by = (select auth.uid())) AND (select has_role((select auth.uid()), 'engineer'::app_role))));

ALTER POLICY "Engineers read own staff todos" ON public.staff_todos
  USING ((staff_user_id = (select auth.uid())));

ALTER POLICY "Engineers update own staff todos" ON public.staff_todos
  USING (((staff_user_id = (select auth.uid())) AND (select has_role((select auth.uid()), 'engineer'::app_role))))
  WITH CHECK (((staff_user_id = (select auth.uid())) AND (select has_role((select auth.uid()), 'engineer'::app_role))));

ALTER POLICY "Admins manage roles" ON public.user_roles
  USING ((select has_role((select auth.uid()), 'admin'::app_role)))
  WITH CHECK ((select has_role((select auth.uid()), 'admin'::app_role)));

ALTER POLICY "Users see own roles" ON public.user_roles
  USING (((user_id = (select auth.uid())) OR (select has_role((select auth.uid()), 'admin'::app_role))));

ALTER POLICY vendor_payment_allocations_admin_accountant ON public.vendor_payment_allocations
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY vendor_payments_admin_accountant ON public.vendor_payments
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'accountant'::app_role]))))));

ALTER POLICY "Admins manage vendors" ON public.vendors
  USING (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY accountant_readonly_vendors ON public.vendors
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (select auth.uid())) AND (user_roles.role = 'accountant'::app_role)))));

ALTER POLICY "Admins and senders view WA logs" ON public.whatsapp_logs
  USING (((sender_id = (select auth.uid())) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Users insert their own WA logs" ON public.whatsapp_logs
  WITH CHECK ((sender_id = (select auth.uid())));

ALTER POLICY "Engineers manage tasks" ON public.work_tasks
  USING (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Task read" ON public.work_tasks
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = work_tasks.project_id) AND ((p.client_id = (select auth.uid())) OR (p.engineer_id = (select auth.uid())))))) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Clients can view their worksheets" ON public.worksheets
  USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = worksheets.project_id) AND (p.client_id = (select auth.uid()))))));

ALTER POLICY "Engineers and admins manage worksheets" ON public.worksheets
  USING (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))))
  WITH CHECK (((select has_role((select auth.uid()), 'engineer'::app_role)) OR (select has_role((select auth.uid()), 'admin'::app_role)) OR (select has_role((select auth.uid()), 'mini_admin'::app_role))));

ALTER POLICY "Viewers read assigned worksheets" ON public.worksheets
  USING ((EXISTS ( SELECT 1
   FROM project_view_admin_assignments pva
  WHERE ((pva.project_id = worksheets.project_id) AND (pva.viewer_id = (select auth.uid()))))));

COMMIT;
