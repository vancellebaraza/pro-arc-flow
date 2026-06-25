- Vendor Management module

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text not null,
  phone text not null,
  whatsapp_phone text,
  email text,
  category text not null,
  services_offered text,
  payment_history text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

grant select, insert, update, delete on public.vendors to authenticated;
grant all on public.vendors to service_role;
alter table public.vendors enable row level security;

create policy "Authenticated can select vendors" on public.vendors
  for select to authenticated
  using (true);

create policy "Admins manage vendors" on public.vendors
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

create table public.project_vendor_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  status text not null default 'pending_approval' check (status in ('pending_approval','approved','rejected')),
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.project_vendor_assignments to authenticated;
grant all on public.project_vendor_assignments to service_role;
alter table public.project_vendor_assignments enable row level security;

create policy "Project members can read vendor assignments" on public.project_vendor_assignments
  for select to authenticated
  using (
    exists(
      select 1 from public.projects p
      where p.id = project_id
        and (p.client_id = auth.uid() or p.engineer_id = auth.uid())
    )
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

create policy "Engineers assign vendors to their projects" on public.project_vendor_assignments
  for insert to authenticated
  with check (
    public.has_role(auth.uid(), 'engineer'::app_role)
    and assigned_by = auth.uid()
    and status = 'pending_approval'
    and exists(
      select 1 from public.projects p
      where p.id = project_id
        and p.engineer_id = auth.uid()
    )
  );

create policy "Admins manage project vendor assignments" on public.project_vendor_assignments
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
-