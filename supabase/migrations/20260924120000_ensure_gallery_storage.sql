insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Gallery images are publicly readable'
  ) then
    create policy "Gallery images are publicly readable"
      on storage.objects for select
      using (bucket_id = 'gallery-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Gallery managers can upload images'
  ) then
    create policy "Gallery managers can upload images"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'gallery-images'
        and exists (
          select 1 from public.user_roles
          where user_id = auth.uid() and role in ('admin', 'mini_admin')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Gallery managers can delete images'
  ) then
    create policy "Gallery managers can delete images"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'gallery-images'
        and exists (
          select 1 from public.user_roles
          where user_id = auth.uid() and role in ('admin', 'mini_admin')
        )
      );
  end if;
end
$$;