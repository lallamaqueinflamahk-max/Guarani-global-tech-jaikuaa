CREATE TABLE public.ai_usage (
  user_id uuid NOT NULL,
  day date NOT NULL,
  feature text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day, feature)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ai usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(_user_id uuid, _feature text, _limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _day date := (now() AT TIME ZONE 'America/Asuncion')::date; _c integer;
BEGIN
  INSERT INTO public.ai_usage (user_id, day, feature, count) VALUES (_user_id, _day, _feature, 0)
  ON CONFLICT DO NOTHING;
  UPDATE public.ai_usage SET count = count + 1, updated_at = now()
    WHERE user_id = _user_id AND day = _day AND feature = _feature AND count < _limit
    RETURNING count INTO _c;
  RETURN _c IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(_key text, _limit integer, _window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _w timestamptz := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds); _c integer;
BEGIN
  INSERT INTO public.rate_limits (bucket_key, window_start, count) VALUES (_key, _w, 1)
  ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO _c;
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  END IF;
  RETURN _c <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;