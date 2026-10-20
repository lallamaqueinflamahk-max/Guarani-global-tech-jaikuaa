/**
 * Reglas del sustantivo y del adjetivo — transcripción de "Guarani Ñe'ẽtekuaa / Gramática
 * Guaraní", Academia de la Lengua Guaraní, 2020, págs. 49–85.
 *
 * - Formas uniformes, biformes, triformes y cuatriformes (págs. 51–53): solo las palabras listadas.
 * - Formas de uso o tiempo nominal (pág. 59), número (pág. 61), grados (págs. 67–71).
 * - Ordinal «ha» (pág. 79) e índices de posesión de 3.ª persona (págs. 75–77).
 *
 * Todo queda "pending_validation". Donde el libro da una condición (vocal débil o fuerte, raíz
 * oral o nasal), se respeta; donde no la da, no se inventa.
 */
import type { ExternalSource, RuleSource, RuleStatus } from "./academia-rules";

const src = (page: number): RuleSource => ({ book: "Gramática Guaraní ALG 2020", page });

/** Pág. 61: vocales débiles «(i, ĩ, u, ũ, y, ỹ)» y fuertes «(a, ã, e, ẽ, o, õ)». */
export const WEAK_VOWELS = ["i", "ĩ", "u", "ũ", "y", "ỹ"] as const;
export const STRONG_VOWELS = ["a", "ã", "e", "ẽ", "o", "õ"] as const;

/** Condición que el libro pone sobre la palabra a la que se une la partícula. */
export type NominalCondition =
  | "ninguna"
  | "termina-vocal-debil"
  | "termina-vocal-fuerte"
  | "termina-en-e"
  | "raiz-oral"
  | "raiz-nasal";

export type NominalSuffixType =
  | "tiempo-nominal"
  | "plural"
  | "grado"
  | "ordinal"
  | "posposicion"
  | "interrogativa"
  | "adjetivante"
  | "enclitico"
  | "derivativo";

export interface NominalSuffixRule {
  id: string;
  type: NominalSuffixType;
  form: string;
  meaning: string;
  condition: NominalCondition;
  examples: string[];
  note?: string;
  status: RuleStatus;
  /** Gramática ALG (autoridad) o, marcada, una fuente académica externa con licencia abierta. */
  source: RuleSource | ExternalSource;
}

const r = (
  id: string,
  type: NominalSuffixType,
  form: string,
  meaning: string,
  page: number,
  examples: string[],
  condition: NominalCondition = "ninguna",
  note?: string,
): NominalSuffixRule => ({ id, type, form, meaning, condition, examples, note, status: "pending_validation", source: src(page) });

export const NOMINAL_SUFFIXES: NominalSuffixRule[] = [
  // Pág. 59: formas de uso.
  r("preteritiva-kue", "tiempo-nominal", "kue", "forma de uso preteritiva", 59, ["aokue"]),
  r("preteritiva-ngue", "tiempo-nominal", "ngue", "forma de uso preteritiva", 59, ["iñakãngue"]),
  r("preteritiva-re", "tiempo-nominal", "re", "forma de uso preteritiva", 59, ["rembirekore"]),
  r("futuritiva", "tiempo-nominal", "rã", "forma de uso futuritiva", 59, ["aorã", "pa'irã", "tembirekorã"]),
  r("frustrativa", "tiempo-nominal", "rãngue", "forma de uso frustrativa", 59, ["aorãngue", "pa'irãngue"]),

  // Pág. 61: número.
  r("plural-kuera", "plural", "kuéra", "plural discriminativo", 61, ["karaikuéra"], "raiz-oral",
    "Pág. 63: el cambio a «nguéra» es para dar buen sonido; si no cumple ese objetivo, no hay razón para cambiarla."),
  r("plural-nguera", "plural", "nguéra", "plural discriminativo", 61, ["mitãnguéra", "ñe'ẽnguéra"], "raiz-nasal"),
  r("plural-ita", "plural", "ita", "plural de multitud", 61, ["jaguaita", "kyseita", "ñe'ẽita", "so'oita", "votõita"], "termina-vocal-fuerte"),
  r("plural-eta", "plural", "eta", "plural de multitud", 61, ["ju'ieta", "kavajueta", "kokũeta", "jukyeta", "petỹeta"], "termina-vocal-debil"),

  // Págs. 67–71: grados del sustantivo (pág. 71: se usan también con adjetivos, verbos y adverbios).
  r("igualdad-icha", "grado", "icha", "comparativo de igualdad", 67, ["mbyjáicha", "kavajúicha"]),
  r("superioridad-ve", "grado", "ve", "comparativo de superioridad", 67, ["ogave"]),
  r("inferioridad-ive", "grado", "ive", "comparativo de inferioridad", 67, ["ipy'ive"]),
  r("superlativo-ete", "grado", "ete", "superlativo", 69, ["karia'yete"], "termina-vocal-debil"),
  r("superlativo-ite", "grado", "ite", "superlativo", 69, ["kuñaite"], "termina-vocal-fuerte"),
  r("superlativo-te", "grado", "te", "superlativo", 69, ["kumba'ete"], "termina-en-e"),
  r("supersuperlativo-eterei", "grado", "eterei", "supersuperlativo", 69, ["karia'yeterei"], "termina-vocal-debil",
    "La pág. 85 (adjetivo) invierte vocales débiles y fuertes respecto de la pág. 69: pregunta para especialistas."),
  r("supersuperlativo-iterei", "grado", "iterei", "supersuperlativo", 69, ["kuñaiterei"], "termina-vocal-fuerte"),
  r("supersuperlativo-terei", "grado", "terei", "supersuperlativo", 69, ["kuimba'eterei"], "termina-en-e"),
  r("superlativisimo-rasa", "grado", "rasa", "superlativísimo", 69, ["karia'yrasa", "karairasa", "mitãrasa"]),
  r("ultrasuperlativo-etereirasa", "grado", "etereirasa", "ultrasuperlativo", 69, ["karia'yetereirasa"], "termina-vocal-debil"),
  r("ultrasuperlativo-itereirasa", "grado", "itereirasa", "ultrasuperlativo", 69, ["mitãitereirasa"], "termina-vocal-fuerte"),
  r("excelso-pave", "grado", "pavẽ", "excelso", 69, ["vy'apavẽ"]),
  r("excelso-vete", "grado", "vete", "excelso", 69, ["mburuvichavete"]),
  r("excelso-vusu", "grado", "vusu", "excelso", 69, ["ñanderuvusu"]),

  // Pág. 79: ordinal.
  r("ordinal-ha", "ordinal", "ha", "numeral ordinal", 79, ["peteĩha", "mokõiha", "mbohapyha", "poha"]),

  // Págs. 207–209: posposiciones monosilábicas (van unidas). pe/me según la armonización nasal (pág. 29).
  r("posp-pe", "posposicion", "pe", "a, en", 207, ["ógape", "ka'akupépe"], "raiz-oral", "Pág. 29: ka'aguýpe."),
  r("posp-me", "posposicion", "me", "a, en", 207, [], "raiz-nasal", "Pág. 29: ñúme; pág. 35: akãme."),
  r("posp-gua", "posposicion", "gua", "de", 207, []),
  r("posp-gui", "posposicion", "gui", "de", 207, ["paraguarígui"], "ninguna", "Pág. 37: amógui."),
  r("posp-re", "posposicion", "re", "por", 207, [], "ninguna", "Pág. 37: oúre (apócope de «ou rehe»)."),
  r("posp-ndi", "posposicion", "ndi", "con (apócope de «ndive»)", 207, []),

  // Pág. 229: partículas adjetivantes «va», «hague» (también «ha», «va'ekue», «va'erã», cargadas con el verbo).
  // Pág. 231 las usa con sustantivos y adverbios: araguáva, tendaguáva, tekoguáva, ramóva.
  r("adjetivante-va", "adjetivante", "va", "partícula adjetivante", 229, [], "ninguna", "Pág. 231: araguáva, tendaguáva, tekoguáva, ramóva. Pág. 195: kóva, péva."),
  r("adjetivante-hague", "adjetivante", "hague", "partícula adjetivante", 229, [], "ninguna", "Pág. 231: haguépe, haguéicha."),

  // Pág. 185 (y pág. 115 con el verbo): partículas interrogativas sufijas, átonas.
  r("interrogativa-pa", "interrogativa", "pa", "partícula interrogativa", 185, [], "ninguna", "Pág. 181: «Moõpa reiko»."),
  r("interrogativa-piko", "interrogativa", "piko", "partícula interrogativa", 185, [], "ninguna", "Pág. 181: «Moõpiko reiko»."),
  r("interrogativa-tiko", "interrogativa", "tiko", "partícula interrogativa", 185, []),
  r("interrogativa-tepa", "interrogativa", "tepa", "partícula interrogativa", 185, []),
];

/**
 * Nivel de cada tipo al pelar desde la derecha (0 = más afuera). Máximo uno de cada tipo.
 * Plural y posposición comparten nivel: el libro tiene «ambuekuéragui» (plural + gui) y
 * «ogapypeguakuéra» (pág. 55: gua + plural).
 */
export const NOMINAL_SUFFIX_LEVEL: Record<NominalSuffixType, number> = {
  interrogativa: 0,
  adjetivante: 0,
  enclitico: 0,
  derivativo: 4,
  posposicion: 0,
  plural: 0,
  "tiempo-nominal": 1,
  ordinal: 2,
  grado: 3,
};

export type MultiformKind = "biforme" | "triforme" | "cuatriforme";

export interface MultiformNoun {
  kind: MultiformKind;
  /** Forma absoluta primero; después las constructivas en el orden del libro. */
  forms: string[];
  page: number;
  status: RuleStatus;
}

const m = (kind: MultiformKind, page: number, forms: string[]): MultiformNoun => ({ kind, forms, page, status: "pending_validation" });

/** Págs. 51–53: solo las palabras que el libro lista. */
export const MULTIFORM_NOUNS: MultiformNoun[] = [
  m("biforme", 51, ["ta'ýra", "ra'y"]),
  m("biforme", 51, ["tajýra", "rajy"]),
  m("biforme", 51, ["túva", "ru"]),
  m("biforme", 51, ["tykéra", "ryke"]),
  m("triforme", 53, ["tova", "rova", "hova"]),
  m("triforme", 53, ["tetyma", "retyma", "hetyma"]),
  m("triforme", 53, ["tañykã", "rañykã", "hañykã"]),
  m("triforme", 53, ["óga", "róga", "hóga"]),
  m("cuatriforme", 53, ["tymba", "rymba", "hymba", "mymba"]),
  m("cuatriforme", 53, ["to'o", "ro'o", "ho'o", "so'o"]),
  m("cuatriforme", 53, ["tenimbe", "renimbe", "henimbe", "inimbe"]),
  m("cuatriforme", 53, ["tenimbo", "renimbo", "henimbo", "inimbo"]),
];

export interface PossessiveIndex {
  form: string;
  /** Condición tal como la describe el libro. */
  condition: string;
  examples: string[];
  page: number;
}

/** Págs. 75–77: índices de posesión de 3.ª persona. «o» es un virtual arcaísmo (pág. 77): no se carga. */
export const THIRD_PERSON_POSSESSIVE: { status: RuleStatus; source: RuleSource; indices: PossessiveIndex[] } = {
  status: "pending_validation",
  source: src(75),
  indices: [
    { form: "h", condition: "sustantivos que inician con «t» u «o» (triformes)", examples: ["hóga", "hesa", "hetyma", "hañykã"], page: 75 },
    { form: "ij", condition: "sustantivo oral que inicia con vocal y termina con vocal tónica", examples: ["ijao", "ijapyka"], page: 77 },
    { form: "iñ", condition: "sustantivo nasal que inicia con vocal y termina con vocal tónica", examples: ["iñakã"], page: 77 },
    { form: "i", condition: "sustantivo que inicia con consonante que no sea «t»", examples: ["imbarakaja", "ikuatia"], page: 77 },
    { form: "hi'", condition: "sustantivos que inician con vocal tónica y terminan con vocal átona", examples: ["hi'ára", "hi'áva"], page: 77 },
  ],
};
