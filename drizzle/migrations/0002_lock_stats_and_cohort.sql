DROP POLICY IF EXISTS "Users insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users update own stats" ON public.user_stats;
REVOKE INSERT, UPDATE, DELETE ON public.user_stats FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_profiles_protect_cohort()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.cohort := NULL;
    ELSIF NEW.cohort IS DISTINCT FROM OLD.cohort THEN
      RAISE EXCEPTION 'cohort can only be set by an administrator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_cohort
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_protect_cohort();