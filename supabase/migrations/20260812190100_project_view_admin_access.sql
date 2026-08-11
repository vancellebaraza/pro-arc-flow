-- 1) SECURITY FIX: public signup can no longer self-assign a role via
--    metadata. Every signup becomes 'client', no exceptions. Elevated
--    roles (engineer/admin/mini_admin/project_view_admin) are only ever
--    granted by a trusted server-side action.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''));
  insert into public.user_roles (user_id, role)
  values (new.id, 'client'::app_role);
  return new;
end; $$;

-- 2) Assignment table: which projects a project_view_admin may see.
--    Holding the role grants nothing by itself — an explicit row here is required.
create table public.project_view_admin_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, viewer_id)
);
grant select, insert, update, delete on public.project_view_admin_assignments to authenticated;
grant all on public.project_view_admin_assignments to service_role;
alter table public.project_view_admin_assignments enable row level security;

drop policy if exists "Viewer assignment read" on public.project_view_admin_assignments;
create policy "Viewer assignment read" on public.project_view_admin_assignments
  for select to authenticated using (
    viewer_id = auth.uid()
    or public.has_role(auth.uid(),'mini_admin')
    or public.has_role(auth.uid(),'admin')
  );

drop policy if exists "Mini-admins manage viewer assignments" on public.project_view_admin_assignments;
create policy "Mini-admins manage viewer assignments" on public.project_view_admin_assignments
  for all to authenticated using (
    public.has_role(auth.uid(),'mini_admin') or public.has_role(auth.uid(),'admin')
  ) with check (
    (public.has_role(auth.uid(),'mini_admin') or public.has_role(auth.uid(),'admin'))
    and assigned_by = auth.uid()
  );

-- 3) Extend read access. mini_admin gets read on these tables (prerequisite
--    fix — it had none before), and project_view_admin gets read scoped
--    strictly to rows they've been assigned.
drop policy if exists "Project read access" on public.projects;
create policy "Project read access" on public.projects for select to authenticated using (
  client_id = auth.uid() or engineer_id = auth.uid()
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'engineer')
  or public.has_role(auth.uid(),'mini_admin')
  or exists (
    select 1 from public.project_view_admin_assignments pva
    where pva.project_id = projects.id and pva.viewer_id = auth.uid()
  )
);

drop policy if exists "Quotation read" on public.quotations;
create policy "Quotation read" on public.quotations for select to authenticated using (
  exists(select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or p.engineer_id = auth.uid()))
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'engineer')
  or public.has_role(auth.uid(),'mini_admin')
  or exists (
    select 1 from public.project_view_admin_assignments pva
    where pva.project_id = quotations.project_id and pva.viewer_id = auth.uid()
  )
);

drop policy if exists "Item read" on public.quotation_items;
create policy "Item read" on public.quotation_items for select to authenticated using (
  exists(select 1 from public.quotations q join public.projects p on p.id=q.project_id
         where q.id = quotation_id and (p.client_id = auth.uid() or p.engineer_id = auth.uid()))
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'engineer')
  or public.has_role(auth.uid(),'mini_admin')
  or exists (
    select 1 from public.quotations q
    join public.project_view_admin_assignments pva on pva.project_id = q.project_id
    where q.id = quotation_items.quotation_id and pva.viewer_id = auth.uid()
  )
);

drop policy if exists "Inspection read" on public.inspections;
create policy "Inspection read" on public.inspections for select to authenticated using (
  exists(select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or p.engineer_id = auth.uid()))
  or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'engineer')
  or public.has_role(auth.uid(),'mini_admin')
  or exists (
    select 1 from public.project_view_admin_assignments pva
    where pva.project_id = inspections.project_id and pva.viewer_id = auth.uid()
  )
);
