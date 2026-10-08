-- Manual progress label for each project, set by the mini admin / admin from the
-- Engineer page and shown (read-only) in the dashboard's Progress column.
-- Kept in its own table so changing it never touches the project row (which would
-- bump projects.updated_at and shift "work done" dates).
create table if not exists public.project_progress (
  project_id uuid primary key references public.projects(id) on delete cascade,
  progress text not null check (
    progress in (
      'Awaiting approval',
      'Awaiting quotation',
      'Awaiting funds',
      'Work in progress',
      'Complete fully paid',
      'Complete with balance'
    )
  ),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.project_progress enable row level security;

grant select, insert, update, delete on public.project_progress to authenticated;
grant all on public.project_progress to service_role;

drop policy if exists "project_progress_staff_all" on public.project_progress;
create policy "project_progress_staff_all" on public.project_progress
  for all to authenticated
  using (public.has_role(auth.uid(), 'mini_admin') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'mini_admin') or public.has_role(auth.uid(), 'admin'));
