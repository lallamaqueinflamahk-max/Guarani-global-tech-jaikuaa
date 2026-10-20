/**
 * Análisis de un texto completo, palabra por palabra (vista «semáforo» del Laboratorio).
 *
 * No genera, traduce ni corrige guaraní: solo dice, para cada palabra escrita, qué respaldo tiene
 * en las fuentes cargadas. Cuatro estados:
 * - "respaldada": la palabra escrita está tal cual en una fuente (libro ALG 2020, listas del libro,
 *   diccionario de la Academia publicado por la SPL, Wikcionario o palabra validada por un docente);
 * - "armada": el motor la descompone con las reglas del libro sobre una raíz respaldada;
 * - "sin_respaldo": el motor no la reconoce (puede ser guaraní que falta, un nombre o un error);
 * - "fuera_alfabeto": tiene letras o sílabas que el alfabeto oficial no usa (castellano, nombres,
 *   errores de escritura). No se cuenta en el porcentaje de guaraní.
 * Ninguna lectura es la correcta hasta que la valide un docente.
 */
import { analyze, normalizeWord } from "./analyzer";
import { analyzeNominal } from "./nominal-analyzer";
import { lookupClosed } from "./closed-classes";
import { checkWord, graphemes } from "./orthography";
import { attestRoot, type BookLookup, type CorpusIndex, type DictionaryLookup } from "./corpus-index";

export type WordStatus = "respaldada" | "armada" | "sin_respaldo" | "fuera_alfabeto";

/** De dónde sale el respaldo de la raíz: tal cual en una fuente, o dentro de otra forma que imprime el libro. */
export type RootSource = "libro" | "libro-forma" | "diccionario" | "wikcionario" | "docente";

export type Evidence =
  | { kind: "libro"; pages: number[] }
  | { kind: "lista-del-libro"; page: number }
  | { kind: "diccionario"; refs: string[] }
  | { kind: "wikcionario" }
  | { kind: "docente" }
  | { kind: "reglas"; parts: string[]; root: string; rootSource: RootSource; pages: number[]; refs: string[]; inForm?: string }
  | { kind: "ninguna"; readings: number }
  | { kind: "alfabeto"; message: string };

export interface TextWord {
  /** Lo que está escrito en el texto. */
  surface: string;
  /** La palabra normalizada que se analizó. */
  word: string;
  status: WordStatus;
  evidence: Evidence;
}

export type TextPiece = { kind: "gap"; text: string } | ({ kind: "word" } & TextWord);

export interface TextSources {
  book?: BookLookup | null;
  dictionary?: DictionaryLookup | null;
  wiktionary?: { has(word: string): boolean } | null;
  corpus?: CorpusIndex | null;
  /** Raíces que aparecen dentro de otras formas del libro (ver buildBookRootIndex). */
  bookRoots?: BookRootIndex | null;
}

/** Raíz (sin acento agudo) → formas del libro que la contienen, con sus páginas. */
export type BookRootIndex = Map<string, { form: string; pages: number[] }[]>;

/**
 * Para cada forma que imprime el libro, guarda las raíces de sus primeras lecturas (3 letras o más).
 * Así «ojuhu» se respalda porque el libro imprime «chejuhu» (pág. 103) con la misma raíz.
 * Es una señal más débil que la raíz impresa sola, y así se muestra.
 */
export function buildBookRootIndex(forms: Record<string, number[]>): BookRootIndex {
  const out: BookRootIndex = new Map();
  for (const [form, pages] of Object.entries(forms)) {
    const roots = new Set<string>();
    for (const a of analyze(form).slice(0, 3)) roots.add(a.root);
    for (const n of analyzeNominal(form).slice(0, 3)) roots.add(n.root);
    for (const r of roots) {
      const key = stripAcute(normalizeWord(r));
      if (graphemes(key).length < 3) continue;
      const list = out.get(key) ?? [];
      if (list.length < 3) list.push({ form, pages: pages.slice(0, 3) });
      out.set(key, list);
    }
  }
  return out;
}

const stripAcute = (s: string) => s.normalize("NFD").replace(/\u0301/g, "").normalize("NFC");

export interface TextAnalysis {
  pieces: TextPiece[];
  counts: Record<WordStatus, number>;
  /** Palabras en guaraní (sin las de fuera del alfabeto). */
  guarani: number;
  /** % de las palabras en guaraní que el motor reconoce (respaldadas + armadas), o null si no hay. */
  recognized: number | null;
}

/** Máximo de palabras por texto (para que el navegador no se trabe). */
export const MAX_TEXT_WORDS = 2000;

const WORD_RE = /[\p{L}\p{M}'’‘´`ʼʻ]+/gu;
const QUOTES = /^['’‘´`ʼʻ]+|['’‘´`ʼʻ]+$/g;
const ROMAN = /^[IVXLCDM]{2,}$/;
/** Cuántas lecturas del analizador se miran para buscar una raíz respaldada. */
const READINGS_TO_CHECK = 6;

/** Clasifica una sola palabra. */
export function classifyWord(surface: string, src: TextSources): TextWord {
  const word = normalizeWord(surface);
  const alpha = checkWord(word).find(
    (i) => (i.rule === "alfabeto" && i.severity !== "revisar") || (i.rule === "silaba-directa" && i.severity === "revisar"),
  );
  if (alpha) return { surface, word, status: "fuera_alfabeto", evidence: { kind: "alfabeto", message: alpha.message } };

  const inCorpus = src.corpus?.word(word);
  if (inCorpus?.level === "validated") return { surface, word, status: "respaldada", evidence: { kind: "docente" } };
  const hit = src.book?.lookup(word);
  if (hit) return { surface, word, status: "respaldada", evidence: { kind: "libro", pages: hit.pages.slice(0, 5) } };
  const closed = lookupClosed(word);
  if (closed.length > 0) return { surface, word, status: "respaldada", evidence: { kind: "lista-del-libro", page: closed[0]!.entry.page } };
  const dict = src.dictionary?.lookup(word) ?? [];
  if (dict.length > 0) return { surface, word, status: "respaldada", evidence: { kind: "diccionario", refs: dict.map((d) => d.entry.ref).slice(0, 3) } };
  if (src.wiktionary?.has(word)) return { surface, word, status: "respaldada", evidence: { kind: "wikcionario" } };

  const verbal = analyze(word).slice(0, READINGS_TO_CHECK);
  const nominal = analyzeNominal(word).slice(0, READINGS_TO_CHECK);
  const candidates: { root: string; parts: string[] }[] = [
    ...verbal.map((a) => ({ root: a.root, parts: [a.prefix, ...a.voices.map((v) => v.form), a.root, ...a.suffixes.map((s) => s.form)].filter(Boolean) })),
    ...nominal.map((n) => ({ root: n.root, parts: [n.possessor?.form ?? "", n.root, ...n.suffixes.map((s) => s.form)].filter(Boolean) })),
  ];
  for (const c of candidates) {
    if (graphemes(normalizeWord(c.root)).length < 2) continue;
    const att = attestRoot(c.root, src.corpus ?? null, src.book, src.dictionary);
    const base = { parts: c.parts, root: c.root };
    if (att.level === "validated") return { surface, word, status: "armada", evidence: { kind: "reglas", ...base, rootSource: "docente", pages: [], refs: [] } };
    if (att.level === "book") return { surface, word, status: "armada", evidence: { kind: "reglas", ...base, rootSource: "libro", pages: att.pages, refs: [] } };
    if (att.level === "dictionary") return { surface, word, status: "armada", evidence: { kind: "reglas", ...base, rootSource: "diccionario", pages: [], refs: att.refs } };
    const inBook = src.bookRoots?.get(stripAcute(normalizeWord(c.root)))?.find((f) => f.form !== word);
    if (inBook) return { surface, word, status: "armada", evidence: { kind: "reglas", ...base, rootSource: "libro-forma", pages: inBook.pages, refs: [], inForm: inBook.form } };
    if (src.wiktionary?.has(c.root)) return { surface, word, status: "armada", evidence: { kind: "reglas", ...base, rootSource: "wikcionario", pages: [], refs: [] } };
  }
  return { surface, word, status: "sin_respaldo", evidence: { kind: "ninguna", readings: verbal.length + nominal.length } };
}

/** Separa el texto en palabras y espacios/puntuación, y clasifica cada palabra. */
export function analyzeText(text: string, src: TextSources): TextAnalysis {
  const pieces: TextPiece[] = [];
  const counts: Record<WordStatus, number> = { respaldada: 0, armada: 0, sin_respaldo: 0, fuera_alfabeto: 0 };
  const cache = new Map<string, TextWord>();
  const input = text.normalize("NFC");
  let last = 0;
  let words = 0;
  for (const m of input.matchAll(WORD_RE)) {
    const raw = m[0];
    const start = m.index ?? 0;
    const lead = raw.length - raw.replace(/^['’‘´`ʼʻ]+/, "").length;
    const surface = raw.replace(QUOTES, "");
    // Números romanos de títulos y capítulos («PEHẼNGUE II»): no son palabras.
    if (!surface || words >= MAX_TEXT_WORDS || ROMAN.test(surface)) continue;
    const from = start + lead;
    if (from > last) pieces.push({ kind: "gap", text: input.slice(last, from) });
    const key = normalizeWord(surface);
    let w = cache.get(key);
    if (!w) {
      w = classifyWord(surface, src);
      cache.set(key, w);
    }
    pieces.push({ kind: "word", ...w, surface });
    counts[w.status]++;
    words++;
    last = from + surface.length;
  }
  if (last < input.length) pieces.push({ kind: "gap", text: input.slice(last) });
  const guarani = counts.respaldada + counts.armada + counts.sin_respaldo;
  const recognized = guarani > 0 ? Math.round((1000 * (counts.respaldada + counts.armada)) / guarani) / 10 : null;
  return { pieces, counts, guarani, recognized };
}
