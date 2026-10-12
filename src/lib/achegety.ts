/**
 * Alfabeto guaraní oficial (Achegety) usado por los juegos.
 * Cada elemento es UNA tecla / UNA casilla; los dígrafos cuentan como una sola letra.
 * Lista para revisión docente: si hay que corregirla, se edita solo este archivo.
 */
export const ACHEGETY: string[] = [
  "a", "ã", "ch", "e", "ẽ", "g", "g̃", "h", "i", "ĩ", "j", "k", "l", "m", "mb",
  "n", "nd", "ng", "nt", "ñ", "o", "õ", "p", "r", "rr", "s", "t", "u", "ũ", "v",
  "y", "ỹ", "'",
];

const SORTED = [...ACHEGETY].map((t) => t.normalize("NFC")).sort((a, b) => b.length - a.length);

/** Normaliza la escritura para comparar: minúsculas, NFC y apóstrofos tipográficos → puso ('). */
function normalize(word: string): string {
  return word.normalize("NFC").toLowerCase().replace(/[’‘´`]/g, "'");
}

/**
 * Divide una palabra en letras del Achegety (dígrafos como una unidad).
 * Devuelve null si la palabra tiene caracteres fuera del alfabeto (p. ej. tildes
 * agudas, espacios o guiones): esas palabras no se usan en Ahorcado ni Sopa de letras.
 */
export function splitAchegety(word: string): string[] | null {
  const s = normalize(word);
  const go = (i: number): string[] | null => {
    if (i === s.length) return [];
    for (const t of SORTED) {
      if (!s.startsWith(t, i)) continue;
      const rest = go(i + t.length);
      if (rest) return [t, ...rest];
    }
    return null;
  };
  return s ? go(0) : null;
}

/** Letra en mayúsculas para mostrar (el puso queda igual). */
export function displayLetter(t: string): string {
  return t === "'" ? "'" : t.toUpperCase();
}
