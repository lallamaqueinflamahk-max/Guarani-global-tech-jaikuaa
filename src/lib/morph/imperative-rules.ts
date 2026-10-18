/**
 * Prefijos del modo imperativo y de la conjugación optativa — transcripción de
 * "Guarani Ñe'ẽtekuaa / Gramática Guaraní", Academia de la Lengua Guaraní, 2020, pág. 165.
 *
 * El libro dice: "se conjuga con partículas imperativas o compulsivas de número y persona:
 * e / pe, para la segunda persona del singular y plural; así como las partículas de la
 * conjugación optativa; ta / tere / to / taja / taña, toro, tape, to, para las demás personas".
 *
 * Los ejemplos del libro (págs. 167–171) usan la serie optativa: tagueraha, teregueraha,
 * togueraha, tajagueraha, torogueraha, tapegueraha.
 * Todo queda "pending_validation" hasta la ficha de regla de los especialistas.
 */
import type { Person, RuleStatus } from "./academia-rules";

export const IMPERATIVE_PREFIXES: {
  status: RuleStatus;
  source: { book: "Gramática Guaraní ALG 2020"; page: number };
  prefixes: Record<Person, string[]>;
} = {
  status: "pending_validation",
  source: { book: "Gramática Guaraní ALG 2020", page: 165 },
  prefixes: {
    "1sg": ["ta"],
    "2sg": ["e", "tere"],
    "3": ["to"],
    "1pl_incl": ["taja", "taña"],
    "1pl_excl": ["toro"],
    "2pl": ["pe", "tape"],
  },
};
