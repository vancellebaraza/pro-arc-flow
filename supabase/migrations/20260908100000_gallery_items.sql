create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  stage text not null check (stage in ('before', 'during', 'after')),
  image_url text not null,
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;

create policy "gallery_items_public_select" on public.gallery_items
  for select
  using (true);

create policy "gallery_items_admin_manage" on public.gallery_items
  for all
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'mini_admin')))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'mini_admin')));
