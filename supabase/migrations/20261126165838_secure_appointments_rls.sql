ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.appointments FROM anon, authenticated;
