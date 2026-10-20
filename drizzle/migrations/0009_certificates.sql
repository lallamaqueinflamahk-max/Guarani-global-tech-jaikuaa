CREATE TABLE public.certificates (
  user_id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  lessons integer NOT NULL,
  issued_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own certificate readable" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);