/**
 * Limpiador Guaraní: compara cada palabra escrita con el corpus PUBLICADO
 * (validado por docentes). Solo sugiere formas que ya existen en el corpus;
 * nunca inventa escritura.
 */
export function skeleton(w: string): string {
  return w
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘´`']/g, "")
    .toLowerCase();
}

export type Fix = { from: string; to: string };

export function buildIndex(words: string[]): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const gn of words) {
    if (/\s/.test(gn.trim())) continue;
    const k = skeleton(gn.trim());
    if (!k) continue;
    const prev = m.get(k);
    // Ambiguo (dos formas distintas) → no sugerir
    m.set(k, prev === undefined || prev === gn.trim() ? gn.trim() : null);
  }
  return m;
}

const TOKEN = /[\p{L}\p{M}'’‘´`]+/gu;

export function clean(text: string, index: Map<string, string | null>): { text: string; fixes: Fix[] } {
  const fixes: Fix[] = [];
  const out = text.replace(TOKEN, (tok) => {
    const target = index.get(skeleton(tok));
    if (!target || target.normalize("NFC") === tok.normalize("NFC").toLowerCase()) return tok;
    const fixed = tok[0] === tok[0].toUpperCase() && tok[0] !== tok[0].toLowerCase()
      ? target[0].toUpperCase() + target.slice(1)
      : target;
    if (fixed.normalize("NFC") === tok.normalize("NFC")) return tok;
    fixes.push({ from: tok, to: fixed });
    return fixed;
  });
  return { text: out, fixes };
}

/** Pista de armonía nasal: ¿la palabra contiene sonido nasal? (regla general, a revisar con docentes). */
export function isNasal(word: string): boolean {
  const w = word.normalize("NFC").toLowerCase();
  return /[ãẽĩõũỹ]|g̃|m|n|ñ/.test(w);
}

export const PARES: { oral: string; nasal: string; sentido: string }[] = [
  { oral: "pe", nasal: "me", sentido: "en" },
  { oral: "gua", nasal: "ngua", sentido: "de (procedencia)" },
];

export function lastWord(text: string): string {
  const m = text.match(/([\p{L}\p{M}']+)\s*$/u);
  return m ? m[1] : "";
}
