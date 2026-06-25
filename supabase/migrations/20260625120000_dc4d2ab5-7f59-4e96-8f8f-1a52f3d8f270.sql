-- Add project job numbers, vendor assignment cost tracking, and quotation payment status

BEGIN;

-- Create a sequence and generator for a FusionPro job number.
CREATE SEQUENCE IF NOT EXISTS public.project_job_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_project_job_number()
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN format('FP-%s-%04s', extract(year from current_date)::int, nextval('public.project_job_number_seq'));
END;
$$;

ALTER TABLE public.projects
  ADD COLUMN job_number text;

-- Backfill existing projects with sequential job numbers.
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.projects
)
UPDATE public.projects p
SET job_number = format('FP-%s-%04s', extract(year from current_date)::int, numbered.rn)
FROM numbered
WHERE p.id = numbered.id;

SELECT setval(
  'public.project_job_number_seq',
  COALESCE(
    (SELECT MAX((regexp_replace(job_number, '^.*-(\\d+)$', '\\1'))::int) FROM public.projects),
    0
  )
);

ALTER TABLE public.projects
  ALTER COLUMN job_number SET NOT NULL,
  ALTER COLUMN job_number SET DEFAULT public.generate_project_job_number();

ALTER TABLE public.projects
  ADD CONSTRAINT projects_job_number_key UNIQUE (job_number);

ALTER TABLE public.project_vendor_assignments
  ADD COLUMN cost numeric NOT NULL DEFAULT 0;

ALTER TABLE public.quotations
  ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid';

ALTER TABLE public.quotations
  ADD CONSTRAINT quotations_payment_status_check
  CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

COMMIT;
