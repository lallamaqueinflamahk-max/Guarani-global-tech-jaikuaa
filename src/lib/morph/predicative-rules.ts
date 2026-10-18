/**
 * Verbos predicativos, pronominales y lexemas variables — transcripción de
 * "Guarani Ñe'ẽtekuaa / Gramática Guaraní", Academia de la Lengua Guaraní, 2020, págs. 93–103.
 *
 * - Predicativos (págs. 93 y 101): sustantivos, adjetivos o adverbios conjugados con
 *   che / nde (ne) / i (ij, iñ) / ñande (ñane) / ore / pende (pene).
 * - Pronominales (págs. 101–103): el pronombre funciona como complemento directo
 *   ("Nde chejuhu"). La pág. 103 agrega «ro» (de che a nde) y «po».
 * - Lexemas variables (pág. 97): solo tres, «ho» (ir), «ju» (venir) y «'e» (decir).
 *
 * Todo queda "pending_validation". Nada de esto se completa por deducción.
 */
import type { Person, RuleStatus } from "./academia-rules";

const src = (page: number) => ({ book: "Gramática Guaraní ALG 2020" as const, page });

export const PREDICATIVE_PREFIXES: {
  status: RuleStatus;
  source: { book: "Gramática Guaraní ALG 2020"; page: number };
  prefixes: Record<Person, string[]>;
  examples: string[];
} = {
  status: "pending_validation",
  source: src(101),
  // Formas orales y nasales de la tabla de la pág. 101 (che-yvate / che-akãhatã) y de la pág. 93.
  prefixes: {
    "1sg": ["che"],
    "2sg": ["nde", "ne"],
    "3": ["ij", "iñ", "i"],
    "1pl_incl": ["ñande", "ñane"],
    "1pl_excl": ["ore"],
    "2pl": ["pende", "pene"],
  },
  examples: ["cheyvate", "neakãhatã", "ijyvate", "iñakãhatã", "cheporã", "iporã", "imombyry"],
};

/**
 * Pronominales: la persona es el OBJETO de la acción. «ro» = de la 1.ª singular a la 2.ª singular.
 * «po» no se carga: la pág. 103 dice que reemplaza a «ore», pero en la tabla aparece entre «ore» y
 * «pende»; queda como pregunta para los especialistas.
 */
export const PRONOMINAL_PREFIXES: {
  status: RuleStatus;
  source: { book: "Gramática Guaraní ALG 2020"; page: number };
  prefixes: Partial<Record<Person, string[]>>;
  examples: string[];
} = {
  status: "pending_validation",
  source: src(103),
  prefixes: {
    "1sg": ["che"],
    "2sg": ["nde", "ne", "ro"],
    "1pl_incl": ["ñande", "ñane"],
    "1pl_excl": ["ore"],
    "2pl": ["pende", "pene"],
  },
  examples: ["chejuhu", "rojuhu", "nemuña", "pendejuhu"],
};

export interface IrregularForm {
  form: string;
  person: Person;
}

export interface IrregularLexeme {
  lexeme: string;
  meaning: string;
  page: number;
  forms: IrregularForm[];
  status: RuleStatus;
}

/** Tabla de la pág. 97 (filas che, nde, ha'e, ñande, ore, peẽ; ha'ekuéra repite la de ha'e). */
export const IRREGULAR_LEXEMES: IrregularLexeme[] = [
  {
    lexeme: "ho",
    meaning: "ir",
    page: 97,
    status: "pending_validation",
    forms: [
      { form: "aha", person: "1sg" },
      { form: "reho", person: "2sg" },
      { form: "oho", person: "3" },
      { form: "jaha", person: "1pl_incl" },
      { form: "roho", person: "1pl_excl" },
      { form: "peho", person: "2pl" },
    ],
  },
  {
    lexeme: "ju",
    meaning: "venir",
    page: 97,
    status: "pending_validation",
    forms: [
      { form: "aju", person: "1sg" },
      { form: "reju", person: "2sg" },
      { form: "ou", person: "3" },
      { form: "jaju", person: "1pl_incl" },
      { form: "roju", person: "1pl_excl" },
      { form: "peju", person: "2pl" },
    ],
  },
  {
    lexeme: "'e",
    meaning: "decir",
    page: 97,
    status: "pending_validation",
    forms: [
      { form: "ha'e", person: "1sg" },
      { form: "ere", person: "2sg" },
      { form: "he'i", person: "3" },
      { form: "ja'e", person: "1pl_incl" },
      { form: "ro'e", person: "1pl_excl" },
      { form: "peje", person: "2pl" },
    ],
  },
];
