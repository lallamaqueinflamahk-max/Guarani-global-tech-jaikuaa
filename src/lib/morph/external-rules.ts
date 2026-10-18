/**
 * Segunda fuente, marcada como externa: Bruno Estigarribia, «A Grammar of Paraguayan Guarani»,
 * UCL Press, 2020 — licencia Creative Commons Atribución 4.0 (CC BY 4.0).
 *
 * Se usa SOLO para lo que la Gramática ALG 2020 no lista o no decide: partículas del apéndice
 * 17.3 (págs. 309–312) que el libro de la Academia no trae como regla, y las raíces relacionales
 * t-/r-/h- del apéndice 17.5 (págs. 315–318), de las que el libro de la Academia lista solo cuatro
 * triformes. La autoridad sigue siendo la Academia: toda lectura que use una pieza de aquí se
 * muestra como «fuente académica externa» y queda pendiente de los especialistas.
 */
import type { ExternalSource, RuleStatus } from "./academia-rules";
import type { NominalCondition, NominalSuffixRule, NominalSuffixType } from "./nominal-rules";

export const ESTIGARRIBIA = (page: number): ExternalSource => ({ book: "Estigarribia 2020", page, license: "CC BY 4.0" });

const pending: RuleStatus = "pending_validation";

const x = (
  id: string,
  type: NominalSuffixType,
  form: string,
  meaning: string,
  page: number,
  condition: NominalCondition = "ninguna",
  note?: string,
): NominalSuffixRule => ({ id: `ext-${id}`, type, form, meaning, condition, examples: [], note, status: pending, source: ESTIGARRIBIA(page) });

/** Apéndice 17.3 (págs. 309–311): partículas que no figuran como regla en la Gramática ALG. */
export const EXTERNAL_SUFFIXES: NominalSuffixRule[] = [
  x("diminutivo-i", "derivativo", "'i", "diminutivo", 310),
  x("diminutivo-mi", "derivativo", "mi", "diminutivo", 309),
  x("privativo-y", "derivativo", "'ỹ", "sin, carente de", 310),
  x("privativo-yre", "derivativo", "'ỹre", "sin, carente de", 310),
  x("agentivo-hara", "derivativo", "hára", "el que hace (agente)", 309),
  x("agentivo-hara-futuro", "derivativo", "harã", "el que hará (agente futuro)", 309),
  x("agentivo-hare", "derivativo", "hare", "el que hizo (agente pasado)", 309),
  x("pasivo-py", "derivativo", "py", "lo que es objeto de la acción", 310, "raiz-oral"),
  x("pasivo-mby", "derivativo", "mby", "lo que es objeto de la acción", 310, "raiz-nasal"),
  x("pasivo-pyre", "derivativo", "pyre", "lo que fue objeto de la acción", 310, "raiz-oral"),
  x("pasivo-mbyre", "derivativo", "mbyre", "lo que fue objeto de la acción", 310, "raiz-nasal"),
  x("pasivo-pyra", "derivativo", "pyrã", "lo que será objeto de la acción", 310, "raiz-oral"),
  x("pasivo-mbyra", "derivativo", "mbyrã", "lo que será objeto de la acción", 310, "raiz-nasal"),
  x("posesion-exclusiva-tee", "derivativo", "tee", "posesión exclusiva, propio", 310),
  x("colectivo-ty", "plural", "ty", "plural colectivo (lugar donde abunda)", 310, "raiz-oral", "La Gramática ALG da los ejemplos «pakovaty» y «ñanandy» (pág. 51)."),
  x("colectivo-ndy", "plural", "ndy", "plural colectivo (lugar donde abunda)", 310, "raiz-nasal", "La Gramática ALG da los ejemplos «pakovaty» y «ñanandy» (pág. 51)."),
  x("enfatico-ngo", "enclitico", "ngo", "enfático (forma breve de «ningo»)", 311, "ninguna", "La Gramática ALG trae «niko», «ningo», «ko» como modo narrativo verosímil (pág. 149)."),
  x("enfatico-ko", "enclitico", "ko", "enfático (forma breve de «niko»)", 311),
  x("interrogativo-nimbo", "enclitico", "nimbo", "interrogativo dubitativo", 311),
  x("posp-guype", "posposicion", "guýpe", "debajo de", 311),
  x("posp-ygua", "posposicion", "ygua", "de (procedencia), con «y» de enlace", 311, "ninguna", "La Gramática ALG trae «gua» (pág. 207)."),
];

/**
 * Apéndice 17.5 (págs. 315–318): raíces relacionales con el patrón t-/r-/h- (o, si empiezan con
 * «o», ∅-/r-/h-). La lista del autor «no es exhaustiva». Se excluyen tajýra, ta'ýra y túva porque
 * tienen formas irregulares (rajy, ra'y, ru) que ya lista la Gramática ALG (pág. 51).
 */
export const RELATIONAL_ROOTS: { status: RuleStatus; source: ExternalSource; pages: [number, number]; roots: string[] } = {
  status: pending,
  source: ESTIGARRIBIA(315),
  pages: [315, 318],
  roots: [
    "óga", "okẽ", "ovetã", "ta'anga", "ta'arõ", "ta'ã", "tague", "tai", "tái", "tãimbíra", "tãimbiti", "tãitarara", "taity",
    "takã", "tako", "taku", "takua", "takuãi", "takuvo", "takuvy", "tañyka", "tape", "tapo", "tapy", "tapykue", "tapypa'ũ",
    "tasa", "tasẽ", "taso", "tasy", "tata", "tatatĩ", "tatypy", "taviju", "tayhu", "ta'ỹi", "techa", "techagi", "techakuaa",
    "techambi", "techaramo", "techavoi", "teindy", "teja", "teka", "teko", "tekove", "tekovia", "tekua", "tekuaty", "tekýi",
    "tembe", "tembiporu", "tembi'u", "tembo", "temby", "temiandu", "tenda", "tendu", "tendy", "tendysyry", "tendyva",
    "tenimbe", "tenimbo", "tenói", "tenonde", "tenyhẽ", "tenymy'a", "tenypy'ã", "teñói", "te'o", "te'õ", "te'ongue", "tepy",
    "téra", "tero", "tesa", "tesãi", "tesapara", "tesape", "tesarái", "teta", "tetã", "tete", "tetia'e", "tetũ", "tetyma",
    "tevi", "teviro'o", "te'ỹi", "togue", "toky", "tope", "topea", "topehýi", "topepi", "tory", "tova", "továi", "tovaja",
    "tovasa", "tovy", "to'o", "to'y", "to'ysã", "tu'ã", "tuguy", "tumby", "tupa", "tupã", "tupi'a", "tuvicha", "ty'ái",
    "tye", "tyjúi", "tykue", "tymba",
  ],
};

/** Formas r-/h- de cada raíz relacional → su forma absoluta. */
export function relationalForms(): Map<string, { absolute: string; prefix: "r" | "h" }> {
  const out = new Map<string, { absolute: string; prefix: "r" | "h" }>();
  for (const root of RELATIONAL_ROOTS.roots) {
    const rest = root.startsWith("t") ? root.slice(1) : root;
    out.set(`r${rest}`, { absolute: root, prefix: "r" });
    out.set(`h${rest}`, { absolute: root, prefix: "h" });
  }
  return out;
}
