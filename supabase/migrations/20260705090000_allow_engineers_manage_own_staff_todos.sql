-- Allow engineers to create and maintain their own staff todo rows.

create policy "Engineers read own staff todos" on public.staff_todos
  for select
  to authenticated
  using (staff_user_id = auth.uid());

create policy "Engineers create own staff todos" on public.staff_todos
  for insert
  to authenticated
  with check (
    staff_user_id = auth.uid()
    and created_by = auth.uid()
    and public.has_role(auth.uid(), 'engineer'::app_role)
  );

create policy "Engineers update own staff todos" on public.staff_todos
  for update
  to authenticated
  using (
    staff_user_id = auth.uid()
    and public.has_role(auth.uid(), 'engineer'::app_role)
  )
  with check (
    staff_user_id = auth.uid()
    and public.has_role(auth.uid(), 'engineer'::app_role)
  );
