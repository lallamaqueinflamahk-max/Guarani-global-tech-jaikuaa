/**
 * Analizador nominal: separa índice de posesión de 3.ª persona, raíz y partículas del sustantivo
 * (tiempo nominal, plural, grado, ordinal y posposiciones monosilábicas), usando SOLO las reglas
 * de nominal-rules.ts (págs. 49–85 y 207). Reconoce las formas biformes, triformes y
 * cuatriformes que el libro lista.
 *
 * No inventa raíces: devuelve lecturas candidatas, siempre "pending_validation".
 */
import { normalizeWord } from "./analyzer";
import {
  MULTIFORM_NOUNS,
  NOMINAL_SUFFIXES,
  NOMINAL_SUFFIX_LEVEL,
  STRONG_VOWELS,
  THIRD_PERSON_POSSESSIVE,
  WEAK_VOWELS,
  type MultiformKind,
  type NominalSuffixRule,
  type NominalSuffixType,
} from "./nominal-rules";
import { graphemes, isVowel, rootNasality } from "./orthography";

export interface NominalSuffix {
  form: string;
  type: NominalSuffixType;
  meaning: string;
  page: number;
  ruleId: string;
}

export interface NominalAnalysis {
  word: string;
  root: string;
  /** Índice de posesión de 3.ª persona (págs. 75–77). */
  possessor?: { form: string; page: number };
  /** Si la raíz es una forma de un sustantivo multiforme listado (págs. 51–53). */
  multiform?: { kind: MultiformKind; absolute: string; form: string; page: number };
  /** De la raíz hacia afuera. */
  suffixes: NominalSuffix[];
  /**
   * Armonización nasal de kuéra/nguéra y pe/me (págs. 29 y 61): "ok" si la forma corresponde a la
   * raíz, "no" si no corresponde, "duda" si el libro no decide. La pág. 63 admite excepciones.
   */
  harmony: "ok" | "no" | "duda" | "no-aplica";
  status: "pending_validation";
  pages: number[];
}

const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");
const WEAK = new Set<string>(WEAK_VOWELS);
const STRONG = new Set<string>(STRONG_VOWELS);
const MIN_ROOT_LETTERS = 2;

function lastLetter(stem: string): string | undefined {
  const g = graphemes(stem);
  return g[g.length - 1]?.letter;
}

/** ¿Cumple la condición que el libro pone a la palabra a la que se une la partícula? */
function meetsCondition(rule: NominalSuffixRule, stem: string): boolean {
  const last = lastLetter(stem);
  if (!last) return false;
  switch (rule.condition) {
    case "termina-vocal-debil":
      return WEAK.has(last);
    case "termina-vocal-fuerte":
      // Pág. 69: "Para las palabras terminadas en «e» usa la partícula sufija –te" (y «terei»).
      return STRONG.has(last) && !(rule.type === "grado" && last === "e");
    case "termina-en-e":
      return last === "e";
    default:
      return true; // oral/nasal: no se bloquea, se informa en `harmony` (la pág. 63 admite excepciones).
  }
}

function cut(stem: string, rule: NominalSuffixRule): string | null {
  const plain = stripAcute(stem);
  if (plain.length !== stem.length) return null;
  const f = stripAcute(rule.form);
  if (!plain.endsWith(f)) return null;
  const rest = stem.slice(0, stem.length - f.length);
  const g = graphemes(rest);
  // Págs. 21–23: en el guaraní actual no hay palabras terminadas en consonante.
  if (g.length < MIN_ROOT_LETTERS || !isVowel(g[g.length - 1]?.letter ?? "")) return null;
  return rest;
}

type Peeled = { stem: string; suffixes: NominalSuffix[]; rules: NominalSuffixRule[] };

/** Pela partículas desde la derecha según NOMINAL_SUFFIX_LEVEL, una por tipo. */
function peel(word: string): Peeled[] {
  const out: Peeled[] = [];
  const walk = (stem: string, minLevel: number, suffixes: NominalSuffix[], rules: NominalSuffixRule[]) => {
    out.push({ stem, suffixes, rules });
    for (const rule of NOMINAL_SUFFIXES) {
      const level = NOMINAL_SUFFIX_LEVEL[rule.type];
      if (level < minLevel || rules.some((r) => r.type === rule.type)) continue;
      const rest = cut(stem, rule);
      if (rest === null || !meetsCondition(rule, rest)) continue;
      const hit: NominalSuffix = {
        form: stem.slice(rest.length),
        type: rule.type,
        meaning: rule.meaning,
        page: rule.source.page,
        ruleId: rule.id,
      };
      walk(rest, level, [hit, ...suffixes], [rule, ...rules]);
    }
  };
  walk(word, 0, [], []);
  return out;
}

function harmonyOf(root: string, rules: NominalSuffixRule[]): NominalAnalysis["harmony"] {
  const relevant = rules.filter((r) => r.condition === "raiz-oral" || r.condition === "raiz-nasal");
  if (relevant.length === 0) return "no-aplica";
  const nas = rootNasality(root);
  if (nas === "duda") return "duda";
  return relevant.every((r) => (r.condition === "raiz-nasal") === (nas === "nasal")) ? "ok" : "no";
}

const MULTI_BY_FORM = new Map<string, { kind: MultiformKind; absolute: string; form: string; page: number }>();
for (const mf of MULTIFORM_NOUNS) {
  for (const f of mf.forms) MULTI_BY_FORM.set(stripAcute(f), { kind: mf.kind, absolute: mf.forms[0] ?? f, form: f, page: mf.page });
}

/** Índices de 3.ª persona, del más largo al más corto. «h» solo a través de la tabla de multiformes. */
function possessorReadings(stem: string): { root: string; possessor: { form: string; page: number } }[] {
  const out: { root: string; possessor: { form: string; page: number } }[] = [];
  const idx = (f: string) => THIRD_PERSON_POSSESSIVE.indices.find((i) => i.form === f);
  const g = graphemes(stem);
  const first = g[0]?.letter;
  const second = g[1]?.letter;
  if (!first) return out;
  const hi = idx("hi'");
  if (hi && stem.startsWith("hi'") && graphemes(stem.slice(3)).length >= MIN_ROOT_LETTERS && isVowel(graphemes(stem.slice(3))[0]?.letter ?? "")) {
    out.push({ root: stem.slice(3), possessor: { form: "hi'", page: hi.page } });
  }
  for (const f of ["ij", "iñ"] as const) {
    const i = idx(f);
    const rest = stem.slice(f.length);
    if (i && stem.startsWith(f) && graphemes(rest).length >= MIN_ROOT_LETTERS && isVowel(graphemes(rest)[0]?.letter ?? "")) {
      out.push({ root: rest, possessor: { form: f, page: i.page } });
    }
  }
  const iIdx = idx("i");
  if (iIdx && first === "i" && second && !isVowel(second) && second !== "t" && second !== "'" && graphemes(stem).length - 1 >= MIN_ROOT_LETTERS) {
    out.push({ root: stem.slice(1), possessor: { form: "i", page: iIdx.page } });
  }
  return out;
}

/** Lecturas nominales candidatas de una palabra. No incluye la lectura trivial «sin nada». */
export function analyzeNominal(word: string): NominalAnalysis[] {
  const w = normalizeWord(word);
  if (!w) return [];
  const readings: NominalAnalysis[] = [];
  const seen = new Set<string>();
  const add = (a: NominalAnalysis) => {
    const key = `${a.possessor?.form ?? ""}|${a.root}|${a.multiform?.absolute ?? ""}|${a.suffixes.map((s) => s.ruleId).join("+")}`;
    if (seen.has(key)) return;
    seen.add(key);
    readings.push(a);
  };

  for (const { stem, suffixes, rules } of peel(w)) {
    const pages = [...new Set(suffixes.map((s) => s.page))];
    const multi = MULTI_BY_FORM.get(stripAcute(stem));
    if (multi) {
      add({
        word: w,
        root: multi.absolute,
        multiform: multi,
        possessor: multi.form.startsWith("h") && multi.form !== multi.absolute ? { form: "h", page: 75 } : undefined,
        suffixes,
        harmony: harmonyOf(multi.absolute, rules),
        status: "pending_validation",
        pages: [...new Set([multi.page, ...pages])].sort((a, b) => a - b),
      });
    }
    for (const p of possessorReadings(stem)) {
      add({
        word: w,
        root: p.root,
        possessor: p.possessor,
        suffixes,
        harmony: harmonyOf(p.root, rules),
        status: "pending_validation",
        pages: [...new Set([p.possessor.page, ...pages])].sort((a, b) => a - b),
      });
    }
    if (suffixes.length > 0) {
      add({ word: w, root: stem, suffixes, harmony: harmonyOf(stem, rules), status: "pending_validation", pages: pages.sort((a, b) => a - b) });
    }
  }
  // Primero las que respetan la armonía, después las de menos partículas.
  const rank = { ok: 0, "no-aplica": 1, duda: 2, no: 3 } as const;
  return readings.sort((a, b) => rank[a.harmony] - rank[b.harmony] || a.suffixes.length - b.suffixes.length);
}
