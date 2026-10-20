/**
 * Núcleo de reglas morfológicas — transcripción literal de
 * "Guarani Ñe'ẽtekuaa / Gramática Guaraní", Academia de la Lengua Guaraní,
 * versión corregida 2020 (Servilibro). Cada regla cita su página impresa.
 *
 * IMPORTANTE: nada de esto se inventa ni se completa por deducción.
 * Todas las reglas quedan "pending_validation" hasta que el Comité
 * Lingüístico (ficha de regla) las apruebe. No mostrar como verificado.
 */

export type RuleStatus = "pending_validation" | "validated";

export interface RuleSource {
  book: "Gramática Guaraní ALG 2020";
  page: number;
}

/**
 * Fuente académica externa con licencia abierta, usada solo donde el libro de la Academia no
 * decide o no lista: Bruno Estigarribia, «A Grammar of Paraguayan Guarani», UCL Press, 2020
 * (CC BY 4.0). La autoridad sigue siendo la Gramática ALG; lo externo se muestra marcado.
 */
export interface ExternalSource {
  book: "Estigarribia 2020";
  page: number;
  license: "CC BY 4.0";
}

const src = (page: number): RuleSource => ({ book: "Gramática Guaraní ALG 2020", page });

/** Regla 1 (pág. 33): alfabeto oficial de 33 grafemas. */
export const ALPHABET = {
  status: "pending_validation" as RuleStatus,
  source: src(33),
  letters: [
    "a", "ã", "ch", "e", "ẽ", "g", "g̃", "h", "i", "ĩ", "j", "k", "l", "m",
    "mb", "n", "nd", "ng", "nt", "ñ", "o", "õ", "p", "r", "rr", "s", "t",
    "u", "ũ", "v", "y", "ỹ", "'",
  ],
  /** Letras admitidas solo para préstamos (pág. 33). */
  loanLetters: ["d", "f", "ll"],
} as const;

export type Paradigm = "areal" | "aireal" | "hareal";
export type Person = "1sg" | "2sg" | "3" | "1pl_incl" | "1pl_excl" | "2pl";

/** Prefijos personales por conjugación (págs. 103–105). */
export const PERSON_PREFIXES: Record<
  Paradigm,
  { status: RuleStatus; source: RuleSource; prefixes: Record<Person, string[]> }
> = {
  areal: {
    status: "pending_validation",
    source: src(103),
    // ja- con verbo oral, ña- con verbo nasal (ejemplos guapy / maña).
    prefixes: { "1sg": ["a"], "2sg": ["re"], "3": ["o"], "1pl_incl": ["ja", "ña"], "1pl_excl": ["ro"], "2pl": ["pe"] },
  },
  aireal: {
    status: "pending_validation",
    source: src(105),
    prefixes: { "1sg": ["ai"], "2sg": ["rei"], "3": ["oi"], "1pl_incl": ["jai", "ñai"], "1pl_excl": ["roi"], "2pl": ["pei"] },
  },
  hareal: {
    status: "pending_validation",
    source: src(105),
    prefixes: { "1sg": ["ha"], "2sg": ["re"], "3": ["ho"], "1pl_incl": ["ja", "ña"], "1pl_excl": ["ro"], "2pl": ["pe"] },
  },
};

/** El libro identifica solo 5 verbos hareales (pág. 105). */
export const HAREAL_ROOTS = {
  status: "pending_validation" as RuleStatus,
  source: src(105),
  roots: ["'a", "'u", "y'u", "'yta", "'yguy"],
};

/** Negación discontinua (págs. 24–25 y 115). */
export const NEGATION = {
  status: "pending_validation" as RuleStatus,
  source: src(115),
  prefix: { oral: "nd", nasal: "n" },
  /** «iri»: pleonasmo para dar énfasis, con verbos no terminados en «i» («ndoguatáiri», pág. 115). */
  suffix: { default: "i", afterFinalI: "ri", emphatic: "iri" },
  /**
   * Vocal eufónica entre la negación y el prefijo personal (tabla de la pág. 115 y pág. 29:
   * "Nd-e-rejapó-i"): nde-re, nda-ja / na-ña, ndo-ro, nda-pe / na-pe.
   */
  euphonic: { "2sg": "e", "1pl_incl": "a", "1pl_excl": "o", "2pl": "a" } as Partial<Record<Person, string>>,
};

/** Elige el sufijo de negación según la regla de la pág. 25. */
export function negationSuffix(verb: string): string {
  const last = verb.normalize("NFD").replace(/\p{M}/gu, "").slice(-1).toLowerCase();
  return last === "i" ? NEGATION.suffix.afterFinalI : NEGATION.suffix.default;
}

/** Elige el prefijo de negación según la nasalidad de la palabra. */
export function negationPrefix(isNasal: boolean): string {
  return isNasal ? NEGATION.prefix.nasal : NEGATION.prefix.oral;
}

/** Lista de todas las reglas para el panel del Comité. */
export const ALL_RULES = [
  { id: "alfabeto", ...ALPHABET },
  { id: "prefijos-areales", ...PERSON_PREFIXES.areal },
  { id: "prefijos-aireales", ...PERSON_PREFIXES.aireal },
  { id: "prefijos-hareales", ...PERSON_PREFIXES.hareal },
  { id: "raices-hareales", ...HAREAL_ROOTS },
  { id: "negacion", ...NEGATION },
];
