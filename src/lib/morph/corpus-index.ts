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
  | { level: "published"; examples: string[] }
  | { level: "none"; examples: [] };

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

const RANK: Record<Attestation["level"], number> = { validated: 0, published: 1, none: 2 };

/** Ordena lecturas: primero raíces validadas, después raíces del vocabulario; dentro de cada grupo, el orden del analizador. */
export function rankByAttestation<T extends { root: string }>(readings: T[], index: CorpusIndex | null): { reading: T; attestation: Attestation }[] {
  return readings
    .map((reading, i) => ({ reading, i, attestation: index ? index.root(reading.root) : ({ level: "none", examples: [] } as Attestation) }))
    .sort((x, y) => RANK[x.attestation.level] - RANK[y.attestation.level] || x.i - y.i)
    .map(({ reading, attestation }) => ({ reading, attestation }));
}
