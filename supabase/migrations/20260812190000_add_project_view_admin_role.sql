-- Add the project_view_admin role. This must stay its own migration —
-- Postgres will not let a new enum value be referenced in the same
-- transaction that adds it.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_view_admin';
