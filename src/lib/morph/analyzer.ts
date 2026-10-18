/**
 * Analizador morfológico mínimo: separa negación y prefijo personal usando
 * SOLO las reglas transcriptas en academia-rules.ts. No inventa raíces ni
 * formas: devuelve candidatos, siempre "pending_validation".
 */
import { NEGATION, PERSON_PREFIXES, type Paradigm, type Person } from "./academia-rules";

export interface Analysis {
  word: string;
  negated: boolean;
  paradigm: Paradigm;
  person: Person;
  prefix: string;
  root: string;
  status: "pending_validation";
  pages: number[];
}

const norm = (w: string) => w.normalize("NFC").toLowerCase().trim().replace(/[’‘´`]/g, "'");
const base = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");

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

export function analyze(input: string): Analysis[] {
  const w = norm(input);
  if (!w || /\s/.test(w)) return [];
  const results: Analysis[] = [];
  for (const { core, negated } of stripNegation(w)) {
    for (const [paradigm, rule] of Object.entries(PERSON_PREFIXES) as [Paradigm, (typeof PERSON_PREFIXES)[Paradigm]][]) {
      for (const [person, prefixes] of Object.entries(rule.prefixes) as [Person, string[]][]) {
        for (const prefix of prefixes) {
          if (!core.startsWith(prefix) || core.length <= prefix.length) continue;
          results.push({
            word: input,
            negated,
            paradigm,
            person,
            prefix,
            root: core.slice(prefix.length),
            status: "pending_validation",
            pages: negated ? [rule.source.page, NEGATION.source.page] : [rule.source.page],
          });
        }
      }
    }
  }
  return results;
}
