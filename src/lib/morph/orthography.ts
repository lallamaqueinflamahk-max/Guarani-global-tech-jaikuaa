/**
 * Corrector ortográfico según las reglas de la Gramática ALG 2020 (págs. 19–37 y 207–209).
 *
 * Solo VERIFICA: nunca corrige, completa ni propone formas nuevas. Cada aviso cita su regla y
 * su página. Todo es "pending_validation" hasta la ficha de regla de los especialistas.
 */
import { normalizeWord } from "./analyzer";
import {
  DIGRAPHS,
  EUPHONY_RULES,
  NASAL_CONSONANTS,
  NASAL_VOWELS,
  NASO_ORAL_CONSONANTS,
  ORAL_VOWELS,
  ORTHOGRAPHY_RULES,
  POSTPOSITIONS,
  type OrthographyRuleId,
} from "./orthography-rules";

const ACUTE = "́";
const TILDE = "̃";

/** Una letra del alfabeto, con su tilde acentual aparte (la tilde se mueve; la letra no). */
export interface Grapheme {
  /** La letra sin tilde acentual: "a", "ã", "ch", "g̃", "'"… */
  letter: string;
  acute: boolean;
  /** Tal como venía escrita. */
  raw: string;
}

export type IssueSeverity = "error" | "revisar" | "prestamo";

export interface OrthographyIssue {
  rule: OrthographyRuleId;
  page: number;
  severity: IssueSeverity;
  message: string;
  /** La palabra (o el par de palabras) donde se encontró. */
  word: string;
}

const VOWELS = new Set<string>([...ORAL_VOWELS, ...NASAL_VOWELS]);
const NASAL_V = new Set<string>(NASAL_VOWELS);
const NASAL_C = new Set<string>(NASAL_CONSONANTS);
const NASO_ORAL_C = new Set<string>(NASO_ORAL_CONSONANTS);
/** Pág. 33: letras propias del alfabeto (sin contar la tilde acentual). */
const OFFICIAL = new Set<string>([
  "a", "ã", "ch", "e", "ẽ", "g", "g̃", "h", "i", "ĩ", "j", "k", "l", "m", "mb", "n", "nd", "ng", "nt", "ñ",
  "o", "õ", "p", "r", "rr", "s", "t", "u", "ũ", "v", "y", "ỹ", "'",
]);
/** Pág. 33: "D d, F f, y LL ll, para escribir palabras provenientes de otras lenguas". */
const LOAN = new Set(["d", "f", "ll"]);

export const isVowel = (letter: string) => VOWELS.has(letter);

/** Normaliza como el analizador: NFC, minúsculas, variantes del puso, homoglifos y sin guiones. */
export const normalizeForCheck = normalizeWord;

/**
 * Separa una palabra en letras del alfabeto. Respeta los dígrafos (pág. 33) y la g̃, y separa la
 * tilde acentual para que las reglas 2 y 3 puedan mirarla aparte.
 */
export function graphemes(word: string): Grapheme[] {
  const w = normalizeForCheck(word).normalize("NFD");
  // Agrupa cada letra base con sus marcas combinantes.
  const chars: { base: string; marks: string; raw: string }[] = [];
  for (const ch of w) {
    const last = chars[chars.length - 1];
    if (/\p{M}/u.test(ch) && last) {
      last.marks += ch;
      last.raw += ch;
    } else {
      chars.push({ base: ch, marks: "", raw: ch });
    }
  }
  const out: Grapheme[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]!;
    const next = chars[i + 1];
    const pair = next && c.marks === "" && next.marks === "" ? c.base + next.base : "";
    if (next && pair && (DIGRAPHS as readonly string[]).includes(pair)) {
      out.push({ letter: pair, acute: false, raw: c.raw + next.raw });
      i++;
      continue;
    }
    const acute = c.marks.includes(ACUTE);
    const letter = (c.base + c.marks.replace(ACUTE, "")).normalize("NFC");
    out.push({ letter, acute, raw: c.raw.normalize("NFC") });
  }
  return out;
}

export interface Syllable {
  /** Consonante inicial (puede faltar). "g̃u"/"gu" se toman juntos ante vocal, como «g̃ua» de la pág. 35. */
  onset: string;
  vowel: Grapheme;
  text: string;
}

/**
 * Sílabas directas (pág. 19): consonante + vocal, o vocal sola. Cada vocal es un núcleo, salvo la
 * «u» de «gu»/«g̃u» ante vocal, que la pág. 35 trata como una sola sílaba («g̃ua»).
 * Las secuencias de vocales quedan en sílabas separadas: es una aproximación que no decide
 * diptongos (pregunta para los especialistas) y no afecta a las reglas 2 y 3.
 * Devuelve también las consonantes que quedaron sin vocal (sílaba trabada o consonantes seguidas).
 */
export function syllabify(word: string): { syllables: Syllable[]; stray: { letter: string; index: number }[] } {
  const g = graphemes(word);
  const syllables: Syllable[] = [];
  const stray: { letter: string; index: number }[] = [];
  let onset: Grapheme[] = [];
  g.forEach((x, i) => {
    if (isVowel(x.letter)) {
      // «gu» / «g̃u» + vocal = un solo ataque (pág. 35: «g̃ua»).
      const prev = onset[onset.length - 1];
      const after = g[i + 1];
      if (x.letter === "u" && !x.acute && prev && (prev.letter === "g" || prev.letter === "g̃") && after && isVowel(after.letter)) {
        onset.push(x);
        return;
      }
      // `onset` es vacío, [consonante] o [g/g̃, u].
      syllables.push({ onset: onset.map((o) => o.letter).join(""), vowel: x, text: onset.map((o) => o.raw).join("") + x.raw });
      onset = [];
    } else {
      // Dos consonantes seguidas: la primera queda sin vocal.
      if (onset[0]) stray.push({ letter: onset[0].letter, index: i });
      onset = [x];
    }
  });
  for (const o of onset) stray.push({ letter: o.letter, index: g.length });
  return { syllables, stray };
}

/** Pág. 35 (regla 3): ¿la sílaba junta dos letras nasales? "error" con g̃/m/n/ñ; "revisar" con mb/nd/ng/nt. */
export function nasalSyllableIssue(onset: string, vowel: string): IssueSeverity | null {
  if (!NASAL_V.has(vowel)) return null;
  const c = onset.replace(/u$/, "") || onset; // «g̃u» → «g̃»
  if (NASAL_C.has(c)) return "error";
  if (NASO_ORAL_C.has(c)) return "revisar";
  return null;
}

const issue = (rule: OrthographyRuleId, severity: IssueSeverity, message: string, word: string): OrthographyIssue => ({
  rule,
  page: ORTHOGRAPHY_RULES[rule].source.page,
  severity,
  message,
  word,
});

/** Revisa una palabra suelta con las reglas 1, 2 y 3 y la sílaba directa. No mira el contexto. */
export function checkWord(word: string): OrthographyIssue[] {
  const w = normalizeForCheck(word);
  if (!w || /\d/.test(w)) return [];
  const g = graphemes(w);
  const out: OrthographyIssue[] = [];

  // Regla 1 (pág. 33): alfabeto oficial.
  const outside = g.filter((x) => !OFFICIAL.has(x.letter) && !LOAN.has(x.letter));
  if (outside.length > 0) {
    out.push(issue("alfabeto", "error", `Letras que no están en el alfabeto oficial: ${[...new Set(outside.map((x) => x.letter))].join(", ")}.`, w));
    return out; // Sin alfabeto válido, las demás reglas no aplican.
  }
  if (g.some((x) => LOAN.has(x.letter))) {
    out.push(issue("alfabeto", "prestamo", "Usa D, F o LL: letras admitidas solo para palabras de otras lenguas, una vez reglamentadas.", w));
  }

  // Regla 1 (pág. 33): la nasal se escribe con tilde (˜). La escritura con circunflejo se lee igual,
  // pero se avisa para que se escriba con la letra oficial.
  if (/[âêîôûŷÿ]/i.test(word.normalize("NFC"))) {
    out.push(issue("alfabeto", "revisar", "Escrita con circunflejo (^): el alfabeto oficial marca la vocal nasal con tilde (˜).", w));
  }

  const vowels = g.map((x, i) => ({ x, i })).filter(({ x }) => isVowel(x.letter));
  if (vowels.length === 0) return out;

  // Regla 2 (págs. 33–35): tilde acentual.
  const acutes = g.filter((x) => x.acute);
  if (acutes.length > 1) out.push(issue("tilde", "error", "La palabra puede llevar solamente una tilde acentual.", w));
  const lastVowel = vowels[vowels.length - 1];
  if (lastVowel && lastVowel.x.acute && lastVowel.i === g.length - 1) {
    out.push(issue("tilde", "error", "No se usa la tilde acentual cuando la vocal tónica está al final de la palabra.", w));
  }
  if (g.some((x) => x.acute && NASAL_V.has(x.letter))) {
    out.push(issue("tilde", "error", "Sobre las vocales nasales no se usa la tilde acentual.", w));
  }

  // Regla 3 (pág. 35): sílabas nasales.
  const { syllables, stray } = syllabify(w);
  for (const s of syllables) {
    const sev = nasalSyllableIssue(s.onset, s.vowel.letter);
    if (sev === "error") out.push(issue("silaba-nasal", "error", `No concurren en la sílaba dos letras nasales («${s.text}»).`, w));
    if (sev === "revisar") {
      out.push(issue("silaba-nasal", "revisar", `Consonante naso-oral con vocal nasal («${s.text}»): el libro no muestra este caso; consultar.`, w));
    }
  }

  // Sílaba directa (págs. 19 y 21–23).
  const lastLetter = g[g.length - 1];
  if (lastLetter && !isVowel(lastLetter.letter)) {
    out.push(issue("silaba-directa", "revisar", "En el guaraní actual no existen palabras con terminación consonántica.", w));
  } else if (stray[0]) {
    out.push(issue("silaba-directa", "revisar", `Dos consonantes seguidas fuera de los dígrafos («${stray[0].letter}»).`, w));
  }
  return out;
}

const MONO = new Set(POSTPOSITIONS.monosyllabic.flatMap((p) => p.forms));
const POLY = POSTPOSITIONS.polysyllabic.flatMap((p) => p.forms);
/** «pe» suelto también es demostrativo («Pe mitã», pág. 82) y «re» es prefijo: no se marcan sueltos. */
const MONO_AMBIGUOUS = new Set(["pe", "me", "re"]);

/** Separa un texto en palabras (conserva el puso y la g̃). */
export function tokenize(text: string): string[] {
  return (text.normalize("NFC").match(/[\p{L}\p{M}'’‘´`\u02BC\u02BB\u00AD-]+/gu) ?? []).map(normalizeForCheck).filter((t) => t.replace(/'/g, "").length > 0);
}

export interface CheckTextOptions {
  /** Si se conoce el vocabulario atestiguado, se usa para detectar posposiciones polisilábicas pegadas. */
  isKnownWord?: (word: string) => boolean;
}

/**
 * Revisa un texto: cada palabra con `checkWord` y, además, la regla 4 (pág. 37) sobre posposiciones:
 * - monosilábica escrita suelta después de otra palabra («gui», «gua», «ndi») → revisar;
 * - polisilábica pegada a una palabra conocida («…guive») → revisar (solo si se pasa `isKnownWord`).
 */
export function checkText(text: string, opts: CheckTextOptions = {}): OrthographyIssue[] {
  const tokens = tokenize(text);
  const out: OrthographyIssue[] = [];
  tokens.forEach((t, i) => {
    out.push(...checkWord(t));
    if (i > 0 && MONO.has(t) && !MONO_AMBIGUOUS.has(t)) {
      out.push(issue("formacion-palabras", "revisar", `La posposición monosilábica «${t}» va unida a su regente.`, `${tokens[i - 1]} ${t}`));
    }
    if (opts.isKnownWord) {
      const bare = t.normalize("NFD").replace(new RegExp(ACUTE, "g"), "").normalize("NFC");
      for (const p of POLY) {
        if (bare.length > p.length && bare.endsWith(p)) {
          const head = t.slice(0, t.length - p.length);
          if (opts.isKnownWord(head)) {
            out.push(issue("formacion-palabras", "revisar", `La posposición polisilábica «${p}» se escribe separada de su regente.`, t));
          }
        }
      }
    }
  });
  return out;
}

export type HarmonyVerdict = "oral" | "nasal" | "duda";

/**
 * ¿La raíz es oral o nasal, a efectos de la armonización nasal (pág. 27)?
 * - "nasal": tiene vocal nasal o consonante nasal (g̃, m, n, ñ).
 * - "oral": no tiene ningún fonema nasal ni naso-oral (pág. 49: "carece de fonemas nasales").
 * - "duda": solo tiene naso-orales (mb, nd, ng, nt); el libro no lo decide → especialistas.
 */
export function rootNasality(root: string): HarmonyVerdict {
  const g = graphemes(root);
  if (g.some((x) => NASAL_V.has(x.letter) || NASAL_C.has(x.letter))) return "nasal";
  if (g.some((x) => NASO_ORAL_C.has(x.letter))) return "duda";
  return "oral";
}

/** Para un par de armonización nasal (jo/ño, pe/me, pa/mba, nd/n), la forma que corresponde a la raíz. */
export function expectedAllomorph(ruleId: "jo-ño" | "nd-n" | "pe-me" | "pa-mba", root: string): { form: string | null; verdict: HarmonyVerdict; page: number } {
  const rule = EUPHONY_RULES.find((r) => r.id === ruleId);
  if (!rule) throw new Error(`Regla desconocida: ${ruleId}`);
  const verdict = rootNasality(root);
  const form = verdict === "oral" ? rule.from : verdict === "nasal" ? rule.to : null;
  return { form, verdict, page: rule.source.page };
}
