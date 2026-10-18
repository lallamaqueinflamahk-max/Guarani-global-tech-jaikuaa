/**
 * Significados del Wikcionario (Wiktionary en inglés, sección «Paraguayan Guarani»), extraídos
 * por kaikki.org. Licencia CC BY-SA 4.0 / GFDL: se muestra SIEMPRE con la atribución
 * «Wiktionary contributors, vía kaikki.org».
 *
 * Es una fuente colaborativa externa: NO es la Gramática ALG 2020 ni está validada por docentes.
 * Este módulo solo busca: no agrega, no traduce y no corrige ninguna palabra ni definición.
 * Los datos viven en data/wikcionario-gn.json y se envían solo al Laboratorio (admin).
 */
import { normalizeWord } from "./analyzer";

/** [palabra, clase gramatical (en inglés, como la escribe la fuente), definiciones en inglés] */
export type WiktionaryRaw = [string, string, string[]];

export interface WiktionarySource {
  fuente: string;
  url: string;
  atribucion: string;
  licencia: string;
  fecha_de_descarga: string;
}

export type FormOfKind =
  | "plural"
  | "forma-dependiente"
  | "posesivo-3"
  | "predicativo-3"
  | "circunflejo"
  | "error-de-escritura"
  | "variante"
  | "sinonimo"
  | "abreviacion";

export interface WiktionaryEntry {
  word: string;
  pos: string;
  glosses: string[];
  /** Si la definición dice «plural of X», «dependent form of X», etc.: a qué palabra remite. */
  formOf?: { kind: FormOfKind; lemma: string };
}

export interface WiktionaryHit {
  entry: WiktionaryEntry;
  /** true si coincide solo al quitar las tildes (la fuente la escribe con otra tilde). */
  accentDiffers: boolean;
  /** Entradas de la palabra a la que remite (un solo paso), p. ej. el singular de un plural. */
  lemma?: WiktionaryEntry[];
}

/** Clases gramaticales de la fuente, en castellano (traducción de la etiqueta inglesa, no del guaraní). */
export const POS_LABEL: Record<string, string> = {
  noun: "sustantivo",
  verb: "verbo",
  adj: "adjetivo",
  adv: "adverbio",
  postp: "posposición",
  pron: "pronombre",
  det: "determinante",
  num: "numeral",
  conj: "conjunción",
  intj: "interjección",
  name: "nombre propio",
  suffix: "sufijo",
  prefix: "prefijo",
  circumfix: "circunfijo",
  character: "letra",
  phrase: "expresión",
  article: "artículo",
};

export const FORM_OF_LABEL: Record<FormOfKind, string> = {
  plural: "plural de",
  "forma-dependiente": "forma dependiente de",
  "posesivo-3": "forma de 3.ª persona (posesión) de",
  "predicativo-3": "forma predicativa de 3.ª persona de",
  circunflejo: "escritura con circunflejo (^) de",
  "error-de-escritura": "según la fuente, error de escritura de",
  variante: "variante de",
  sinonimo: "sinónimo de",
  abreviacion: "forma abreviada de",
};

const FORM_OF_PATTERNS: [RegExp, FormOfKind][] = [
  [/^plural of (.+)$/i, "plural"],
  [/^dependent form of (.+)$/i, "forma-dependiente"],
  [/^third-person possessed form of (.+)$/i, "posesivo-3"],
  [/^3rd-person predicative form of (.+)$/i, "predicativo-3"],
  [/^circumflex-system spelling of (.+)$/i, "circunflejo"],
  [/^misspelling of (.+)$/i, "error-de-escritura"],
  [/^alternative (?:letter-case )?form of (.+)$/i, "variante"],
  [/^synonym of (.+)$/i, "sinonimo"],
  [/^ellipsis of (.+)$/i, "abreviacion"],
];

export function parseFormOf(gloss: string): WiktionaryEntry["formOf"] {
  for (const [re, kind] of FORM_OF_PATTERNS) {
    const m = gloss.trim().match(re);
    // «alternative form of Amérika (“America”)» → «Amérika»
    const lemma = m?.[1]?.replace(/\s*\(.*$/, "").trim();
    if (lemma) return { kind, lemma };
  }
  return undefined;
}

export function toEntry([word, pos, glosses]: WiktionaryRaw): WiktionaryEntry {
  const formOf = glosses.length === 1 ? parseFormOf(glosses[0] ?? "") : undefined;
  return { word, pos, glosses, ...(formOf ? { formOf } : {}) };
}

const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

export interface WiktionaryIndex {
  size: number;
  lookup(word: string): WiktionaryHit[];
  has(word: string): boolean;
}

export function buildWiktionaryIndex(raw: WiktionaryRaw[]): WiktionaryIndex {
  const exact = new Map<string, WiktionaryEntry[]>();
  const loose = new Map<string, WiktionaryEntry[]>();
  const push = (m: Map<string, WiktionaryEntry[]>, k: string, e: WiktionaryEntry) => {
    const list = m.get(k);
    if (list) list.push(e);
    else m.set(k, [e]);
  };
  for (const r of raw) {
    const e = toEntry(r);
    const k = normalizeWord(e.word);
    if (!k) continue;
    push(exact, k, e);
    push(loose, stripAcute(k), e);
  }
  const find = (word: string): { entries: WiktionaryEntry[]; accentDiffers: boolean } => {
    const k = normalizeWord(word);
    if (!k) return { entries: [], accentDiffers: false };
    const hit = exact.get(k);
    if (hit) return { entries: hit, accentDiffers: false };
    return { entries: loose.get(stripAcute(k)) ?? [], accentDiffers: true };
  };
  return {
    size: raw.length,
    has: (word) => find(word).entries.length > 0,
    lookup(word) {
      const { entries, accentDiffers } = find(word);
      return entries.map((entry) => {
        const lemma = entry.formOf ? find(entry.formOf.lemma).entries.filter((l) => l !== entry) : [];
        return { entry, accentDiffers, ...(lemma.length > 0 ? { lemma } : {}) };
      });
    },
  };
}
