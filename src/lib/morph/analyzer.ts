/**
 * Analizador morfológico mínimo: separa negación, prefijo personal y sufijos
 * usando SOLO las reglas transcriptas en academia-rules.ts y suffixes-rules.ts.
 * No inventa raíces ni formas: devuelve todas las lecturas candidatas,
 * siempre "pending_validation". La lectura correcta la decide un especialista.
 */
import { HAREAL_ROOTS, NEGATION, PERSON_PREFIXES, type Paradigm, type Person } from "./academia-rules";
import { MOOD_SUFFIXES, SUFFIX_ORDER, TENSE_SUFFIXES, type SuffixRule, type SuffixType } from "./suffixes-rules";

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
  paradigm: Paradigm;
  person: Person;
  prefix: string;
  root: string;
  /** En el orden en que aparecen en la palabra (de la raíz hacia afuera). */
  suffixes: AnalysisSuffix[];
  status: "pending_validation";
  pages: number[];
}

/** Minúsculas, NFC, puso unificado y sin guiones (el libro separa a veces con guion: agueru-va'ekue). */
export const normalizeWord = (w: string) =>
  w.normalize("NFC").toLowerCase().trim().replace(/[’‘´`]/g, "'").replace(/-/g, "");

const base = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");
/** Quita solo el acento agudo (no la tilde nasal): el libro desplaza el acento antes de partículas átonas (akarúkuri). */
const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");

function stripNegation(w: string): { core: string; negated: boolean }[] {
  const out = [{ core: w, negated: false }];
  for (const pre of [NEGATION.prefix.oral, NEGATION.prefix.nasal]) {
    if (!w.startsWith(pre)) continue;
    const rest = w.slice(pre.length);
    // "ri" solo si queda una "i" final antes (pág. 25); si no, "i".
    if (rest.endsWith(NEGATION.suffix.afterFinalI) && base(rest.slice(0, -2)).endsWith("i")) {
      out.push({ core: rest.slice(0, -2), negated: true });
    } else if (rest.endsWith(NEGATION.suffix.default) && rest.length > 2) {
      out.push({ core: rest.slice(0, -1), negated: true });
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
 * Lecturas posibles de sufijos para un tema verbal (lo que queda después del prefijo).
 * Siempre incluye la lectura sin sufijos. Orden de trabajo: raíz + modo(s) + tiempo.
 */
function suffixReadings(stem: string): { root: string; suffixes: AnalysisSuffix[] }[] {
  const readings: { root: string; suffixes: AnalysisSuffix[] }[] = [{ root: stem, suffixes: [] }];

  // Paso 1: como mucho un sufijo de tiempo, en el borde derecho.
  const afterTense: { rest: string; tense: AnalysisSuffix[] }[] = [{ rest: stem, tense: [] }];
  if (SUFFIX_ORDER.maxTenses > 0) {
    for (const rule of TENSE_SUFFIXES) {
      const m = matchSuffix(stem, rule);
      if (m) afterTense.push({ rest: m.rest, tense: [m.suffix] });
    }
  }

  // Paso 2: hasta maxMoods sufijos de modo antes del tiempo.
  for (const { rest, tense } of afterTense) {
    let frontier: { rest: string; moods: AnalysisSuffix[] }[] = [{ rest, moods: [] }];
    for (let depth = 0; depth < SUFFIX_ORDER.maxMoods; depth++) {
      const next: typeof frontier = [];
      for (const item of frontier) {
        for (const rule of MOOD_SUFFIXES) {
          if (item.moods.some((m) => m.meaning === rule.meaning)) continue;
          const m = matchSuffix(item.rest, rule);
          if (m) next.push({ rest: m.rest, moods: [m.suffix, ...item.moods] });
        }
      }
      for (const n of next) readings.push({ root: n.rest, suffixes: [...n.moods, ...tense] });
      frontier = next;
    }
    if (tense.length) readings.push({ root: rest, suffixes: tense });
  }

  // Sin duplicados.
  const seen = new Set<string>();
  return readings.filter((r) => {
    const key = `${r.root}|${r.suffixes.map((s) => s.form).join("+")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function analyze(input: string): Analysis[] {
  const w = normalizeWord(input);
  if (!w || /\s/.test(w)) return [];
  const results: Analysis[] = [];
  for (const { core, negated } of stripNegation(w)) {
    for (const [paradigm, rule] of Object.entries(PERSON_PREFIXES) as [Paradigm, (typeof PERSON_PREFIXES)[Paradigm]][]) {
      for (const [person, prefixes] of Object.entries(rule.prefixes) as [Person, string[]][]) {
        for (const prefix of prefixes) {
          if (!core.startsWith(prefix) || core.length <= prefix.length) continue;
          for (const { root, suffixes } of suffixReadings(core.slice(prefix.length))) {
            if (!root) continue;
            // El libro identifica solo 5 verbos hareales (pág. 105): fuera de esas raíces no hay lectura hareal.
            if (paradigm === "hareal" && !(HAREAL_ROOTS.roots as readonly string[]).includes(root)) continue;
            const pages = [rule.source.page];
            if (negated) pages.push(NEGATION.source.page);
            for (const s of suffixes) pages.push(s.page);
            results.push({
              word: input,
              negated,
              paradigm,
              person,
              prefix,
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
  return results;
}
