ALTER TABLE public.corpus_words
  ADD COLUMN validated_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN validated_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS corpus_words_validated_by_idx ON public.corpus_words(validated_by);

CREATE POLICY "Editors view all words" ON public.corpus_words
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors update words" ON public.corpus_words
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'editor'));

CREATE OR REPLACE FUNCTION public.tg_corpus_words_validation()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'draft' THEN
    NEW.validated_by := NULL;
    NEW.validated_at := NULL;
  ELSIF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    IF NEW.validated_by IS NULL AND auth.uid() IS NOT NULL THEN
      NEW.validated_by := auth.uid();
    END IF;
    IF NEW.validated_by IS NOT NULL AND NEW.validated_at IS NULL THEN
      NEW.validated_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER corpus_words_validation
  BEFORE UPDATE ON public.corpus_words
  FOR EACH ROW EXECUTE FUNCTION public.tg_corpus_words_validation();