-- Create staff task tracker for admin-only field staff activity management

create table public.staff_todos (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references auth.users(id),
  todo_date date not null,
  activity text not null,
  location text,
  is_done boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_todos enable row level security;

create policy "Admins manage staff todos" on public.staff_todos
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
