/**
 * Calcos del castellano — capítulo 6 de la Gramática ALG 2020, «Guía práctica para recuperar la
 * sintaxis guaraní» (págs. 246–253): 110 pares «Como se dice» → «Como debe decirse».
 *
 * El detector compara una frase escrita con esos pares y avisa si coincide con un calco que el
 * libro señala, mostrando la forma que el libro recomienda y la página. No reescribe ni corrige
 * la frase: solo cita al libro. Los pares viven en data/gramatica-alg-2020-calcos.json (servidor).
 */
import { normalizeForCheck } from "./orthography";

export interface CalcoPair {
  n: number;
  /** «Péicha oje'e ko'ág̃a rupi – Como se dice» (página par). */
  calco: string;
  /** «Péicha ja'eva'erã – Como debe decirse» (página impar). Puede traer alternativas. */
  correcta: string[];
  /** [página del calco, página de la forma recomendada] */
  paginas: [number, number];
}

export interface CalcoMatch {
  pair: CalcoPair;
  /** "calco": la frase coincide con lo que el libro desaconseja; "recomendada": con lo que recomienda. */
  kind: "calco" | "recomendada";
  /** "exacta": misma frase; "contiene": la frase está dentro del texto; "parecida": difiere en una palabra. */
  how: "exacta" | "contiene" | "parecida";
}

/** Palabras normalizadas de una frase (sin signos de puntuación). */
export function sentenceTokens(text: string): string[] {
  return normalizeForCheck(text.replace(/[¿?¡!.,;:()"«»/]/g, " "))
    .split(/\s+/)
    .filter(Boolean);
}

function tokenDistance(a: string[], b: string[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length]![b.length]!;
}

function containsRun(hay: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > hay.length) return false;
  for (let i = 0; i + needle.length <= hay.length; i++) {
    if (needle.every((t, k) => hay[i + k] === t)) return true;
  }
  return false;
}

export interface CalcoIndex {
  size: number;
  check(text: string): CalcoMatch[];
}

export function buildCalcoIndex(pairs: CalcoPair[]): CalcoIndex {
  const entries = pairs.flatMap((pair) => [
    { pair, kind: "calco" as const, tokens: sentenceTokens(pair.calco) },
    ...pair.correcta.map((c) => ({ pair, kind: "recomendada" as const, tokens: sentenceTokens(c) })),
  ]);
  return {
    size: pairs.length,
    check(text) {
      const t = sentenceTokens(text);
      if (t.length === 0) return [];
      const out: CalcoMatch[] = [];
      const seen = new Set<string>();
      const push = (m: CalcoMatch) => {
        const key = `${m.pair.n}-${m.kind}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(m);
        }
      };
      for (const e of entries) {
        if (e.tokens.length === 0) continue;
        if (e.tokens.join(" ") === t.join(" ")) push({ pair: e.pair, kind: e.kind, how: "exacta" });
        else if (e.tokens.length >= 2 && containsRun(t, e.tokens)) push({ pair: e.pair, kind: e.kind, how: "contiene" });
        else if (e.tokens.length >= 3 && Math.abs(e.tokens.length - t.length) <= 1 && tokenDistance(e.tokens, t) === 1) {
          push({ pair: e.pair, kind: e.kind, how: "parecida" });
        }
      }
      const rank = { exacta: 0, contiene: 1, parecida: 2 } as const;
      return out.sort((a, b) => rank[a.how] - rank[b.how] || a.pair.n - b.pair.n);
    },
  };
}
