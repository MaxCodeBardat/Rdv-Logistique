ALTER TABLE public.appointments
  ADD COLUMN suppliers jsonb NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(suppliers) = 'array');
