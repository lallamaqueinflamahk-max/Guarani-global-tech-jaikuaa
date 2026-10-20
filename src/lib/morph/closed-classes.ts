/**
 * Palabras de clase cerrada — transcripción literal de "Guarani Ñe'ẽtekuaa / Gramática Guaraní",
 * Academia de la Lengua Guaraní, 2020: adjetivos determinativos (págs. 73–81), adverbios
 * (págs. 179–185), pronombres (págs. 185–197), conjunciones (pág. 199) e interjecciones (pág. 201).
 *
 * La glosa en castellano es la que imprime el libro. No se agrega ninguna palabra que el libro no
 * liste. Las formas que el libro imprime de dos maneras van las dos, con nota. Todo queda
 * "pending_validation".
 */
import type { Person, RuleStatus } from "./academia-rules";
import { normalizeWord } from "./analyzer";

export type ClosedClass =
  | "demostrativo-presencia"
  | "demostrativo-ausencia"
  | "numeral-cardinal"
  | "indefinido"
  | "adverbio-modo"
  | "adverbio-lugar"
  | "adverbio-tiempo"
  | "adverbio-cantidad"
  | "adverbio-interrogacion"
  | "adverbio-afirmacion"
  | "adverbio-negacion"
  | "pronombre-sujeto"
  | "pronombre-objeto-directo"
  | "pronombre-objeto-indirecto"
  | "pronombre-hegui"
  | "pronombre-rehe"
  | "pronombre-lugar"
  | "pronombre-compania"
  | "pronombre-demostrativo"
  | "pronombre-posesivo"
  | "pronombre-indefinido"
  | "conjuncion-copulativa"
  | "conjuncion-disyuntiva"
  | "conjuncion-causal"
  | "conjuncion-adversativa"
  | "interjeccion";

export const CLOSED_CLASS_LABEL: Record<ClosedClass, string> = {
  "demostrativo-presencia": "Adjetivo demostrativo de presencia",
  "demostrativo-ausencia": "Adjetivo demostrativo de ausencia",
  "numeral-cardinal": "Adjetivo numeral cardinal",
  indefinido: "Adjetivo determinativo indefinido",
  "adverbio-modo": "Adverbio de modo",
  "adverbio-lugar": "Adverbio de lugar",
  "adverbio-tiempo": "Adverbio de tiempo",
  "adverbio-cantidad": "Adverbio de cantidad",
  "adverbio-interrogacion": "Adverbio de interrogación",
  "adverbio-afirmacion": "Adverbio de afirmación",
  "adverbio-negacion": "Adverbio de negación",
  "pronombre-sujeto": "Pronombre personal como sujeto",
  "pronombre-objeto-directo": "Pronombre personal como complemento directo",
  "pronombre-objeto-indirecto": "Pronombre personal como complemento indirecto",
  "pronombre-hegui": "Pronombre personal con «hegui»",
  "pronombre-rehe": "Pronombre personal con «rehe»",
  "pronombre-lugar": "Pronombre como complemento de lugar",
  "pronombre-compania": "Pronombre como complemento de compañía",
  "pronombre-demostrativo": "Pronombre demostrativo",
  "pronombre-posesivo": "Pronombre posesivo",
  "pronombre-indefinido": "Pronombre indefinido",
  "conjuncion-copulativa": "Conjunción copulativa",
  "conjuncion-disyuntiva": "Conjunción disyuntiva",
  "conjuncion-causal": "Conjunción causal",
  "conjuncion-adversativa": "Conjunción adversativa",
  interjeccion: "Interjección",
};

export interface ClosedEntry {
  /** Tal como la imprime el libro, en minúsculas y con el puso como «'». Puede tener espacio. */
  form: string;
  cls: ClosedClass;
  /** Glosa en castellano impresa por el libro (vacía si el libro no la da). */
  gloss: string;
  page: number;
  person?: Person;
  number?: "singular" | "plural";
  note?: string;
}

const e = (
  cls: ClosedClass,
  page: number,
  items: [form: string, gloss: string, extra?: Partial<Pick<ClosedEntry, "person" | "number" | "note">>][],
): ClosedEntry[] => items.map(([form, gloss, extra]) => ({ form, cls, gloss, page, ...extra }));

export const CLOSED_CLASSES: { status: RuleStatus; source: { book: "Gramática Guaraní ALG 2020" }; entries: ClosedEntry[] } = {
  status: "pending_validation",
  source: { book: "Gramática Guaraní ALG 2020" },
  entries: [
    // Pág. 73: "Son Singulares: ko, pe. amo; y Plurales: Ã, ko'ã, umi".
    ...e("demostrativo-presencia", 73, [
      ["ko", "", { number: "singular" }],
      ["pe", "", { number: "singular" }],
      ["amo", "", { number: "singular" }],
      ["ã", "", { number: "plural" }],
      ["ko'ã", "", { number: "plural" }],
      ["umi", "", { number: "plural" }],
    ]),
    // Pág. 75: "Los Singulares son, upe, ako, aipo ku; y el plural es «umi»".
    ...e("demostrativo-ausencia", 75, [
      ["upe", "", { number: "singular" }],
      ["ako", "", { number: "singular" }],
      ["aipo", "", { number: "singular" }],
      ["ku", "", { number: "singular" }],
      ["umi", "", { number: "plural" }],
    ]),
    // Págs. 79 y 83: cardinales que aparecen en los ejemplos (el libro no da la serie completa aquí).
    ...e("numeral-cardinal", 79, [
      ["peteĩ", "", { note: "Ejemplos de las págs. 79 y 83." }],
      ["mokõi", ""],
      ["irundy", ""],
    ]),
    ...e("numeral-cardinal", 83, [["mbohapy", "", { note: "Pág. 83: «Mbohapy apyka»." }]]),
    // Págs. 79–81.
    ...e("indefinido", 79, [
      ["mayma", ""],
      ["oimeraẽ", "", { note: "Pág. 81." }],
      ["heta", "", { note: "Pág. 81." }],
    ]),
    // Pág. 179.
    ...e("adverbio-modo", 179, [
      ["porã", "bien"],
      ["vai", "mal"],
      ["mbegue", "despacio"],
      ["kóicha", "de este modo"],
      ["upéicha", "de ese modo"],
      ["péicha", "así"],
      ["amóicha", "de aquel modo"],
      ["asy", "muy, demasiado"],
    ]),
    // Pág. 179. «O)kápe» (afuera) no se carga: así está impreso; queda como observación.
    ...e("adverbio-lugar", 179, [
      ["ápe", "aquí"],
      ["upépe", "allí"],
      ["pépe", "allí", { note: "Variante de «upépe» que el libro da entre paréntesis." }],
      ["amo", "allá, allí"],
      ["mombyry", "lejos"],
      ["yvate", "arriba"],
      ["yvýpe", "en el suelo"],
      ["pýpe", "dentro de"],
    ]),
    // Pág. 181.
    ...e("adverbio-tiempo", 181, [
      ["voi", "pronto"],
      ["ág̃a", "ahora"],
      ["raẽ", "primeramente"],
      ["ramo", "si (condicional)"],
      ["gueteri", "aún, todavía"],
      ["rire", "luego"],
      ["márõ", "nunca, jamás"],
      ["mboyve", "antes"],
      ["upéi", "después"],
      ["upérõ", "entonces"],
      ["sapy'a", "de repente"],
      ["araka'eve", "nunca"],
      ["kuehe", "ayer"],
      ["ko'ẽrõ", "mañana"],
    ]),
    // Pág. 181.
    ...e("adverbio-cantidad", 181, [
      ["heta", "mucho"],
      ["mbovy", "poco"],
      ["mba'eve", "nada"],
      ["rasa", "excesivamente"],
      ["michĩ", "pequeño"],
      ["tuicha", "grande"],
      ["sa'i", "escaso"],
    ]),
    // Págs. 181–183. Pueden llevar las partículas sufijas «pa» o «piko» (átonas).
    ...e("adverbio-interrogacion", 181, [
      ["moõ", "dónde"],
      ["araka'e", "cuándo"],
      ["mba'éicha", "cómo"],
      ["mba'épa", "qué"],
      ["mba'ére", "por qué"],
      ["máva", "quién", { note: "Pág. 183." }],
      ["mboypiko", "cuánto", { note: "Pág. 183." }],
      ["mba'ẽrã", "para qué", { note: "Pág. 183." }],
    ]),
    // Pág. 183.
    ...e("adverbio-afirmacion", 183, [
      ["héẽ", "sí (afirmación simple)"],
      ["néi", "bueno, acepto"],
      ["ikatu", "puede ser"],
      ["upéicha", "así es"],
      ["avei", "sí, también"],
      ["oĩma", "de acuerdo"],
      ["añete", "es verdad"],
    ]),
    // Pág. 183. «Tove» puede ser afirmativo o negativo según el contexto (págs. 183–185).
    ...e("adverbio-negacion", 183, [
      ["nahániri", "no (negación simple)"],
      ["tove", "no (rechazo)", { note: "Pág. 185: se puede usar como afirmativo o negativo según el contexto." }],
      ["anichéne", "no (dudoso)"],
      ["ani", "no (prohibitivo)"],
      ["anive", "no (prohibitivo)"],
      ["mba'evéicharõ", "de ninguna manera"],
      ["araka'eve", "nunca, jamás"],
      ["ne'ĩrã", "todavía, aún no"],
    ]),
    // Pág. 187. El libro imprime «hikúai» en la lista y «hikuái» en el ejemplo: van las dos.
    ...e("pronombre-sujeto", 187, [
      ["che", "yo", { person: "1sg" }],
      ["nde", "tú, usted, vos", { person: "2sg" }],
      ["ha'e", "él, ella", { person: "3" }],
      ["ñande", "nosotros/as (incluyente)", { person: "1pl_incl" }],
      ["ore", "nosotros/as (excluyente)", { person: "1pl_excl" }],
      ["peẽ", "vosotros/as, ustedes", { person: "2pl" }],
      ["ha'ekuéra", "ellos, ellas", { person: "3", number: "plural" }],
      ["hikúai", "ellos, ellas", { person: "3", number: "plural", note: "Así en la lista de la pág. 187." }],
      ["hikuái", "ellos, ellas", { person: "3", number: "plural", note: "Así en el ejemplo de la pág. 187 («Ou hikuái»)." }],
    ]),
    // Págs. 187–189. «po» aparece aquí como 2.ª plural; en la pág. 103 se describe distinto (observación).
    ...e("pronombre-objeto-directo", 187, [
      ["che", "a mí", { person: "1sg" }],
      ["nde", "te, a ti, a vos", { person: "2sg" }],
      ["ne", "te, a ti, a vos", { person: "2sg" }],
      ["ro", "te, a ti, a vos", { person: "2sg" }],
      ["chupe", "", { person: "3" }],
      ["ichupe", "", { person: "3" }],
      ["ñande", "nos, a nosotros/as (incluyente)", { person: "1pl_incl" }],
      ["ñane", "nos, a nosotros/as (incluyente)", { person: "1pl_incl" }],
      ["ore", "nos, a nosotros/as (excluyente)", { person: "1pl_excl" }],
      ["pende", "a vosotros, a ustedes", { person: "2pl", note: "Pág. 189." }],
      ["po", "a vosotros, a ustedes", { person: "2pl", note: "Pág. 189. La pág. 103 lo describe de otra manera: pregunta para especialistas." }],
      ["pene", "a vosotros, a ustedes", { person: "2pl", note: "Pág. 189." }],
      ["chupekuéra", "a ellos/a ellas, les/los/las", { person: "3", number: "plural", note: "Pág. 189." }],
      ["ichupekuéra", "a ellos/a ellas, les/los/las", { person: "3", number: "plural", note: "Pág. 189." }],
    ]),
    // Pág. 189.
    ...e("pronombre-objeto-indirecto", 189, [
      ["chéve", "me, a mí", { person: "1sg" }],
      ["ndéve", "te, a ti", { person: "2sg" }],
      ["ichupe", "se, a él/a ella, le/la", { person: "3" }],
      ["chupe", "se, a él/a ella, le/la", { person: "3" }],
      ["ñandéve", "a nosotros/as, nos (incluyente)", { person: "1pl_incl" }],
      ["oréve", "a nosotros/as, nos (excluyente)", { person: "1pl_excl" }],
      ["peẽme", "a vosotros/as, a ustedes", { person: "2pl" }],
      ["ichupekuéra", "a ellos/as, les/las", { person: "3", number: "plural" }],
      ["chupekuéra", "a ellos/as, les/las", { person: "3", number: "plural" }],
    ]),
    // Pág. 191.
    ...e("pronombre-hegui", 191, [
      ["chehegui", "me, de mí", { person: "1sg" }],
      ["ndehegui", "te, de ti", { person: "2sg" }],
      ["ichugui", "le/lo, de él, de ella", { person: "3" }],
      ["ñandehegui", "nos (incluyente)", { person: "1pl_incl" }],
      ["orehegui", "nos (excluyente)", { person: "1pl_excl" }],
      ["pendehegui", "os, de vosotros/as", { person: "2pl" }],
      ["chuguikuéra", "les, de ellos", { person: "3", number: "plural" }],
      ["ichuguikuéra", "les, de ellos", { person: "3", number: "plural" }],
    ]),
    // Pág. 191.
    ...e("pronombre-rehe", 191, [
      ["cherehe", "me", { person: "1sg" }],
      ["nderehe", "te, de ti", { person: "2sg" }],
      ["ijehe", "se, de él/de ella", { person: "3" }],
      ["ñanderehe", "nos, de nosotros", { person: "1pl_incl" }],
      ["orerehe", "nos de nosotros", { person: "1pl_excl" }],
      ["penderehe", "os", { person: "2pl" }],
      ["ijehekuéra", "de ellos/de ellas", { person: "3", number: "plural" }],
    ]),
    // Pág. 193.
    ...e("pronombre-lugar", 193, [
      ["chepype", "en mí", { person: "1sg" }],
      ["ndepype", "en ti", { person: "2sg" }],
      ["ipype", "en él/en ella", { person: "3" }],
      ["ñandepype", "en nosotros (incluyente)", { person: "1pl_incl" }],
      ["orepype", "en nosotros (excluyente)", { person: "1pl_excl" }],
      ["pendepype", "en vosotros/as", { person: "2pl" }],
      ["ipypekuéra", "en ellos/en ellas", { person: "3", number: "plural" }],
    ]),
    // Pág. 193.
    ...e("pronombre-compania", 193, [
      ["chendive", "conmigo", { person: "1sg" }],
      ["nendive", "contigo", { person: "2sg" }],
      ["hendive", "consigo, con él/ella", { person: "3" }],
      ["ñanendive", "con nosotros/as (incluyente)", { person: "1pl_incl" }],
      ["orendive", "con nosotros/as (excluyente)", { person: "1pl_excl" }],
      ["penendive", "con vosotros/uds./vos", { person: "2pl" }],
      ["hendivekuéra", "con ustedes, con ellos/ellas", { person: "3", number: "plural" }],
    ]),
    // Pág. 195: "Utiliza la partícula «va»".
    ...e("pronombre-demostrativo", 195, [
      ["kóva", "este/a", { number: "singular" }],
      ["péva", "ese/a", { number: "singular" }],
      ["amóva", "aquel/lla", { number: "singular" }],
      ["upéva", "ese/esa, aquel/aquella (ausentes)", { number: "singular" }],
      ["aipóva", "ese/esa, aquel/aquella (ausentes)", { number: "singular" }],
      ["ko'ãva", "estos/as", { number: "plural" }],
      ["ãva", "estos/as", { number: "plural" }],
      ["umíva", "aquellos/as", { number: "plural" }],
    ]),
    // Págs. 195–197: "Utiliza partícula «mba'e»".
    ...e("pronombre-posesivo", 195, [
      ["chemba'e", "mío/a", { person: "1sg" }],
      ["nemba'e", "tuyo/a", { person: "2sg" }],
      ["imba'e", "suyo/a", { person: "3" }],
      ["ñanemba'e", "míos/as (incluyente)", { person: "1pl_incl" }],
      ["oremba'e", "míos/as (excluyente)", { person: "1pl_excl" }],
      ["penemba'e", "tuyos/as, vuestros/as", { person: "2pl", note: "Pág. 197." }],
      ["imba'ekuéra", "suyos/as, nuestros/as", { person: "3", number: "plural", note: "Pág. 197." }],
    ]),
    // Pág. 197: "Utilizan las partículas sufijas «va» o «ve»".
    ...e("pronombre-indefinido", 197, [
      ["opavave", "todo/a", { number: "singular" }],
      ["avave", "nadie", { number: "singular" }],
      ["avavete", "nadie", { number: "singular" }],
      ["mba'eve", "nada", { number: "singular" }],
      ["oimeraẽva", "cualquiera", { number: "singular" }],
      ["máva", "alguien", { number: "singular" }],
      ["ambuéva", "otro/a, él que/la que", { number: "singular" }],
      ["oiméva", "alguno", { number: "singular" }],
      ["maymáva", "todos/as", { number: "plural" }],
    ]),
    // Pág. 199.
    ...e("conjuncion-copulativa", 199, [
      ["ha", "y, e"],
      ["ha'e", "y, e"],
    ]),
    ...e("conjuncion-disyuntiva", 199, [
      ["térã", "o, u"],
      ["ỹrõ", "o, u"],
      ["ỹramo", "o, u"],
    ]),
    ...e("conjuncion-causal", 199, [
      ["ajeve", ""],
      ["upévare", ""],
      ["upeháre", ""],
    ]),
    ...e("conjuncion-adversativa", 199, [
      ["upéicharõ jepe", "pero"],
      ["jepéramo", "pero"],
    ]),
    // Pág. 201: interjecciones simples de los ejemplos.
    ...e("interjeccion", 201, [
      ["cháke", ""],
      ["e'a", ""],
      ["hýpy", ""],
      ["na'ápe", ""],
      ["nápy", ""],
      ["araka'e", ""],
    ]),
  ],
};

const stripAcute = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC");
const norm = (s: string) => normalizeWord(s);

const BY_FORM = new Map<string, ClosedEntry[]>();
const BY_BARE = new Map<string, ClosedEntry[]>();
for (const entry of CLOSED_CLASSES.entries) {
  const f = norm(entry.form);
  BY_FORM.set(f, [...(BY_FORM.get(f) ?? []), entry]);
  const b = stripAcute(f);
  BY_BARE.set(b, [...(BY_BARE.get(b) ?? []), entry]);
}

export interface ClosedMatch {
  entry: ClosedEntry;
  /** true si coincide solo sin mirar la tilde acentual (la palabra escrita tiene otra tilde). */
  accentDiffers: boolean;
}

/** Busca la palabra en las listas del libro. Primero tal cual; si no, sin mirar la tilde acentual. */
export function lookupClosed(word: string): ClosedMatch[] {
  const w = norm(word);
  const exact = BY_FORM.get(w);
  if (exact) return exact.map((entry) => ({ entry, accentDiffers: false }));
  return (BY_BARE.get(stripAcute(w)) ?? []).map((entry) => ({ entry, accentDiffers: true }));
}
