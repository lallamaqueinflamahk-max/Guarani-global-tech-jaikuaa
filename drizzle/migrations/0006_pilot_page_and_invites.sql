CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.app_settings (key, value) VALUES ('pilot_page_status', 'draft'), ('pilot_contact', '')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  cohort text NOT NULL DEFAULT 'Piloto Ateneo',
  max_uses integer NOT NULL DEFAULT 50 CHECK (max_uses > 0),
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.invite_redemptions (
  code_id uuid NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (code_id, user_id)
);
GRANT ALL ON public.invite_redemptions TO service_role;
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.redeem_invite(_user_id uuid, _code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _c public.invite_codes%ROWTYPE; _n integer;
BEGIN
  SELECT * INTO _c FROM public.invite_codes WHERE upper(code) = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND OR NOT _c.active OR (_c.expires_at IS NOT NULL AND _c.expires_at < now()) THEN
    RETURN 'invalid';
  END IF;
  IF EXISTS (SELECT 1 FROM public.invite_redemptions WHERE code_id = _c.id AND user_id = _user_id) THEN
    UPDATE public.profiles SET cohort = _c.cohort WHERE id = _user_id;
    RETURN 'ok';
  END IF;
  IF _c.uses >= _c.max_uses THEN RETURN 'full'; END IF;
  INSERT INTO public.invite_redemptions (code_id, user_id) VALUES (_c.id, _user_id);
  UPDATE public.invite_codes SET uses = uses + 1 WHERE id = _c.id;
  UPDATE public.profiles SET cohort = _c.cohort WHERE id = _user_id;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_invite(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_invite(uuid, text) TO service_role;