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
import type { Person, RuleStatus } from "./academia-rules";

export type SuffixType = "tense" | "mood" | "aspect" | "grade";

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
  /** Formas literales del libro (fila "Che" o la primera fila sin observaciones). */
  examples?: string[];
  /** El libro dice que solo se conjuga en plural. */
  pluralOnly?: boolean;
  /** La partícula concuerda con una persona (aspecto, págs. 135–137). */
  person?: Person;
  /** Fila de la tabla del libro que parece no seguir el patrón: se pregunta a los especialistas, no se corrige. */
  bookObservation?: string;
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
    examples: ["agueruakue"],
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
    examples: ["agueru-va'ekue"],
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
    examples: ["akarúkuri"],
    status: pending,
  },
  {
    id: "futuro-perfecto",
    forms: ["ta"],
    type: "tense",
    meaning: "Futuro perfecto",
    page: 131,
    note: "Partícula átona «ta».",
    examples: ["apoíta"],
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
    examples: ["aguatava'erã"],
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
    examples: ["ajohei'arã", "amokã'arã"],
    status: pending,
  },
  // Agregados en la súper prueba del 18/10/2026: estaban en el libro y faltaban.
  {
    id: "preterito-imperfecto",
    forms: ["mi"],
    type: "tense",
    meaning: "Pretérito imperfecto",
    page: 127,
    note: "Partícula átona «mi» unida al lexema.",
    examples: ["ajokó-mi", "añatõi-mi"],
    status: pending,
  },
  {
    id: "preterito-remoto",
    forms: ["raka'e"],
    type: "tense",
    meaning: "Pretérito remoto",
    page: 129,
    note: "Partícula átona «raka'e».",
    examples: ["akéraka'e", "añomíraka'e"],
    status: pending,
  },
  {
    id: "preterito-anterior",
    forms: ["ra'e"],
    type: "tense",
    meaning: "Pretérito anterior",
    page: 129,
    examplesPage: 131,
    note: "Partícula átona «ra'e».",
    examples: ["akáira'e", "akañýra'e"],
    status: pending,
  },
  {
    id: "futuro-proximo",
    forms: ["pota", "mbota"],
    type: "tense",
    meaning: "Futuro próximo",
    page: 133,
    examplesPage: 135,
    note: "Partículas tónicas «pota» para verbos orales y «mbota» para verbos nasales, por armonización nasal.",
    examples: ["ajahupota", "asẽmbota"],
    status: pending,
  },
  {
    id: "futuro-dudoso",
    forms: ["ne"],
    type: "tense",
    meaning: "Futuro dudoso",
    page: 135,
    note: "Partícula átona «ne».",
    examples: ["ajohéine", "ambyatyrõne"],
    status: pending,
  },
];

/**
 * Aspecto (págs. 135–137): «ína» (imperfectivo) e «ikóni» (intermitente), con la forma de cada
 * persona que muestra la tabla de la pág. 137. Pueden ir después de una partícula de tiempo
 * («Aguatava'erã'aína», «oñe'ẽnehikóni»).
 */
const ASPECT_TABLE: [Person, string, string][] = [
  ["1sg", "'aína", "'aikóni"],
  ["2sg", "reína", "reikóni"],
  ["3", "hína", "hikóni"],
  ["1pl_incl", "ñaína", "ñaikóni"],
  ["1pl_excl", "roína", "roikóni"],
  ["2pl", "peína", "peikóni"],
];

export const ASPECT_SUFFIXES: SuffixRule[] = ASPECT_TABLE.flatMap(([person, ina, ikoni]) => [
  {
    id: `aspecto-imperfectivo-${person}`,
    forms: [ina],
    type: "aspect" as const,
    meaning: "Aspecto imperfectivo",
    page: 135,
    examplesPage: 137,
    note: "Partícula «ína»; con la 1.ª plural usa «ña» en vez de «ja» (pág. 137).",
    examples: [],
    person,
    status: pending,
  },
  {
    id: `aspecto-intermitente-${person}`,
    forms: [ikoni],
    type: "aspect" as const,
    meaning: "Aspecto intermitente",
    page: 135,
    examplesPage: 137,
    note: "Partícula «ikóni».",
    examples: [],
    person,
    status: pending,
  },
]);

/**
 * Modos indicativos (págs. 139–173). El modo indicativo simple no lleva partícula (pág. 139).
 * Cada ejemplo es una forma literal del libro; cuando una fila de la tabla no sigue el patrón
 * de las demás, se anota en `bookObservation` para preguntar a los especialistas, sin corregirla.
 */
const mood = (r: Omit<SuffixRule, "type" | "status">): SuffixRule => ({ ...r, type: "mood", status: pending });

export const MOOD_SUFFIXES: SuffixRule[] = [
  mood({ id: "modo-volitivo", forms: ["se"], meaning: "Modo volitivo", page: 139, examples: ["aguapyse", "apu'ãse"], note: "Partícula sufija tónica «se»." }),
  mood({ id: "modo-supositivo", forms: ["nipo", "pipo", "po"], meaning: "Modo supositivo", page: 141, examples: ["aguerúnipo", "apyrũnipo"], note: "Partículas átonas «po», «nipo», «pipo»." }),
  mood({ id: "modo-conjetural", forms: ["ramo", "rõ"], meaning: "Modo conjetural", page: 141, examples: ["akuerárõ", "asẽrõ", "akueráramo", "asẽramo"], note: "Partículas átonas «rõ» o «ramo»." }),
  mood({
    id: "modo-habitual", forms: ["va"], meaning: "Modo habitual", page: 143, examples: ["oguerúva", "ombo'éva"], note: "Partícula átona «va».",
    bookObservation: "En la tabla de la pág. 143 la fila «Che» dice «reguerúva / rembo'éva», igual que la fila «Nde».",
  }),
  mood({ id: "modo-totalitativo", forms: ["pa", "mba"], meaning: "Modo totalitativo", page: 143, examples: ["ajapopa", "amoĩmba"], note: "Partículas tónicas «pa» para verbos orales y «mba» para verbos nasales." }),
  mood({ id: "modo-cuasiaccional", forms: ["vy", "ngy"], meaning: "Modo cuasiaccional", page: 143, examplesPage: 145, examples: ["akevy", "ambyasyvy", "ahechangy"], note: "Partícula tónica «vy» y su homorgánica «ngy» (ejemplo «ahechangy» en la pág. 143)." }),
  mood({ id: "modo-mediativo", forms: ["uka"], meaning: "Modo mediativo", page: 145, examples: ["ajapouka", "amyatyrõuka"], note: "La acción se realiza a través de otra persona. Partícula tónica «uka»." }),
  mood({ id: "modo-locativo", forms: ["ha"], meaning: "Modo locativo", page: 145, examplesPage: 147, examples: ["ajekoha", "añomiha"], note: "Lugar de la acción. Partícula tónica «ha»." }),
  mood({ id: "modo-concomitante", forms: ["vo"], meaning: "Modo concomitante", page: 147, examples: ["ahechávo", "amañávo"], note: "Simultaneidad de la acción. Partícula átona «vo»." }),
  mood({ id: "modo-proximal", forms: ["nunga"], meaning: "Modo proximal", page: 147, examplesPage: 149, examples: ["ajeinunga", "ambyasynunga"], note: "Acción medianamente realizada. Partícula tónica «nunga»." }),
  mood({ id: "modo-colectivo", forms: ["joa"], meaning: "Modo colectivo", page: 149, examples: ["javy'ajoa", "ñañembo'yjoa"], note: "Partícula tónica «joa»; se conjuga en plural.", pluralOnly: true }),
  mood({
    id: "modo-narrativo-verosimil", forms: ["niko", "ningo", "ko"], meaning: "Modo narrativo verosímil", page: 149, examplesPage: 151, examples: ["ajoguániko", "rembo'éningo"], note: "Partículas átonas «niko», «ningo» o «ko».",
    bookObservation: "En la tabla de la pág. 151 la fila «Che» del verbo nasal dice «amb'eningo»; las demás filas dicen «-mbo'éningo».",
  }),
  mood({ id: "modo-narrativo-inverosimil", forms: ["ndaje", "je"], meaning: "Modo narrativo inverosímil", page: 151, examples: ["ajavýndaje", "amoĩndaje"], note: "Partícula «ndaje» o su apócope «je» (átona)." }),
  mood({ id: "modo-anhelativo", forms: ["nga'u"], meaning: "Modo anhelativo", page: 151, examplesPage: 153, examples: ["akueránga'u", "amongakuaánga'u"], note: "Partícula átona «nga'u»." }),
  mood({ id: "modo-aparencial", forms: ["gua'u"], meaning: "Modo aparencial", page: 153, examples: ["ajevygua'u", "amoñe'ẽgua'u"], note: "La acción solo se realiza en apariencia. Partícula tónica «gua'u»." }),
  mood({ id: "modo-pietativo", forms: ["'anga", "anga"], meaning: "Modo pietativo", page: 153, examplesPage: 155, examples: ["ahejá'anga", "añenó'anga"], note: "Partícula átona «anga»; en los ejemplos aparece con puso." }),
  mood({ id: "modo-frecuentativo", forms: ["mante"], meaning: "Modo frecuentativo", page: 155, examples: ["ajeimante", "akirirĩmante"], note: "Partícula tónica «mante»." }),
  mood({ id: "modo-frecuentativo-enfatico", forms: ["manterei"], meaning: "Modo frecuentativo enfático", page: 155, examplesPage: 157, examples: ["aku'emanterei", "asẽmanterei"], note: "Partícula tónica «manterei»." }),
  mood({ id: "modo-frustrativo", forms: ["rei"], meaning: "Modo frustrativo", page: 157, examples: ["akyhyjerei", "añohẽrei"], note: "Inutilidad de la acción. Partícula tónica «rei»." }),
  mood({ id: "modo-intencional", forms: ["mo'ã"], meaning: "Modo intencional", page: 157, examplesPage: 159, examples: ["ajerokymo'ã", "amyimo'ã"], note: "Intención que no se realizó. Partícula tónica «mo'ã»." }),
  mood({
    id: "modo-antelativo", forms: ["jepe"], meaning: "Modo antelativo", page: 159, examples: ["ajerurejepe", "ame'ẽjepe"], note: "Acción realizada en forma previa. Partícula tónica «jepe».",
    bookObservation: "En la tabla de la pág. 159 la fila «Peẽ» del verbo oral dice «peerurejepe»; las demás filas dicen «-jerurejepe».",
  }),
  mood({ id: "modo-condicional", forms: ["mo"], meaning: "Modo condicional", page: 159, examplesPage: 161, examples: ["ahejámo", "añotỹmo"], note: "Lo que hubiera sido hecho. Partícula átona «mo»." }),
  mood({ id: "modo-aseverativo", forms: ["ma"], meaning: "Modo aseverativo", page: 161, examples: ["aguerúma", "añenóma"], note: "Partícula átona «ma»." }),
  mood({ id: "modo-inmotivado", forms: ["nte"], meaning: "Modo inmotivado", page: 161, examplesPage: 163, examples: ["apytu'únte", "ambotýnte"], note: "Acción sin motivo consciente. Partícula átona «nte»." }),
  mood({ id: "modo-usual", forms: ["jepi"], meaning: "Modo usual", page: 163, examples: ["aguatájepi", "amboguéjepi"], note: "Acción acostumbrada. Partícula átona «jepi»." }),
  mood({
    id: "modo-confirmativo", forms: ["katu", "ngatu"], meaning: "Modo confirmativo", page: 163, examplesPage: 165, examples: ["ahákatu", "añe'ẽngatu"], note: "Partícula átona «katu» para verbos orales y «ngatu» para verbos nasales.",
    bookObservation: "En la tabla de la pág. 165 la fila «Ore» del verbo oral dice «rehókatu», igual que la fila «Nde».",
  }),
  mood({ id: "modo-intermitente", forms: ["mimi"], meaning: "Modo intermitente", page: 165, examples: ["ahupytymimi", "aha'ãmimi"], note: "Acción con breves intervalos. Partícula tónica «mimi»." }),
  mood({ id: "modo-reiterativo", forms: ["jey"], meaning: "Modo reiterativo", page: 171, examplesPage: 173, examples: ["ajujey", "añenojey"], note: "Acción reiterativa. Partícula tónica «jey»." }),
];

/**
 * Modos imperativos (págs. 165–171). Solo se analizan con los prefijos imperativos y
 * optativos de la pág. 165 (ver imperative-rules.ts). El imperativo simple no lleva partícula.
 */
export const IMPERATIVE_MOOD_SUFFIXES: SuffixRule[] = [
  mood({ id: "imperativo-conminativo", forms: ["ke"], meaning: "Modo imperativo conminativo", page: 167, examples: ["tapytáke", "tamono'õke"], note: "Orden o mandato. Partícula átona «ke»." }),
  mood({ id: "imperativo-rogativo", forms: ["na"], meaning: "Modo imperativo rogativo", page: 167, examplesPage: 169, examples: ["tahejána", "tañomína"], note: "Ruego. Partícula átona «na»." }),
  mood({ id: "imperativo-amistoso", forms: ["mi"], meaning: "Modo imperativo amistoso", page: 169, examples: ["tajoguami", "tamombaymi"], note: "Pedido amable. Partícula tónica «mi»." }),
  mood({ id: "imperativo-compuesto", forms: ["míkena"], meaning: "Modo imperativo compuesto", page: 169, examplesPage: 171, examples: ["tapytamíkena", "tambyatymíkena"], note: "Enfatiza el pedido. Partícula tónica «míkena»." }),
  mood({ id: "imperativo-indeterminado", forms: ["mba'e"], meaning: "Modo indeterminado", page: 171, examples: ["tahekýimba'e", "tamoĩmba'e"], note: "Partícula átona «mba'e»." }),
];

/**
 * Grados del verbo (págs. 173–177). El grado positivo no lleva partícula (pág. 173).
 * El comparativo de igualdad «icha» va unido al sustantivo, no al verbo (pág. 173): no se carga.
 */
const grade = (r: Omit<SuffixRule, "type" | "status">): SuffixRule => ({ ...r, type: "grade", status: pending });

export const GRADE_SUFFIXES: SuffixRule[] = [
  grade({ id: "grado-comparativo-superioridad", forms: ["ve"], meaning: "Grado comparativo de superioridad", page: 173, examplesPage: 175, examples: ["amba'apove", "oñe'ẽve"], note: "Partícula tónica «ve»; el segundo elemento lleva la posposición átona «gui»." }),
  grade({ id: "grado-comparativo-inferioridad", forms: ["'ive"], meaning: "Grado comparativo de inferioridad", page: 175, examples: ["ajaty'ive", "ombopu'ive"], note: "Partícula tónica «'ive»; el segundo elemento lleva «gui»." }),
  grade({ id: "grado-superlativo-absoluto", forms: ["ite", "ete", "te"], meaning: "Grado superlativo absoluto", page: 175, examples: ["ajasuruete", "pejekoite"], note: "«ite» si el verbo termina en vocal abierta, «ete» en vocal cerrada y «te» si termina en «e»." }),
  grade({ id: "grado-supersuperlativo", forms: ["eterei", "iterei"], meaning: "Grado supersuperlativo", page: 175, examplesPage: 177, examples: ["omyakỹeterei", "rejehe'aiterei"], note: "Partículas tónicas «eterei» (vocales débiles) e «iterei» (vocales fuertes)." }),
  grade({ id: "grado-superlativisimo", forms: ["rasa"], meaning: "Grado superlativísimo", page: 177, examples: ["pepitarasa", "omohe'õrasa"], note: "Partícula tónica «rasa»." }),
  grade({ id: "grado-ultrasuperlativo", forms: ["etereirasa", "itereirasa"], meaning: "Grado ultrasuperlativo", page: 177, examples: ["omomorãitereirasa"], note: "Partículas tónicas «etereirasa» / «itereirasa»." }),
  grade({ id: "grado-superlativo-relativo", forms: ["eteve", "iteve"], meaning: "Grado superlativo relativo", page: 177, examples: ["ijaguaraiteve", "iñarandueteve"], note: "Partículas «eteve» / «iteve»; el segundo elemento lleva «gui». Los ejemplos del libro llevan los prefijos predicativos i- / iñ- (pág. 101)." }),
];

/**
 * Orden de trabajo del analizador: raíz + (modo o grado) + tiempo + negación.
 * El libro muestra cada partícula unida al lexema, pero no fija en estas páginas
 * el orden cuando se combinan: este orden queda pendiente de confirmación de los especialistas.
 */
export const SUFFIX_ORDER = {
  status: pending,
  order: ["mood", "tense", "aspect"] as const,
  /** Partículas de modo o grado antes del tiempo. */
  maxMoods: 2,
  maxTenses: 1,
  /** El aspecto va después del tiempo (pág. 137: «Aguatava'erã'aína»). */
  maxAspects: 1,
};

export const ALL_SUFFIX_RULES: SuffixRule[] = [...TENSE_SUFFIXES, ...ASPECT_SUFFIXES, ...MOOD_SUFFIXES, ...IMPERATIVE_MOOD_SUFFIXES, ...GRADE_SUFFIXES];
