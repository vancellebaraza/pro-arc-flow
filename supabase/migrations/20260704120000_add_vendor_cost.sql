-- Add vendor cost column
alter table public.vendors
  add column cost numeric;

-- No RLS changes required; existing rows will have NULL cost.
