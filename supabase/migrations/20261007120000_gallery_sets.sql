-- Before/after gallery sets: each row is one project showcase with
-- 1-3 "before" images, 1-3 "after" images and a caption for each side.
create table if not exists public.gallery_sets (
  id uuid primary key default gen_random_uuid(),
  before_images text[] not null,
  after_images text[] not null,
  before_text text not null default '',
  after_text text not null default '',
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint gallery_sets_before_count check (cardinality(before_images) between 1 and 3),
  constraint gallery_sets_after_count check (cardinality(after_images) between 1 and 3)
);

alter table public.gallery_sets enable row level security;

drop policy if exists "gallery_sets_public_select" on public.gallery_sets;
create policy "gallery_sets_public_select" on public.gallery_sets
  for select
  using (true);

drop policy if exists "gallery_sets_admin_manage" on public.gallery_sets;
create policy "gallery_sets_admin_manage" on public.gallery_sets
  for all
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'mini_admin')))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'mini_admin')));

create index if not exists gallery_sets_order_idx
  on public.gallery_sets (sort_order, created_at desc);
