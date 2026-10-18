/**
 * Diccionario monolingüe de la Academia de la Lengua Guaraní («Guarani Paraguái Ñe’ẽryru»),
 * publicado para consulta por la Secretaría de Políticas Lingüísticas (SPL).
 *
 * Solo se guardan la entrada, su abreviatura gramatical y el enlace a la entrada en el sitio de
 * la SPL: las definiciones se leen allí, no se copian. Uso interno del Laboratorio (admin).
 * Este módulo solo busca: no agrega, no traduce y no corrige ninguna palabra.
 */
import { normalizeWord } from "./analyzer";

/** [entrada tal como la imprime el diccionario, abreviatura, "archivo#entrada", subentrada 0/1, formas?] */
export type SplRaw = [string, string, string, number, string[]?];

export interface SplEntry {
  headword: string;
  pos: string;
  ref: string;
  sub: boolean;
  forms: string[];
}

export const SPL_BASE_URL = "https://spl.gov.py/recurso/Diccionario%20Guarani%20Paraguayo/lexicon/";

/** Enlace a la entrada exacta en el sitio de la SPL. */
export const splUrl = (ref: string) => {
  const [file, anchor] = ref.split("#");
  return `${SPL_BASE_URL}${file}.htm${anchor ? `#${anchor}` : ""}`;
};

/**
 * Abreviaturas gramaticales del diccionario que se explican en castellano. Las demás se
 * muestran tal cual, sin interpretarlas.
 */
export const SPL_POS_LABEL: Record<string, string> = {
  t: "téra (sustantivo)",
  ñ: "ñe’ẽtéva (verbo)",
  tj: "teroja (adjetivo)",
  ñj: "ñe’ẽteja (adverbio)",
  tr: "terarãngue (pronombre)",
  ñr: "ñe’ẽriregua (posposición)",
};

/** Primera abreviatura reconocible de la entrada («t./ñ» → «t»), para explicarla. */
export function posLabel(pos: string): string | null {
  const first = pos.replace(/\(.*?\)/g, "").split(/[./\s]+/).filter(Boolean)[0];
  return first ? (SPL_POS_LABEL[first] ?? null) : null;
}

export interface SplHit {
  entry: SplEntry;
  /** La forma del diccionario que coincidió (en entradas como «óga, róga ha hóga»). */
  form: string;
  /** true si coincide solo al quitar las tildes. */
  accentDiffers: boolean;
}

export interface SplIndex {
  size: number;
  lookup(word: string): SplHit[];
  has(word: string): boolean;
}

const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

export function toSplEntry([headword, pos, ref, sub, forms]: SplRaw): SplEntry {
  return { headword, pos, ref, sub: sub === 1, forms: forms && forms.length ? forms : [headword] };
}

export function buildSplIndex(raw: SplRaw[]): SplIndex {
  const exact = new Map<string, { entry: SplEntry; form: string }[]>();
  const loose = new Map<string, { entry: SplEntry; form: string }[]>();
  const push = (m: typeof exact, k: string, v: { entry: SplEntry; form: string }) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  for (const r of raw) {
    const entry = toSplEntry(r);
    for (const form of entry.forms) {
      const k = normalizeWord(form);
      if (!k) continue;
      push(exact, k, { entry, form });
      push(loose, stripAcute(k), { entry, form });
    }
  }
  const lookup = (word: string): SplHit[] => {
    const k = normalizeWord(word);
    if (!k) return [];
    const hit = exact.get(k);
    if (hit) return hit.map((h) => ({ ...h, accentDiffers: false }));
    return (loose.get(stripAcute(k)) ?? []).map((h) => ({ ...h, accentDiffers: true }));
  };
  return { size: raw.length, lookup, has: (w) => lookup(w).length > 0 };
}
