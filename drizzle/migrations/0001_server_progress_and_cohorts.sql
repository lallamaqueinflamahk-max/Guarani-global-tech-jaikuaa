ALTER TABLE public.profiles ADD COLUMN cohort text NULL;
CREATE INDEX IF NOT EXISTS profiles_cohort_idx ON public.profiles(cohort);

CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_user_sync_uidx
  ON public.xp_transactions(user_id, sync_id) WHERE sync_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS xp_transactions_created_idx ON public.xp_transactions(created_at);
CREATE INDEX IF NOT EXISTS corpus_words_validated_at_idx ON public.corpus_words(validated_at);

CREATE OR REPLACE FUNCTION public.record_activity(
  _user_id uuid, _amount integer, _source text, _source_ref text,
  _sync_id text, _metadata jsonb, _perfect boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'America/Asuncion')::date;
  _s public.user_stats%ROWTYPE;
  _inserted boolean := false;
  _streak integer;
  _badges jsonb;
  _lessons integer;
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO _s FROM public.user_stats WHERE user_id = _user_id FOR UPDATE;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_ref, sync_id, metadata)
  VALUES (_user_id, GREATEST(_amount, 0), _source, _source_ref, _sync_id, COALESCE(_metadata, '{}'::jsonb))
  ON CONFLICT (user_id, sync_id) WHERE sync_id IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS _lessons = ROW_COUNT;
  _inserted := _lessons > 0;

  IF NOT _inserted THEN
    RETURN jsonb_build_object('duplicate', true);
  END IF;

  IF _s.last_active_date = _today THEN
    _streak := GREATEST(_s.current_streak, 1);
  ELSIF _s.last_active_date = _today - 1 THEN
    _streak := _s.current_streak + 1;
  ELSE
    _streak := 1;
  END IF;

  _badges := COALESCE(_s.badges, '[]'::jsonb);
  SELECT count(*) INTO _lessons FROM public.xp_transactions
    WHERE user_id = _user_id AND source = 'lesson' AND metadata->>'guarani' = 'true';
  _lessons := _lessons + COALESCE((SELECT max((metadata->>'guarani_lessons')::int) FROM public.xp_transactions
    WHERE user_id = _user_id AND sync_id = 'local-migration'), 0);
  IF _lessons >= 1 AND NOT _badges ? 'primer-paso' THEN _badges := _badges || '["primer-paso"]'; END IF;
  IF _lessons >= 5 AND NOT _badges ? 'guaranihablante' THEN _badges := _badges || '["guaranihablante"]'; END IF;
  IF _streak >= 7 AND NOT _badges ? 'racha-fuego' THEN _badges := _badges || '["racha-fuego"]'; END IF;
  IF _perfect AND NOT _badges ? 'estudiante-estrella' THEN _badges := _badges || '["estudiante-estrella"]'; END IF;

  UPDATE public.user_stats SET
    xp = xp + GREATEST(_amount, 0),
    current_streak = _streak,
    longest_streak = GREATEST(longest_streak, _streak),
    last_active_date = _today,
    badges = _badges
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.migrate_local_progress(
  _user_id uuid, _xp integer, _streak integer, _last_date date, _badges jsonb, _lessons integer
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _s public.user_stats%ROWTYPE; _n integer;
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO _s FROM public.user_stats WHERE user_id = _user_id FOR UPDATE;
  IF _s.xp > 0 OR EXISTS (SELECT 1 FROM public.xp_transactions WHERE user_id = _user_id AND sync_id = 'local-migration') THEN
    RETURN false;
  END IF;
  INSERT INTO public.xp_transactions (user_id, amount, source, source_ref, sync_id, metadata)
  VALUES (_user_id, _xp, 'local-migration', NULL, 'local-migration',
          jsonb_build_object('guarani_lessons', _lessons, 'streak', _streak, 'last_active_date', _last_date))
  ON CONFLICT (user_id, sync_id) WHERE sync_id IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT;
  IF _n = 0 THEN RETURN false; END IF;
  UPDATE public.user_stats SET
    xp = xp + _xp,
    current_streak = CASE WHEN last_active_date IS NULL OR _last_date > last_active_date THEN _streak ELSE current_streak END,
    longest_streak = GREATEST(longest_streak, _streak),
    last_active_date = CASE WHEN last_active_date IS NULL OR _last_date > last_active_date THEN _last_date ELSE last_active_date END,
    badges = (SELECT COALESCE(jsonb_agg(DISTINCT b), '[]'::jsonb) FROM jsonb_array_elements(COALESCE(badges,'[]'::jsonb) || COALESCE(_badges,'[]'::jsonb)) b)
  WHERE user_id = _user_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_activity(uuid, integer, text, text, text, jsonb, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.migrate_local_progress(uuid, integer, integer, date, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_activity(uuid, integer, text, text, text, jsonb, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.migrate_local_progress(uuid, integer, integer, date, jsonb, integer) TO service_role;