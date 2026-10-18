/**
 * Analizador morfológico mínimo: separa negación, prefijo personal, voz y sufijos
 * usando SOLO las reglas transcriptas del libro (academia-rules.ts, voices-rules.ts,
 * suffixes-rules.ts e imperative-rules.ts).
 * No inventa raíces ni formas: devuelve todas las lecturas candidatas,
 * siempre "pending_validation". La lectura correcta la decide un especialista.
 */
import { HAREAL_ROOTS, NEGATION, PERSON_PREFIXES, type Paradigm, type Person } from "./academia-rules";
import { IMPERATIVE_PREFIXES } from "./imperative-rules";
import { IRREGULAR_LEXEMES, PREDICATIVE_PREFIXES, PRONOMINAL_PREFIXES } from "./predicative-rules";
import {
  ASPECT_SUFFIXES,
  GRADE_SUFFIXES,
  IMPERATIVE_MOOD_SUFFIXES,
  MOOD_SUFFIXES,
  SUFFIX_ORDER,
  TENSE_SUFFIXES,
  type SuffixRule,
  type SuffixType,
} from "./suffixes-rules";
import { VOICE_ORDER, VOICE_RULES, type VoiceRule } from "./voices-rules";

/**
 * Conjugaciones del libro: regulares (págs. 103–105), imperativo / optativo (pág. 165),
 * predicativos (págs. 93 y 101), pronominales (pág. 103) y lexemas variables (pág. 97).
 */
export type AnalysisParadigm = Paradigm | "imperativo" | "predicativo" | "pronominal" | "irregular";

export interface AnalysisLexeme {
  /** Lexema variable del libro («ho», «ju», «'e»). */
  form: string;
  meaning: string;
  page: number;
}

export interface AnalysisVoice {
  /** La forma tal como aparece en la palabra analizada. */
  form: string;
  meaning: string;
  page: number;
}

/** Personas plurales (más la 3.ª, que el libro usa para singular y plural). */
const PLURAL_OK: readonly Person[] = ["1pl_incl", "1pl_excl", "2pl", "3"];

export interface AnalysisSuffix {
  /** La forma tal como aparece en la palabra analizada. */
  form: string;
  type: SuffixType;
  meaning: string;
  page: number;
}

export interface Analysis {
  word: string;
  negated: boolean;
  paradigm: AnalysisParadigm;
  person: Person;
  prefix: string;
  /** Partículas de voz entre el prefijo y la raíz (págs. 117–123), en orden de aparición. */
  voices: AnalysisVoice[];
  root: string;
  /** En el orden en que aparecen en la palabra (de la raíz hacia afuera). */
  suffixes: AnalysisSuffix[];
  /** Solo en formas de los lexemas variables (pág. 97). */
  lexeme?: AnalysisLexeme;
  status: "pending_validation";
  pages: number[];
}

/** Minúsculas, NFC, puso unificado y sin guiones (el libro separa a veces con guion: agueru-va'ekue). */
export const normalizeWord = (w: string) =>
  w.normalize("NFC").toLowerCase().trim().replace(/[’‘´`]/g, "'").replace(/-/g, "");

const base = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");
/** Quita solo el acento agudo (no la tilde nasal): el libro desplaza el acento antes de partículas átonas (akarúkuri). */
const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

type NegationCut = { core: string; negated: boolean; euphonic?: { vowel: string; person: Person } };

function stripNegation(w: string): NegationCut[] {
  const out: NegationCut[] = [{ core: w, negated: false }];
  for (const pre of [NEGATION.prefix.oral, NEGATION.prefix.nasal]) {
    if (!w.startsWith(pre)) continue;
    const rest = w.slice(pre.length);
    // "ri" solo si queda una "i" final antes (pág. 25); si no, "i".
    let core: string | null = null;
    if (rest.endsWith(NEGATION.suffix.afterFinalI) && base(rest.slice(0, -2)).endsWith("i")) core = rest.slice(0, -2);
    else if (rest.endsWith(NEGATION.suffix.default) && rest.length > 2) core = rest.slice(0, -1);
    if (core === null) continue;
    out.push({ core, negated: true });
    // Vocal eufónica entre la negación y el prefijo (pág. 115): nde-re…, nda-ja…, ndo-ro…, nda-pe…
    for (const [person, vowel] of Object.entries(NEGATION.euphonic) as [Person, string][]) {
      if (core.startsWith(vowel) && core.length > 2) out.push({ core: core.slice(vowel.length), negated: true, euphonic: { vowel, person } });
    }
  }
  return out;
}

/** Si `stem` termina en alguna forma de la regla (ignorando el acento agudo), devuelve el corte. */
function matchSuffix(stem: string, rule: SuffixRule): { rest: string; suffix: AnalysisSuffix } | null {
  const plain = stripAcute(stem);
  // Solo cortamos si quitar el acento no cambió la longitud (índices equivalentes en NFC).
  if (plain.length !== stem.length) return null;
  const forms = [...rule.forms].sort((a, b) => b.length - a.length);
  for (const form of forms) {
    const f = stripAcute(form);
    if (plain.endsWith(f) && plain.length > f.length) {
      return {
        rest: stem.slice(0, stem.length - f.length),
        suffix: { form: stem.slice(stem.length - f.length), type: rule.type, meaning: rule.meaning, page: rule.page },
      };
    }
  }
  return null;
}

/**
 * Lecturas posibles de sufijos para un tema verbal (lo que queda después del prefijo y la voz).
 * Siempre incluye la lectura sin sufijos. Orden de trabajo: raíz + modo(s) o grado + tiempo.
 */
type SuffixReading = { root: string; suffixes: AnalysisSuffix[]; rules: SuffixRule[] };

function suffixReadings(stem: string, inner: SuffixRule[], withTense: boolean, maxInner: number): SuffixReading[] {
  const readings: SuffixReading[] = [{ root: stem, suffixes: [], rules: [] }];

  // Paso 0: como mucho un sufijo de aspecto en el borde derecho (págs. 135–137).
  const afterAspect: { rest: string; outer: AnalysisSuffix[]; rules: SuffixRule[] }[] = [{ rest: stem, outer: [], rules: [] }];
  if (withTense && SUFFIX_ORDER.maxAspects > 0) {
    for (const rule of ASPECT_SUFFIXES) {
      const m = matchSuffix(stem, rule);
      if (m) afterAspect.push({ rest: m.rest, outer: [m.suffix], rules: [rule] });
    }
  }

  // Paso 1: como mucho un sufijo de tiempo, antes del aspecto.
  const afterTense: { rest: string; tense: AnalysisSuffix[]; rules: SuffixRule[] }[] = [];
  for (const a of afterAspect) {
    afterTense.push({ rest: a.rest, tense: a.outer, rules: a.rules });
    if (withTense && SUFFIX_ORDER.maxTenses > 0) {
      for (const rule of TENSE_SUFFIXES) {
        const m = matchSuffix(a.rest, rule);
        if (m) afterTense.push({ rest: m.rest, tense: [m.suffix, ...a.outer], rules: [rule, ...a.rules] });
      }
    }
  }

  // Paso 2: hasta maxInner sufijos de modo o grado antes del tiempo.
  for (const { rest, tense, rules } of afterTense) {
    let frontier: { rest: string; moods: AnalysisSuffix[]; rules: SuffixRule[] }[] = [{ rest, moods: [], rules: [] }];
    for (let depth = 0; depth < maxInner; depth++) {
      const next: typeof frontier = [];
      for (const item of frontier) {
        for (const rule of inner) {
          if (item.rules.some((r) => r.id === rule.id)) continue;
          const m = matchSuffix(item.rest, rule);
          if (m) next.push({ rest: m.rest, moods: [m.suffix, ...item.moods], rules: [rule, ...item.rules] });
        }
      }
      for (const n of next) readings.push({ root: n.rest, suffixes: [...n.moods, ...tense], rules: [...n.rules, ...rules] });
      frontier = next;
    }
    if (tense.length) readings.push({ root: rest, suffixes: tense, rules });
  }

  // Sin duplicados.
  const seen = new Set<string>();
  return readings.filter((r) => {
    const key = `${r.root}|${r.suffixes.map((s) => `${s.form}:${s.meaning}`).join("+")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Lecturas de voz: ninguna, o hasta VOICE_ORDER.maxVoices partículas distintas al comienzo del tema. */
function voiceReadings(stem: string): { rest: string; voices: AnalysisVoice[]; rules: VoiceRule[] }[] {
  const out: { rest: string; voices: AnalysisVoice[]; rules: VoiceRule[] }[] = [{ rest: stem, voices: [], rules: [] }];
  let frontier = out.slice();
  for (let depth = 0; depth < VOICE_ORDER.maxVoices; depth++) {
    const next: typeof frontier = [];
    for (const item of frontier) {
      for (const rule of VOICE_RULES) {
        if (item.rules.some((r) => r.id === rule.id)) continue;
        for (const form of rule.forms) {
          if (item.rest.startsWith(form) && item.rest.length > form.length) {
            next.push({
              rest: item.rest.slice(form.length),
              voices: [...item.voices, { form, meaning: rule.meaning, page: rule.page }],
              rules: [...item.rules, rule],
            });
          }
        }
      }
    }
    out.push(...next);
    frontier = next;
  }
  return out;
}

type PrefixSet = { paradigm: AnalysisParadigm; page: number; prefixes: Record<Person, string[]> };

const PREFIX_SETS: PrefixSet[] = [
  ...(Object.entries(PERSON_PREFIXES) as [Paradigm, (typeof PERSON_PREFIXES)[Paradigm]][]).map(([paradigm, rule]) => ({
    paradigm,
    page: rule.source.page,
    prefixes: rule.prefixes,
  })),
  { paradigm: "imperativo", page: IMPERATIVE_PREFIXES.source.page, prefixes: IMPERATIVE_PREFIXES.prefixes },
  { paradigm: "predicativo", page: PREDICATIVE_PREFIXES.source.page, prefixes: PREDICATIVE_PREFIXES.prefixes },
  {
    paradigm: "pronominal",
    page: PRONOMINAL_PREFIXES.source.page,
    prefixes: { "1sg": [], "2sg": [], "3": [], "1pl_incl": [], "1pl_excl": [], "2pl": [], ...PRONOMINAL_PREFIXES.prefixes },
  },
];

/** Índice de las formas de los lexemas variables (pág. 97), para buscarlas una sola vez por palabra. */
const IRREGULAR_BY_FORM = new Map(
  IRREGULAR_LEXEMES.flatMap((lex) => lex.forms.map((f) => [f.form, { lex, f }] as const)),
);
const IRREGULAR_FIRST_CHARS = new Set([...IRREGULAR_BY_FORM.keys()].map((k) => k[0]));

/** Predicativos y pronominales: el libro no los describe con voces ni con la negación nd- … -i. */
const isNominal = (p: AnalysisParadigm) => p === "predicativo" || p === "pronominal";

const INDICATIVE_INNER = [...MOOD_SUFFIXES, ...GRADE_SUFFIXES];

export function analyze(input: string): Analysis[] {
  const w = normalizeWord(input);
  if (!w || /\s/.test(w)) return [];
  const results: Analysis[] = [];
  for (const { core, negated, euphonic } of stripNegation(w)) {
    for (const set of PREFIX_SETS) {
      const imperative = set.paradigm === "imperativo";
      const nominal = isNominal(set.paradigm);
      // La negación nd-/n- … -i/-ri (págs. 25 y 115) se describe con los prefijos del indicativo.
      if ((imperative || nominal) && negated) continue;
      for (const [person, prefixes] of Object.entries(set.prefixes) as [Person, string[]][]) {
        // Con vocal eufónica, solo la persona que la tabla de la pág. 115 asigna a esa vocal.
        if (euphonic && euphonic.person !== person) continue;
        for (const prefix of prefixes) {
          if (!core.startsWith(prefix) || core.length <= prefix.length) continue;
          const stem = core.slice(prefix.length);
          for (const v of nominal ? [{ rest: stem, voices: [] as AnalysisVoice[], rules: [] as VoiceRule[] }] : voiceReadings(stem)) {
            if (v.rules.some((r) => r.pluralOnly) && !PLURAL_OK.includes(person)) continue;
            const readings = imperative
              ? suffixReadings(v.rest, IMPERATIVE_MOOD_SUFFIXES, false, 1)
              : suffixReadings(v.rest, INDICATIVE_INNER, true, SUFFIX_ORDER.maxMoods);
            for (const { root, suffixes, rules } of readings) {
              if (!root) continue;
              // El libro identifica solo 5 verbos hareales (pág. 105): fuera de esas raíces no hay lectura hareal.
              if (set.paradigm === "hareal" && !(HAREAL_ROOTS.roots as readonly string[]).includes(root)) continue;
              if (rules.some((r) => r.pluralOnly) && !PLURAL_OK.includes(person)) continue;
              // El aspecto concuerda con la persona (tabla de la pág. 137).
              if (rules.some((r) => r.person && r.person !== person)) continue;
              const pages = [set.page];
              if (negated) pages.push(NEGATION.source.page);
              for (const x of v.voices) pages.push(x.page);
              for (const x of suffixes) pages.push(x.page);
              results.push({
                word: input,
                negated,
                paradigm: set.paradigm,
                person,
                prefix,
                voices: v.voices,
                root,
                suffixes,
                status: "pending_validation",
                pages: [...new Set(pages)],
              });
            }
          }
        }
      }
    }
    // Lexemas variables (pág. 97): la forma entera es la persona + el lexema; después pueden venir sufijos.
    const firstChar = core[0];
    if (!euphonic && firstChar && IRREGULAR_FIRST_CHARS.has(firstChar)) {
      for (const { root, suffixes, rules } of suffixReadings(core, INDICATIVE_INNER, true, SUFFIX_ORDER.maxMoods)) {
        const hit = IRREGULAR_BY_FORM.get(stripAcute(root));
        if (!hit) continue;
        if (rules.some((r) => r.person && r.person !== hit.f.person)) continue;
        const pages = [hit.lex.page];
        if (negated) pages.push(NEGATION.source.page);
        for (const x of suffixes) pages.push(x.page);
        results.push({
          word: input,
          negated,
          paradigm: "irregular",
          person: hit.f.person,
          prefix: "",
          voices: [],
          root,
          suffixes,
          lexeme: { form: hit.lex.lexeme, meaning: hit.lex.meaning, page: hit.lex.page },
          status: "pending_validation",
          pages: [...new Set(pages)],
        });
      }
    }
  }
  return results;
}
