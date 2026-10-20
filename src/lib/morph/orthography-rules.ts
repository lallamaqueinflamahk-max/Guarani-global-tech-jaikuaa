/**
 * Reglas ortográficas, de sílaba y de eufonía — transcripción de
 * "Guarani Ñe'ẽtekuaa / Gramática Guaraní", Academia de la Lengua Guaraní, 2020.
 *
 * - Cuatro reglas ortográficas (págs. 33–37), aprobadas por la Academia el 10/08/2016:
 *   1) alfabeto oficial, 2) tilde acentual, 3) sílabas nasales, 4) formación de palabras.
 * - Sílaba directa y supresión de consonantes finales (págs. 19 y 21–23).
 * - Cambios eufónicos: armonización nasal, vocal eufónica y armonización glotal (págs. 27–31).
 * - Posposiciones monosilábicas y polisilábicas (págs. 207–209), base de la regla 4.
 *
 * Todo queda "pending_validation". Nada se completa por deducción: donde el libro no decide,
 * el código responde "duda" y la pregunta va a los especialistas.
 */
import type { RuleSource, RuleStatus } from "./academia-rules";

const src = (page: number): RuleSource => ({ book: "Gramática Guaraní ALG 2020", page });

/** Dígrafos del alfabeto (pág. 33) más «ll», admitida para préstamos reglamentados. */
export const DIGRAPHS = ["ch", "mb", "nd", "ng", "nt", "rr", "ll"] as const;

/** Vocales orales (pág. 35: "a, e, i, o, u, y") y nasales (pág. 35: "ã, ẽ, ĩ, õ, ũ, ỹ"). */
export const ORAL_VOWELS = ["a", "e", "i", "o", "u", "y"] as const;
export const NASAL_VOWELS = ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ"] as const;

/** Pág. 35: consonantes nasales (g̃, m, n, ñ) y naso-orales (mb, nd, ng, nt). */
export const NASAL_CONSONANTS = ["g̃", "m", "n", "ñ"] as const;
export const NASO_ORAL_CONSONANTS = ["mb", "nd", "ng", "nt"] as const;

export type OrthographyRuleId =
  | "alfabeto"
  | "tilde"
  | "silaba-nasal"
  | "formacion-palabras"
  | "silaba-directa";

export interface OrthographyRule {
  id: OrthographyRuleId;
  title: string;
  /** Lo que el libro establece, en sus palabras o resumido sin agregar nada. */
  statement: string;
  status: RuleStatus;
  source: RuleSource;
  /** Formas que el libro da como correctas para esta regla. */
  examples: string[];
}

export const ORTHOGRAPHY_RULES: Record<OrthographyRuleId, OrthographyRule> = {
  alfabeto: {
    id: "alfabeto",
    title: "Primera regla: del alfabeto oficial",
    statement:
      "33 fonemas representados por 33 grafemas; los dígrafos representan una sola letra. D, F y LL se usan para palabras de otras lenguas, una vez reglamentadas.",
    status: "pending_validation",
    source: src(33),
    examples: [],
  },
  tilde: {
    id: "tilde",
    title: "Segunda regla: del uso de la tilde acentual",
    statement:
      "No se usa tilde cuando la vocal tónica es la final; antes del final se usa indefectiblemente. Con dos o más tónicas, se marca la de la derecha que no sea final. No se tilda la vocal nasal. Una sola tilde por palabra, móvil.",
    status: "pending_validation",
    source: src(33),
    examples: ["guata", "ñani", "ao", "ára", "purahéi", "mbo'ehára", "mokõi", "ko'ẽrõ", "akãme", "pirapire", "pirapirére", "oñembopirapirevéta"],
  },
  "silaba-nasal": {
    id: "silaba-nasal",
    title: "Tercera regla: de la formación de sílabas nasales",
    statement:
      "No concurren en la sílaba dos letras nasales. La vocal oral con consonante nasal o naso-oral queda nasalizada; la vocal nasal con consonante oral forma sílaba nasal.",
    status: "pending_validation",
    source: src(35),
    examples: ["g̃ua", "ma", "ne", "ña", "nda", "pytã"],
  },
  "formacion-palabras": {
    id: "formacion-palabras",
    title: "Cuarta regla: de la formación de palabras",
    statement:
      "Prefijos y sufijos se unen al lexema base. Las posposiciones monosilábicas van unidas a su regente; las polisilábicas, separadas.",
    status: "pending_validation",
    source: src(37),
    examples: ["oporogueroguataseténiko", "oúre", "amógui", "ou rehe", "amo guive"],
  },
  "silaba-directa": {
    id: "silaba-directa",
    title: "Sílaba directa y sin consonante final",
    statement:
      "El guaraní no tiene sílabas trabadas ni dos consonantes seguidas, salvo los dígrafos; en el guaraní actual no existen palabras con terminación consonántica.",
    status: "pending_validation",
    source: src(19),
    examples: ["perere", "pete", "pepe", "poko", "aña"],
  },
};

/** Posposiciones (págs. 207–209). Las formas entre paréntesis del libro van como variante nasal. */
export const POSTPOSITIONS = {
  status: "pending_validation" as RuleStatus,
  source: src(207),
  /** "Tienen una sola sílaba y por regla de la ortografía deben ir unidas a la raíz." */
  monosyllabic: [
    { forms: ["pe", "me"], meaning: "a, en" },
    { forms: ["gua"], meaning: "de" },
    { forms: ["gui"], meaning: "de" },
    { forms: ["re"], meaning: "por" },
    { forms: ["ndi"], meaning: "con (apócope de «ndive»)" },
  ],
  /** "Se escriben separadas de su regente. Las más usadas son:" (pág. 209). */
  polysyllabic: [
    { forms: ["guive"], meaning: "desde" },
    { forms: ["hag̃ua"], meaning: "para (usada con verbo)" },
    { forms: ["g̃uarã"], meaning: "para (usada con sustantivo)" },
    { forms: ["peve", "meve"], meaning: "hasta" },
    { forms: ["ári"], meaning: "sobre" },
    { forms: ["rire"], meaning: "después" },
    { forms: ["rupi"], meaning: "por" },
    { forms: ["rehe"], meaning: "por" },
    { forms: ["ndive"], meaning: "con" },
    { forms: ["rehe'ỹ"], meaning: "sin" },
    { forms: ["gotyo"], meaning: "hacia" },
  ],
  examples: [
    "Ahátama ógape",
    "Ou isy ndive",
    "Peru oho kuehe Ka'akupépe",
    "Ha'ekuéra ogueru chipa Paraguarígui",
    "Mombyry guive aju ne rendápe",
    "Ou okaru hag̃ua",
    "Kalo oho isy ndive Paraguaýpe",
  ],
};

export type EuphonyKind = "armonizacion-nasal" | "cambio-eufonico" | "vocal-eufonica" | "armonizacion-glotal";

export interface EuphonyRule {
  id: string;
  kind: EuphonyKind;
  /** Lo que cambia, tal como lo escribe el libro: `from` pasa a `to` (en la armonización nasal, forma oral → forma nasal). */
  from: string;
  to: string;
  examples: string[];
  note?: string;
  status: RuleStatus;
  source: RuleSource;
}

/** Págs. 27–31. Solo los pares y ejemplos que el libro imprime. */
export const EUPHONY_RULES: EuphonyRule[] = [
  { id: "jo-ño", kind: "armonizacion-nasal", from: "jo", to: "ño", examples: ["johecha", "ñohetũ"], status: "pending_validation", source: src(27) },
  { id: "nd-n", kind: "armonizacion-nasal", from: "nd", to: "n", examples: ["nde juru", "ne tĩ"], status: "pending_validation", source: src(27) },
  { id: "pe-me", kind: "armonizacion-nasal", from: "pe", to: "me", examples: ["ka'aguýpe", "ñúme"], status: "pending_validation", source: src(29) },
  { id: "pa-mba", kind: "armonizacion-nasal", from: "pa", to: "mba", examples: ["ohopa", "osẽmba"], status: "pending_validation", source: src(29) },
  {
    id: "k-ng",
    kind: "cambio-eufonico",
    from: "k",
    to: "ng",
    examples: ["karai", "mongarai"],
    note: "El libro: karai se convierte en mongarai y no mbokarai.",
    status: "pending_validation",
    source: src(29),
  },
  {
    id: "s-nd",
    kind: "cambio-eufonico",
    from: "s",
    to: "nd",
    examples: ["soro", "mondoro"],
    note: "El libro: soro se convierte en mondoro, y no en mbosoro.",
    status: "pending_validation",
    source: src(29),
  },
  {
    id: "t-nd",
    kind: "cambio-eufonico",
    from: "t",
    to: "nd",
    examples: ["tyky", "mondyky"],
    note: "El libro: tyky se convierte en mondyky, y no mbotyky.",
    status: "pending_validation",
    source: src(29),
  },
  {
    id: "vocal-e",
    kind: "vocal-eufonica",
    from: "nd",
    to: "nde",
    examples: ["rejapo", "nderejapói"],
    note: "Nd-e-rejapó-i: la «e» intermedia tiene función meramente eufónica.",
    status: "pending_validation",
    source: src(29),
  },
  {
    id: "h-glotal",
    kind: "armonizacion-glotal",
    from: "'",
    to: "h",
    examples: ["ha'u", "ho'u", "ha'e", "he'i", "ha'a", "ho'a", "hi'y", "hi'ára"],
    note: "Verbos con «h» inicial: en el lexema existe una consonante inicial glotal (').",
    status: "pending_validation",
    source: src(29),
  },
];
