CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL,
  title text NOT NULL,
  theme text NOT NULL DEFAULT '',
  level_id text NULL REFERENCES public.mec_levels(id) ON DELETE SET NULL,
  capacity_code text NULL REFERENCES public.mec_capacities(code) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX lessons_sort_order_uidx ON public.lessons(sort_order);

CREATE TABLE public.lesson_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.corpus_words(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, word_id)
);
CREATE INDEX lesson_words_lesson_idx ON public.lesson_words(lesson_id, position);

GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT ALL ON public.lessons TO service_role;
GRANT SELECT ON public.lesson_words TO anon, authenticated;
GRANT ALL ON public.lesson_words TO service_role;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published lessons" ON public.lessons
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Staff view all lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Anyone can view words of published lessons" ON public.lesson_words
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.status = 'published'));
CREATE POLICY "Staff view all lesson words" ON public.lesson_words
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();