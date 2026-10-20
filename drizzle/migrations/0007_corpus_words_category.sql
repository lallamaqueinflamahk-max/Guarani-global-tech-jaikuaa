ALTER TABLE public.corpus_words
  ADD COLUMN category text;

ALTER TABLE public.corpus_words
  ADD CONSTRAINT corpus_words_category_check CHECK (
    category IS NULL OR category IN (
      'Saludos y cortesía',
      'Familia y personas',
      'Salud',
      'Justicia y trámites',
      'Campo y ganadería',
      'Educación',
      'Naturaleza y clima',
      'Comidas y bebidas',
      'Números y tiempo',
      'Comercio y trabajo',
      'Otra'
    )
  );

COMMENT ON COLUMN public.corpus_words.category IS 'Categoría temática opcional para organizar el vocabulario por área de uso.';