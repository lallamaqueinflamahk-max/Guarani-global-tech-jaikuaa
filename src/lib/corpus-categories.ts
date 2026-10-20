/** Categorías temáticas fijas del corpus (área de uso). Lista única para servidor y panel. */
export const CORPUS_CATEGORIES = [
  "Saludos y cortesía",
  "Familia y personas",
  "Salud",
  "Justicia y trámites",
  "Campo y ganadería",
  "Educación",
  "Naturaleza y clima",
  "Comidas y bebidas",
  "Números y tiempo",
  "Comercio y trabajo",
  "Otra",
] as const;

export type CorpusCategory = (typeof CORPUS_CATEGORIES)[number];
