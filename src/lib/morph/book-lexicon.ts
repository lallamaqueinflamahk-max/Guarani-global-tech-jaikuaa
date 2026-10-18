/**
 * Índice de las formas que imprime la Gramática ALG 2020 (data/gramatica-alg-2020-formas.json).
 *
 * Sirve para tres cosas, siempre citando la página:
 * 1) saber si una palabra o una raíz aparece tal cual en el libro (atestiguada por la fuente oficial);
 * 2) proponer lecturas de palabra compuesta (pág. 53) cuando las dos partes están en el libro;
 * 3) mostrar formas del libro parecidas a una palabra escrita. NO es una corrección: solo lista
 *    palabras que el libro imprime; la decisión es de un especialista.
 *
 * Nada de esto escribe guaraní nuevo. El archivo de datos es de uso interno (solo admin).
 */
import { normalizeWord } from "./analyzer";
import { graphemes, isVowel } from "./orthography";

export type BookForms = Record<string, number[]>;

export interface BookHit {
  form: string;
  pages: number[];
  /** true si coincide solo sin mirar la tilde acentual. */
  accentDiffers: boolean;
}

export interface CompoundReading {
  parts: [BookHit, BookHit];
  /** Pág. 53: "Los núcleos al unirse una con otra sin pérdida de elementos, forman una sola palabra". */
  page: 53;
  status: "pending_validation";
}

export interface BookIndex {
  size: number;
  /** ¿La forma aparece tal cual en el libro? (primero exacta; si no, sin mirar la tilde acentual). */
  lookup(word: string): BookHit | null;
  /** Lecturas como compuesto de dos formas del libro (cada parte con 2 letras o más). */
  compounds(word: string): CompoundReading[];
  /** Hasta `limit` formas del libro a distancia de edición ≤ `max` (por letras del alfabeto). */
  similar(word: string, max?: number, limit?: number): (BookHit & { distance: number })[];
}

const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

/** Distancia de edición (con trasposición) entre dos secuencias de letras del alfabeto. */
export function letterDistance(a: string[], b: string[], cap = Infinity): number {
  const n = a.length;
  const m = b.length;
  if (Math.abs(n - m) > cap) return cap + 1;
  let prev2: number[] = [];
  let prev: number[] = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, (prev2[j - 2] ?? 0) + 1);
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > cap) return cap + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[m] ?? cap + 1;
}

/** Letras para comparar: la tilde acentual cuenta como parte de la letra (á ≠ a). */
const letters = (w: string) => graphemes(w).map((g) => (g.acute ? `${g.letter}́` : g.letter));

export function buildBookIndex(forms: BookForms): BookIndex {
  const exact = new Map<string, BookHit>();
  const bare = new Map<string, BookHit>();
  const all: { form: string; pages: number[]; letters: string[] }[] = [];
  for (const [raw, pages] of Object.entries(forms)) {
    const form = normalizeWord(raw);
    if (!form) continue;
    exact.set(form, { form, pages, accentDiffers: false });
    const b = stripAcute(form);
    if (!bare.has(b)) bare.set(b, { form, pages, accentDiffers: true });
    all.push({ form, pages, letters: letters(form) });
  }

  const lookup = (word: string): BookHit | null => {
    const w = normalizeWord(word);
    return exact.get(w) ?? bare.get(stripAcute(w)) ?? null;
  };

  return {
    size: exact.size,
    lookup,
    compounds(word) {
      const w = normalizeWord(word);
      const g = graphemes(w);
      const out: CompoundReading[] = [];
      // Cortes entre letras: la primera parte termina en vocal (sílaba directa, pág. 19).
      for (let k = 2; k <= g.length - 2; k++) {
        const left = g.slice(0, k);
        if (!isVowel(left[left.length - 1]?.letter ?? "")) continue;
        const a = left.map((x) => x.raw).join("");
        const b = g.slice(k).map((x) => x.raw).join("");
        const ha = lookup(a);
        const hb = lookup(b);
        if (ha && hb && ha.form !== w && hb.form !== w) out.push({ parts: [ha, hb], page: 53, status: "pending_validation" });
      }
      return out;
    },
    similar(word, max = 2, limit = 5) {
      const w = normalizeWord(word);
      const target = letters(w);
      const hits: (BookHit & { distance: number })[] = [];
      for (const f of all) {
        if (f.form === w) continue;
        const d = letterDistance(target, f.letters, max);
        if (d <= max) hits.push({ form: f.form, pages: f.pages, accentDiffers: false, distance: d });
      }
      return hits
        .sort((x, y) => x.distance - y.distance || Math.abs(x.form.length - w.length) - Math.abs(y.form.length - w.length) || x.form.localeCompare(y.form, "es"))
        .slice(0, limit);
    },
  };
}
