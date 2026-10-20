-- ============ ROLES ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ NIVELES MEC ============
CREATE TABLE public.mec_levels (
  id text PRIMARY KEY,
  label text NOT NULL,
  stage text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  units jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mec_levels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mec_levels TO authenticated;
GRANT ALL ON public.mec_levels TO service_role;
ALTER TABLE public.mec_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view levels" ON public.mec_levels
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage levels" ON public.mec_levels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER mec_levels_updated_at BEFORE UPDATE ON public.mec_levels
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PALABRAS ============
CREATE TABLE public.corpus_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gn text NOT NULL,
  es text NOT NULL,
  audio_slug text NOT NULL,
  has_audio boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corpus_words_gn_unique UNIQUE (gn),
  CONSTRAINT corpus_words_status_check CHECK (status IN ('draft', 'published'))
);

CREATE INDEX corpus_words_audio_slug_idx ON public.corpus_words (audio_slug);
CREATE INDEX corpus_words_status_idx ON public.corpus_words (status);

GRANT SELECT ON public.corpus_words TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corpus_words TO authenticated;
GRANT ALL ON public.corpus_words TO service_role;
ALTER TABLE public.corpus_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published words" ON public.corpus_words
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins view all words" ON public.corpus_words
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert words" ON public.corpus_words
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update words" ON public.corpus_words
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete words" ON public.corpus_words
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER corpus_words_updated_at BEFORE UPDATE ON public.corpus_words
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PALABRA x NIVEL ============
CREATE TABLE public.corpus_word_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id uuid NOT NULL REFERENCES public.corpus_words(id) ON DELETE CASCADE,
  level_id text NOT NULL REFERENCES public.mec_levels(id) ON DELETE CASCADE,
  unit text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (word_id, level_id, unit)
);

CREATE INDEX corpus_word_levels_level_idx ON public.corpus_word_levels (level_id);
CREATE INDEX corpus_word_levels_word_idx ON public.corpus_word_levels (word_id);

GRANT SELECT ON public.corpus_word_levels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corpus_word_levels TO authenticated;
GRANT ALL ON public.corpus_word_levels TO service_role;
ALTER TABLE public.corpus_word_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view word levels" ON public.corpus_word_levels
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage word levels" ON public.corpus_word_levels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ORACIONES ============
CREATE TABLE public.corpus_sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gn text NOT NULL,
  es text NOT NULL,
  level_id text REFERENCES public.mec_levels(id) ON DELETE SET NULL,
  unit text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT corpus_sentences_gn_unique UNIQUE (gn),
  CONSTRAINT corpus_sentences_status_check CHECK (status IN ('draft', 'published'))
);

CREATE INDEX corpus_sentences_level_idx ON public.corpus_sentences (level_id);

GRANT SELECT ON public.corpus_sentences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corpus_sentences TO authenticated;
GRANT ALL ON public.corpus_sentences TO service_role;
ALTER TABLE public.corpus_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published sentences" ON public.corpus_sentences
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins view all sentences" ON public.corpus_sentences
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert sentences" ON public.corpus_sentences
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update sentences" ON public.corpus_sentences
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete sentences" ON public.corpus_sentences
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER corpus_sentences_updated_at BEFORE UPDATE ON public.corpus_sentences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PALABRAS DE CADA ORACION ============
CREATE TABLE public.corpus_sentence_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_id uuid NOT NULL REFERENCES public.corpus_sentences(id) ON DELETE CASCADE,
  word_id uuid REFERENCES public.corpus_words(id) ON DELETE SET NULL,
  token text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sentence_id, position)
);

CREATE INDEX corpus_sentence_words_sentence_idx ON public.corpus_sentence_words (sentence_id);

GRANT SELECT ON public.corpus_sentence_words TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corpus_sentence_words TO authenticated;
GRANT ALL ON public.corpus_sentence_words TO service_role;
ALTER TABLE public.corpus_sentence_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sentence words" ON public.corpus_sentence_words
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage sentence words" ON public.corpus_sentence_words
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ NIVELES INICIALES (1° básica -> 3er curso) ============
INSERT INTO public.mec_levels (id, label, stage, sort_order) VALUES
  ('eeb-1', '1° grado', 'Educación Escolar Básica', 1),
  ('eeb-2', '2° grado', 'Educación Escolar Básica', 2),
  ('eeb-3', '3° grado', 'Educación Escolar Básica', 3),
  ('eeb-4', '4° grado', 'Educación Escolar Básica', 4),
  ('eeb-5', '5° grado', 'Educación Escolar Básica', 5),
  ('eeb-6', '6° grado', 'Educación Escolar Básica', 6),
  ('eeb-7', '7° grado', 'Educación Escolar Básica', 7),
  ('eeb-8', '8° grado', 'Educación Escolar Básica', 8),
  ('eeb-9', '9° grado', 'Educación Escolar Básica', 9),
  ('em-1', '1er curso', 'Educación Media', 10),
  ('em-2', '2do curso', 'Educación Media', 11),
  ('em-3', '3er curso', 'Educación Media', 12);