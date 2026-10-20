CREATE TABLE public.sponsor_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL,
  sponsor_name text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_impressions_created_idx ON public.sponsor_impressions (created_at);
GRANT SELECT, INSERT ON public.sponsor_impressions TO authenticated;
GRANT ALL ON public.sponsor_impressions TO service_role;
ALTER TABLE public.sponsor_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own impressions" ON public.sponsor_impressions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read impressions" ON public.sponsor_impressions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.sponsor_impressions_report(_days integer)
RETURNS TABLE (slot text, sponsor_name text, impressions bigint, unique_users bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  SELECT slot, sponsor_name, count(*), count(DISTINCT user_id)
  FROM public.sponsor_impressions
  WHERE created_at >= now() - make_interval(days => _days)
  GROUP BY slot, sponsor_name
  ORDER BY slot, count(*) DESC
$$;
REVOKE EXECUTE ON FUNCTION public.sponsor_impressions_report(integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.sponsor_impressions_report(integer) TO authenticated;