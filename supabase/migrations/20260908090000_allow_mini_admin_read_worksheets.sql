-- Allow quotation reviewers to open the worksheet during approval.
create policy "Mini-admins can view worksheets" on public.worksheets
  for select to authenticated
  using (public.has_role(auth.uid(), 'mini_admin'::app_role));