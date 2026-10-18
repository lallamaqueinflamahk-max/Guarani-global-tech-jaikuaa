/**
 * Índice del vocabulario de la plataforma para el Laboratorio Morfológico.
 *
 * El vocabulario de Jaikuaa guarda palabras conjugadas tal como se enseñan ("Aguata", "Akaru"),
 * no raíces sueltas. Para saber si una raíz está "atestiguada", se le quita a cada palabra del
 * vocabulario solo el prefijo de persona (lectura sin voz ni sufijos) y se anota la raíz que queda,
 * junto con la palabra de donde salió, para mostrarla como evidencia.
 *
 * Dos niveles, nunca mezclados:
 * - "validada": la palabra fue validada por un docente validador (rol editor).
 * - "en el vocabulario": la palabra está publicada, pero ningún docente la validó todavía.
 * Ni este archivo ni el analizador escriben guaraní: solo comparan con lo que cargaron personas.
 */
import { analyze, normalizeWord } from "./analyzer";
import { rootKey } from "./corpus-matcher";

export interface CorpusEntry {
  /** La palabra o frase en guaraní tal como está en el vocabulario. */
  gn: string;
  /** true solo si la validó un docente validador. */
  validated: boolean;
}

export type Attestation =
  | { level: "validated"; examples: string[] }
  /** La raíz aparece tal cual en la Gramática ALG 2020 (fuente oficial), con sus páginas. */
  | { level: "book"; examples: string[]; pages: number[] }
  /** La raíz es una entrada del diccionario de la Academia publicado por la SPL (enlace a la entrada). */
  | { level: "dictionary"; examples: string[]; refs: string[] }
  | { level: "published"; examples: string[] }
  | { level: "none"; examples: [] };

/** Lo mínimo que se necesita del índice del libro (ver book-lexicon.ts). */
export interface BookLookup {
  lookup(word: string): { form: string; pages: number[] } | null;
}

/** Lo mínimo que se necesita del diccionario de la SPL (ver spl-dictionary.ts). */
export interface DictionaryLookup {
  lookup(word: string): { form: string; entry: { ref: string } }[];
}

export interface CorpusIndex {
  /** ¿La raíz aparece en alguna palabra del vocabulario? Devuelve hasta 3 palabras de ejemplo. */
  root(root: string): Attestation;
  /** ¿La palabra escrita está tal cual en el vocabulario? */
  word(word: string): Attestation;
  size: number;
}

type Bucket = { validated: Set<string>; published: Set<string> };

const add = (map: Map<string, Bucket>, key: string, example: string, validated: boolean) => {
  if (!key) return;
  const b = map.get(key) ?? { validated: new Set<string>(), published: new Set<string>() };
  (validated ? b.validated : b.published).add(example);
  map.set(key, b);
};

const read = (b: Bucket | undefined): Attestation => {
  if (b?.validated.size) return { level: "validated", examples: [...b.validated].slice(0, 3) };
  if (b?.published.size) return { level: "published", examples: [...b.published].slice(0, 3) };
  return { level: "none", examples: [] };
};

export function buildCorpusIndex(entries: CorpusEntry[]): CorpusIndex {
  const roots = new Map<string, Bucket>();
  const words = new Map<string, Bucket>();
  let size = 0;
  for (const entry of entries) {
    for (const token of entry.gn.split(/\s+/)) {
      const clean = token.replace(/[¿?¡!.,;:()"«»]/g, "");
      if (!clean) continue;
      size++;
      add(words, rootKey(clean), clean, entry.validated);
      for (const a of analyze(clean)) {
        // Solo la lectura más conservadora: prefijo de persona y nada más.
        if (a.negated || a.voices.length || a.suffixes.length || a.paradigm === "imperativo") continue;
        add(roots, rootKey(a.root), clean, entry.validated);
      }
    }
  }
  return {
    root: (r) => read(roots.get(rootKey(r))),
    word: (w) => read(words.get(rootKey(normalizeWord(w)))),
    size,
  };
}

/** Docente validador > libro oficial > diccionario de la Academia > vocabulario sin validar > nada. */
const RANK: Record<Attestation["level"], number> = { validated: 0, book: 1, dictionary: 2, published: 3, none: 4 };

/** Atestiguación de una raíz combinando el vocabulario de la plataforma y el libro. */
export function attestRoot(
  root: string,
  index: CorpusIndex | null,
  book?: BookLookup | null,
  dictionary?: DictionaryLookup | null,
): Attestation {
  const fromCorpus: Attestation = index ? index.root(root) : { level: "none", examples: [] };
  if (fromCorpus.level === "validated") return fromCorpus;
  const hit = book?.lookup(root);
  if (hit) return { level: "book", examples: [hit.form], pages: hit.pages.slice(0, 5) };
  const dict = dictionary?.lookup(root) ?? [];
  if (dict.length > 0) {
    return { level: "dictionary", examples: [...new Set(dict.map((d) => d.form))].slice(0, 3), refs: dict.map((d) => d.entry.ref).slice(0, 3) };
  }
  return fromCorpus;
}

/**
 * Ordena lecturas: primero raíces validadas por docentes, después las que están en el libro,
 * después las del diccionario de la Academia (SPL), después las del vocabulario sin validar; dentro de cada grupo, el orden del analizador.
 */
export function rankByAttestation<T extends { root: string }>(
  readings: T[],
  index: CorpusIndex | null,
  book?: BookLookup | null,
  dictionary?: DictionaryLookup | null,
): { reading: T; attestation: Attestation }[] {
  return readings
    .map((reading, i) => ({ reading, i, attestation: attestRoot(reading.root, index, book, dictionary) }))
    .sort((x, y) => RANK[x.attestation.level] - RANK[y.attestation.level] || x.i - y.i)
    .map(({ reading, attestation }) => ({ reading, attestation }));
}
