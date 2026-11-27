-- Reproducible baseline for the tables that were originally created directly
-- in the remote project. Later migrations apply RLS and appointment suppliers.

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

DO $migration$
DECLARE
  extension_schema text;
BEGIN
  SELECT n.nspname
    INTO extension_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'btree_gist';

  IF extension_schema = 'public' THEN
    EXECUTE 'ALTER EXTENSION btree_gist SET SCHEMA extensions';
  END IF;
END;
$migration$;

CREATE OR REPLACE FUNCTION public.make_time_range(
  app_date date,
  app_time time without time zone,
  app_duration integer
)
RETURNS pg_catalog.tsrange
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
  SELECT pg_catalog.tsrange(
    app_date + app_time,
    app_date + app_time + pg_catalog.make_interval(mins => app_duration)
  )
$function$;

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  duration integer NOT NULL,
  order_number text,
  email text,
  total_pallets integer,
  created_at timestamp without time zone DEFAULT pg_catalog.now(),
  time_range pg_catalog.tsrange GENERATED ALWAYS AS (
    public.make_time_range(date, start_time, duration)
  ) STORED,
  status text DEFAULT 'pending'::text,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT no_overlapping_appointments EXCLUDE USING gist (time_range WITH &&)
);

CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  CONSTRAINT blocked_slots_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.settings (
  id integer NOT NULL,
  extended_hours boolean DEFAULT false,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
