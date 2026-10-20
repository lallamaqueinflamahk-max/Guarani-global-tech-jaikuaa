/**
 * Cruce del análisis morfológico con el corpus léxico validado.
 *
 * REGLA DE ORO: el motor nunca valida una raíz que no figure en el corpus.
 * - Raíz encontrada  → "verified" (confianza 1.0): la raíz existe en el corpus validado.
 *   Las reglas morfológicas que la descompusieron siguen "pending_validation"
 *   hasta la ficha de regla del Comité; el mensaje lo dice.
 * - Raíz no encontrada → "pending_human_review" (confianza 0.5).
 *
 * Normalización permitida al buscar: minúsculas, NFC, puso unificado, sin guiones
 * y sin acento agudo (el libro desplaza la tilde acentual: akarúkuri → karú; pág. 33).
 * NO se desnasaliza: ã/a, ñ/n o g̃/g son letras distintas del alfabeto oficial (pág. 33)
 * y confundirlas daría por "validadas" raíces que no lo están.
 *
 * Sirve en el cliente (lista en memoria) y en el servidor (consulta a la base de datos).
 */
import { analyze, normalizeWord, type Analysis } from "./analyzer";

/** Candidato morfológico tal como lo devuelve analyze(). */
export type MorphAnalysisCandidate = Analysis;

/** Búsqueda de una raíz en el corpus: síncrona (lista en memoria) o asíncrona (base de datos). */
export type CorpusWordLookup = (root: string) => boolean | Promise<boolean>;

export type MatchStatus = "verified" | "pending_human_review";

export interface MatchResult {
  originalWord: string;
  analysis: MorphAnalysisCandidate;
  root: string;
  rootFoundInCorpus: boolean;
  status: MatchStatus;
  confidence: number;
  validationMessage: string;
  sourceReference: string;
}

export const BOOK_REFERENCE = "Gramática Guaraní, Academia de la Lengua Guaraní (2020)";

export const MESSAGE_VERIFIED =
  "Raíz validada en el corpus. Estructura morfológica según la Gramática de la Academia (2020); reglas pendientes de validación del Comité.";
export const MESSAGE_PENDING =
  "Estructura morfológica válida, pero la raíz requiere verificación de especialistas.";

export const CONFIDENCE: Record<MatchStatus, number> = { verified: 1, pending_human_review: 0.5 };

/** Quita solo el acento agudo; conserva la tilde nasal y la ñ. */
const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

/** Clave de comparación de una raíz. */
export function rootKey(root: string): string {
  return stripAcute(normalizeWord(root));
}

/**
 * Formas a consultar para una raíz, en orden: la forma escrita y la forma sin acento agudo.
 * Ejemplo: "japó" → ["japó", "japo"]. Nunca se agregan variantes sin tilde nasal.
 */
export function lookupVariants(root: string): string[] {
  const written = normalizeWord(root);
  return [...new Set([written, rootKey(written)])].filter(Boolean);
}

export function sourceReferenceFor(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (sorted.length === 0) return BOOK_REFERENCE;
  return `${BOOK_REFERENCE}, ${sorted.length > 1 ? "págs." : "pág."} ${sorted.join(", ")}`;
}

/** Arma un buscador en memoria a partir de una lista de lemas validados (normaliza igual que rootKey). */
export function createMemoryLookup(validatedRoots: Iterable<string>): CorpusWordLookup {
  const keys = new Set<string>();
  for (const r of validatedRoots) {
    const k = rootKey(r);
    if (k) keys.add(k);
  }
  return (root: string) => keys.has(rootKey(root));
}

async function rootInCorpus(root: string, lookup: CorpusWordLookup): Promise<boolean> {
  for (const variant of lookupVariants(root)) {
    if (await lookup(variant)) return true;
  }
  return false;
}

/** Cruza cada lectura de analyze(word) con el corpus. Sin lecturas, devuelve []. */
export async function matchWithCorpus(word: string, lookup: CorpusWordLookup): Promise<MatchResult[]> {
  const candidates = analyze(word);
  const results: MatchResult[] = [];
  for (const analysis of candidates) {
    const found = await rootInCorpus(analysis.root, lookup);
    const status: MatchStatus = found ? "verified" : "pending_human_review";
    results.push({
      originalWord: word,
      analysis,
      root: analysis.root,
      rootFoundInCorpus: found,
      status,
      confidence: CONFIDENCE[status],
      validationMessage: found ? MESSAGE_VERIFIED : MESSAGE_PENDING,
      sourceReference: sourceReferenceFor(analysis.pages),
    });
  }
  return results;
}

/* ----------------------------------------------------------------------------
 * Versión síncrona sobre análisis ya calculados (la usa el Laboratorio).
 * -------------------------------------------------------------------------- */

export interface VerifiedAnalysis extends Analysis {
  rootVerified: boolean;
  confidence: "high" | "pending_human_review";
  message: string;
}

export function verifyWithCorpus(analyses: Analysis[], knownRoots: Set<string> | string[]): VerifiedAnalysis[] {
  const has = createMemoryLookup(knownRoots) as (root: string) => boolean;
  return analyses.map((a) => {
    const rootVerified = lookupVariants(a.root).some((v) => has(v));
    return {
      ...a,
      status: "pending_validation",
      rootVerified,
      confidence: rootVerified ? "high" : "pending_human_review",
      message: rootVerified ? MESSAGE_VERIFIED : MESSAGE_PENDING,
    };
  });
}
