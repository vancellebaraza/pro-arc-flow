insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do update set public = true;

create policy "Gallery images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

create policy "Gallery managers can upload images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gallery-images'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'mini_admin')
    )
  );

create policy "Gallery managers can delete images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'gallery-images'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'mini_admin')
    )
  );