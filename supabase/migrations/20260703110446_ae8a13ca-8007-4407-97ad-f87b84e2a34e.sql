
-- =========================================================
-- 1. USER STATS (XP, streak, badges) — one row per user
-- =========================================================
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_active_date date,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stats"
  ON public.user_stats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stats"
  ON public.user_stats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stats"
  ON public.user_stats FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 2. TRIVIA CATEGORIES (public catalog)
-- =========================================================
CREATE TABLE public.trivia_categories (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text NOT NULL,
  emoji text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trivia_categories TO anon, authenticated;
GRANT ALL ON public.trivia_categories TO service_role;

ALTER TABLE public.trivia_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.trivia_categories FOR SELECT TO anon, authenticated
  USING (true);

-- =========================================================
-- 3. TRIVIA QUESTIONS (server-only; correct answer never leaves server)
-- =========================================================
CREATE TABLE public.trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL REFERENCES public.trivia_categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL CHECK (correct_index >= 0),
  explanation text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX trivia_questions_by_category ON public.trivia_questions(category_id, sort_order);

-- Only service_role. NO grants to anon/authenticated → invisible via Data API.
GRANT ALL ON public.trivia_questions TO service_role;
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
-- (No policies → no client access. Server functions use service role.)

-- =========================================================
-- 4. XP TRANSACTIONS (audit log, idempotent by sync_id)
-- =========================================================
CREATE TABLE public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source text NOT NULL,           -- 'trivia' | 'lesson' | 'escolar' | 'migration' | 'other'
  source_ref text,                -- e.g. category id, lesson number
  question_id uuid REFERENCES public.trivia_questions(id) ON DELETE SET NULL,
  session_id uuid,                -- optional link to trivia_sessions
  sync_id text UNIQUE,            -- client-supplied idempotency key
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX xp_transactions_user_created ON public.xp_transactions(user_id, created_at DESC);
CREATE INDEX xp_transactions_source ON public.xp_transactions(source, created_at DESC);

GRANT SELECT ON public.xp_transactions TO authenticated;
GRANT ALL ON public.xp_transactions TO service_role;

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own xp transactions"
  ON public.xp_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policies: only service_role writes (via server functions).

-- =========================================================
-- 5. TRIVIA QUESTION AWARDS (24h dedup, Asunción timezone)
-- =========================================================
CREATE TABLE public.trivia_question_awards (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.trivia_questions(id) ON DELETE CASCADE,
  awarded_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Asuncion')::date),
  xp_awarded integer NOT NULL DEFAULT 0,
  answered_correctly boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id, awarded_date)
);

CREATE INDEX trivia_awards_user_date ON public.trivia_question_awards(user_id, awarded_date DESC);

GRANT SELECT ON public.trivia_question_awards TO authenticated;
GRANT ALL ON public.trivia_question_awards TO service_role;

ALTER TABLE public.trivia_question_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own awards"
  ON public.trivia_question_awards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- 6. TRIVIA SESSIONS (resume state)
-- =========================================================
CREATE TABLE public.trivia_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES public.trivia_categories(id) ON DELETE CASCADE,
  question_ids uuid[] NOT NULL,         -- snapshot of ordered question ids
  current_idx integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  is_practice boolean NOT NULL DEFAULT false,
  question_started_at timestamptz,      -- server timestamp for elapsed-time check
  completed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one ACTIVE (unfinished) session per user+category — allows resume
CREATE UNIQUE INDEX trivia_sessions_one_active
  ON public.trivia_sessions(user_id, category_id)
  WHERE completed_at IS NULL AND abandoned_at IS NULL;

CREATE INDEX trivia_sessions_by_user ON public.trivia_sessions(user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.trivia_sessions TO authenticated;
GRANT ALL ON public.trivia_sessions TO service_role;

ALTER TABLE public.trivia_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions"
  ON public.trivia_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- No INSERT/UPDATE from clients directly: writes go through server functions.
-- (SELECT is allowed so client can subscribe/refetch if needed.)

-- =========================================================
-- Shared updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trivia_sessions_updated_at
  BEFORE UPDATE ON public.trivia_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- Auto-create user_stats row on new auth user
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();

-- Backfill: create user_stats rows for all existing users
INSERT INTO public.user_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================
-- SEED trivia_categories + trivia_questions
-- =========================================================
INSERT INTO public.trivia_categories (id, title, subtitle, emoji, sort_order) VALUES
  ('vocabulario', 'Vocabulario Guaraní', 'Palabras esenciales del ñe''ẽ', '📚', 1),
  ('mitos',       'Mitos y Leyendas',    'Los seres del imaginario paraguayo', '🌙', 2),
  ('cultura',     'Cultura y Lengua',    'Identidad paraguaya y ñe''ẽ', '🇵🇾', 3);

-- Vocabulario
INSERT INTO public.trivia_questions (category_id, question, options, correct_index, explanation, sort_order) VALUES
  ('vocabulario', '¿Qué significa "Kuarahy"?',
    '["Luna","Sol","Estrella","Río"]'::jsonb, 1, 'Kuarahy es el sol.', 1),
  ('vocabulario', '¿Cómo se dice "agua"?',
    '["Yvy","Y","Yvoty","Yvytu"]'::jsonb, 1, '"Y" significa agua; Yvy es tierra.', 2),
  ('vocabulario', '¿Qué significa "Jaguarete"?',
    '["Perro","Gato montés","Jaguar","Zorro"]'::jsonb, 2, 'El jaguarete es el jaguar, símbolo de fuerza.', 3),
  ('vocabulario', '¿Qué significa "Mba''éichapa"?',
    '["Buenos días","¿Cómo estás?","Gracias","Hasta luego"]'::jsonb, 1, 'Es el saludo guaraní más usado.', 4),
  ('vocabulario', '¿Cómo se dice "gracias"?',
    '["Aguyje","Jajoecháta","Iporã","Ñandejára"]'::jsonb, 0, 'Aguyje expresa gratitud.', 5);

-- Mitos y Leyendas
INSERT INTO public.trivia_questions (category_id, question, options, correct_index, explanation, sort_order) VALUES
  ('mitos', '¿Cuál es uno de los siete mitos guaraníes?',
    '["El Pombéro","El Chupacabras","La Llorona","El Basilisco"]'::jsonb, 0,
    'El Pombéro es uno de los seres míticos más conocidos.', 1),
  ('mitos', '¿Cómo se describe tradicionalmente al Jasy Jateré?',
    '["Un espíritu del agua","Un niño rubio que aparece en la siesta","Un ave gigante","Un árbol sagrado"]'::jsonb, 1,
    'Se dice que rapta a los niños que no duermen la siesta.', 2),
  ('mitos', '¿Quiénes son los padres de los siete seres míticos según la leyenda?',
    '["Tau y Kerana","Ñande Ru y Arasy","Jasy y Kuarahy","Tupã y Sypave"]'::jsonb, 0,
    'De Tau y Kerana nacen los siete hijos míticos.', 3),
  ('mitos', '¿Qué ser mítico es conocido como protector del monte y sus animales?',
    '["El Kurupi","El Lobizón","El Mbói Tu''ĩ","El Ao Ao"]'::jsonb, 0,
    'Según la tradición, cuida el monte y sus criaturas.', 4),
  ('mitos', '¿Qué es el Luisõ en la mitología popular?',
    '["Un pájaro nocturno","Un hombre que se transforma (similar al lobizón)","Una serpiente gigante","Un duende del río"]'::jsonb, 1,
    'Es la figura paraguaya del hombre lobo.', 5);

-- Cultura y Lengua
INSERT INTO public.trivia_questions (category_id, question, options, correct_index, explanation, sort_order) VALUES
  ('cultura', '¿El guaraní es lengua oficial del Paraguay?',
    '["No","Sí, junto con el español","Solo en el interior","Solo simbólicamente"]'::jsonb, 1,
    'La Constitución reconoce ambas lenguas oficiales.', 1),
  ('cultura', '¿Qué significa "Jaikuaa"?',
    '["Aprender","Conozcamos juntos","Enseñar","Hablar"]'::jsonb, 1,
    'Es el espíritu de esta plataforma.', 2),
  ('cultura', '¿Qué es el "jopara"?',
    '["Un plato típico solamente","La mezcla de guaraní y español","Un dialecto del norte","Una danza"]'::jsonb, 1,
    'Es la forma mixta en que se habla a diario.', 3),
  ('cultura', '¿Qué es el "puso" en guaraní?',
    '["Un acento","La pausa glotal","Una letra muda","Un sufijo"]'::jsonb, 1,
    'Como en Ñe''ẽ — corta el sonido entre vocales.', 4),
  ('cultura', '¿Qué significa "Ñe''ẽ"?',
    '["Palabra o lengua","Canto","Historia","Silencio"]'::jsonb, 0,
    'Ñe''ẽ es palabra, lengua, el habla.', 5);
