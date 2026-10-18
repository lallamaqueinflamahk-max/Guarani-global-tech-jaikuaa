/**
 * Sufijos verbales — transcripción de "Guarani Ñe'ẽtekuaa / Gramática Guaraní",
 * Academia de la Lengua Guaraní, versión corregida 2020 (Servilibro).
 *
 * Cada partícula cita la página impresa (castellano) donde el libro la define
 * y, si difiere, la página de sus ejemplos. Todo queda "pending_validation"
 * hasta que el Comité Lingüístico lo apruebe con su ficha de regla.
 *
 * No incluidos porque el libro no los define como partícula verbal en estas secciones:
 * "kuaa" (capacidad/saber) e "ima" (variante de "ma"). Se agregan solo si un
 * especialista indica la página.
 */
import type { RuleStatus } from "./academia-rules";

export type SuffixType = "tense" | "mood" | "aspect";

export interface SuffixRule {
  id: string;
  /** Formas tal como aparecen en el libro (con puso normalizado a '). */
  forms: string[];
  type: SuffixType;
  /** Nombre que le da el libro. */
  meaning: string;
  /** Página donde el libro define la partícula. */
  page: number;
  /** Página de los ejemplos, si es otra. */
  examplesPage?: number;
  /** Lo que el libro aclara sobre la partícula (tónica/átona, oral/nasal). */
  note: string;
  status: RuleStatus;
}

const pending: RuleStatus = "pending_validation";

/** Tiempos del verbo (págs. 123–135). */
export const TENSE_SUFFIXES: SuffixRule[] = [
  {
    id: "preterito-perfecto",
    forms: ["akue"],
    type: "tense",
    meaning: "Pretérito perfecto",
    page: 125,
    note: "Partícula tónica «akue», sin puso, unida al lexema.",
    status: pending,
  },
  {
    id: "preterito-pluscuamperfecto",
    forms: ["va'ekue"],
    type: "tense",
    meaning: "Pretérito pluscuamperfecto",
    page: 125,
    examplesPage: 127,
    note: "Partícula tónica «va'ekue» unida al lexema.",
    status: pending,
  },
  {
    id: "preterito-reciente",
    forms: ["kuri"],
    type: "tense",
    meaning: "Pretérito reciente",
    page: 127,
    examplesPage: 129,
    note: "Partícula átona «kuri».",
    status: pending,
  },
  {
    id: "futuro-perfecto",
    forms: ["ta"],
    type: "tense",
    meaning: "Futuro perfecto",
    page: 131,
    note: "Partícula átona «ta».",
    status: pending,
  },
  {
    id: "futuro-obligatorio",
    forms: ["va'erã"],
    type: "tense",
    meaning: "Futuro obligatorio",
    page: 131,
    examplesPage: 133,
    note: "Partícula tónica «va'erã».",
    status: pending,
  },
  {
    id: "futuro-necesario",
    // En los ejemplos del libro aparece con puso tras vocal (ajohei'arã, amokã'arã).
    forms: ["'arã", "arã"],
    type: "tense",
    meaning: "Futuro necesario",
    page: 133,
    note: "Partícula tónica «arã».",
    status: pending,
  },
];

/** Modos del verbo (págs. 139–171). */
export const MOOD_SUFFIXES: SuffixRule[] = [
  {
    id: "modo-volitivo",
    forms: ["se"],
    type: "mood",
    meaning: "Modo volitivo",
    page: 139,
    note: "Partícula sufija tónica «se».",
    status: pending,
  },
  {
    id: "modo-totalitativo",
    forms: ["pa", "mba"],
    type: "mood",
    meaning: "Modo totalitativo",
    page: 143,
    note: "Partículas tónicas «pa» para verbos orales y «mba» para verbos nasales.",
    status: pending,
  },
  {
    id: "modo-aseverativo",
    forms: ["ma"],
    type: "mood",
    meaning: "Modo aseverativo",
    page: 161,
    note: "Partícula átona «ma».",
    status: pending,
  },
];

/**
 * Orden de trabajo del analizador: raíz + modo + tiempo + negación.
 * El libro muestra cada partícula unida al lexema, pero no fija en estas páginas
 * el orden cuando se combinan: este orden queda pendiente de confirmación del Comité.
 */
export const SUFFIX_ORDER = {
  status: pending,
  order: ["mood", "tense"] as const,
  maxMoods: 2,
  maxTenses: 1,
};

export const ALL_SUFFIX_RULES: SuffixRule[] = [...TENSE_SUFFIXES, ...MOOD_SUFFIXES];
