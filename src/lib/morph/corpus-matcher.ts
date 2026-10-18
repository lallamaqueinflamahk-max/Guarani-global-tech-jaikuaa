/**
 * Cruce del análisis morfológico con el corpus validado.
 *
 * Regla anti-alucinación: la confianza alta solo existe cuando la raíz figura,
 * tal cual, en la lista de raíces que recibió la función. No se deducen raíces,
 * no se buscan parecidas y no se corrige nada: lo que no está, va a revisión humana.
 *
 * `knownRoots` tiene que ser una lista explícita de RAÍCES aprobadas por especialistas
 * (no palabras conjugadas ni palabras solo publicadas). Hoy el corpus de la plataforma
 * guarda palabras, y ninguna figura todavía con validación docente: hasta que exista
 * esa lista, toda lectura queda en "pending_human_review".
 */
import { normalizeWord, type Analysis } from "./analyzer";

export interface VerifiedAnalysis extends Analysis {
  rootVerified: boolean;
  confidence: "high" | "pending_human_review";
  message: string;
}

export const MESSAGE_VERIFIED =
  "Estructura morfológica conforme a la Gramática de la Academia (2020) y raíz validada en el corpus.";
export const MESSAGE_PENDING =
  "Estructura morfológica válida, pero la raíz no figura en el corpus validado. Requiere revisión humana.";

/**
 * Forma de comparación: minúsculas, NFC, puso unificado, sin guiones y sin acento agudo.
 * El acento agudo se quita porque el libro lo desplaza antes de partículas átonas
 * (akarúkuri → karú) y la tilde acentual no se escribe en la vocal final (pág. 33).
 * La tilde nasal (ã, ẽ, ĩ, õ, ũ, ỹ, g̃) se conserva: cambia la palabra.
 */
export function rootKey(root: string): string {
  return normalizeWord(root).normalize("NFD").replace(/́/g, "").normalize("NFC");
}

function toKeySet(knownRoots: Set<string> | string[]): Set<string> {
  const keys = new Set<string>();
  for (const r of knownRoots) {
    const k = rootKey(r);
    if (k) keys.add(k);
  }
  return keys;
}

export function verifyWithCorpus(analyses: Analysis[], knownRoots: Set<string> | string[]): VerifiedAnalysis[] {
  const keys = toKeySet(knownRoots);
  return analyses.map((a) => {
    const rootVerified = keys.has(rootKey(a.root));
    return {
      ...a,
      // La regla gramatical sigue pendiente de validación aunque la raíz esté en el corpus.
      status: "pending_validation",
      rootVerified,
      confidence: rootVerified ? "high" : "pending_human_review",
      message: rootVerified ? MESSAGE_VERIFIED : MESSAGE_PENDING,
    };
  });
}
