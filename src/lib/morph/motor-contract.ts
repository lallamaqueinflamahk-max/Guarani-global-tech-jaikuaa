/**
 * Contrato entre Jaikuaa y el motor HFST/LEXC de Alan (versión 1.0).
 * Especificación completa y ejemplos: docs/motor/contrato-motores.md.
 *
 * Reglas del contrato:
 * - El motor solo ANALIZA palabras escritas: no genera, traduce ni corrige guaraní.
 * - Devuelve TODAS las lecturas en el orden del transductor; no elige una si no hay evidencia.
 * - No inventa pesos ni porcentajes: `peso` es null si el transductor no da un peso comparable.
 * - Cada lectura queda pendiente de validación docente.
 *
 * Este archivo valida lo que llega del servicio (nada se da por bueno sin revisar su forma) y lo
 * compara con las lecturas del Laboratorio.
 */
import type { Person } from "./academia-rules";

export const CONTRACT_VERSION = "1.0";

export const PERSONS: readonly Person[] = ["1sg", "2sg", "3", "1pl_incl", "1pl_excl", "2pl"];

export type ReadingStatus = "sin_analisis" | "una_lectura" | "sin_resolver" | "resuelta";

export interface MorphPiece {
  /** La forma tal como aparece en la palabra («nd», «o», «kuri»). */
  forma: string;
  /** Qué marca: persona, negacion, voz, tiempo, aspecto, modo, grado, posesivo, plural, otro. */
  rasgo: string;
  /** Valor del rasgo cuando corresponde (p. ej. persona «3»). */
  valor?: string;
}

export interface MotorReading {
  raiz: string;
  lema: string | null;
  categoria: string | null;
  persona: Person | null;
  negacion: boolean;
  prefijos: MorphPiece[];
  sufijos: MorphPiece[];
  /** Salida textual del transductor, tal cual (para auditar). */
  analisis_crudo: string;
  /** Orden en que el transductor la entregó (1 = primera). No es probabilidad. */
  rango: number;
  /** Peso del transductor si lo hay y es comparable; si no, null. */
  peso: number | null;
  /** Páginas de la Gramática ALG 2020 de las reglas usadas, si el motor las conoce. */
  paginas: number[];
  procedencia: string;
}

export interface MotorToken {
  superficie: string;
  normalizada: string;
  lecturas: MotorReading[];
  seleccion: number | null;
  estado: ReadingStatus;
  metodo: string | null;
}

export interface MotorResponse {
  version_contrato: string;
  motor: { nombre: string; version: string; transductor: string | null };
  tokens: MotorToken[];
}

export type ParseResult = { ok: true; value: MotorResponse } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === "string";
const optStr = (v: unknown) => (str(v) ? v : null);

function parsePieces(v: unknown, where: string): MorphPiece[] | string {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) return `${where} debe ser una lista`;
  const out: MorphPiece[] = [];
  for (const [i, p] of v.entries()) {
    if (!isObj(p) || !str(p.forma) || !str(p.rasgo)) return `${where}[${i}] necesita «forma» y «rasgo»`;
    out.push({ forma: p.forma, rasgo: p.rasgo, ...(str(p.valor) ? { valor: p.valor } : {}) });
  }
  return out;
}

function parseReading(v: unknown, where: string, index: number): MotorReading | string {
  if (!isObj(v)) return `${where} debe ser un objeto`;
  if (!str(v.raiz) || !v.raiz.trim()) return `${where}.raiz falta`;
  if (!str(v.analisis_crudo)) return `${where}.analisis_crudo falta (la salida del transductor, tal cual)`;
  const persona = v.persona === null || v.persona === undefined ? null : v.persona;
  if (persona !== null && !PERSONS.includes(persona as Person)) return `${where}.persona «${String(persona)}» no es una de ${PERSONS.join(", ")}`;
  if (v.peso !== undefined && v.peso !== null && (typeof v.peso !== "number" || !Number.isFinite(v.peso))) return `${where}.peso debe ser un número o null`;
  const prefijos = parsePieces(v.prefijos, `${where}.prefijos`);
  if (typeof prefijos === "string") return prefijos;
  const sufijos = parsePieces(v.sufijos, `${where}.sufijos`);
  if (typeof sufijos === "string") return sufijos;
  const paginas = Array.isArray(v.paginas) ? v.paginas.filter((p): p is number => Number.isInteger(p)) : [];
  return {
    raiz: v.raiz,
    lema: optStr(v.lema),
    categoria: optStr(v.categoria),
    persona: persona as Person | null,
    negacion: v.negacion === true,
    prefijos,
    sufijos,
    analisis_crudo: v.analisis_crudo,
    rango: Number.isInteger(v.rango) ? (v.rango as number) : index + 1,
    peso: typeof v.peso === "number" ? v.peso : null,
    paginas,
    procedencia: str(v.procedencia) ? v.procedencia : "hfst",
  };
}

const STATUSES: ReadingStatus[] = ["sin_analisis", "una_lectura", "sin_resolver", "resuelta"];

/**
 * Valida la respuesta del servicio. Acepta el sobre de Alan ({success, message, data, timestamp})
 * o directamente el contenido de `data`.
 */
export function parseMotorResponse(body: unknown): ParseResult {
  let data: unknown = body;
  if (isObj(body) && "success" in body) {
    if (body.success !== true) return { ok: false, error: str(body.message) && body.message ? body.message : "El motor respondió con error" };
    data = body.data;
  }
  if (!isObj(data)) return { ok: false, error: "Falta «data»" };
  if (!str(data.version_contrato)) return { ok: false, error: "Falta «version_contrato»" };
  if (data.version_contrato.split(".")[0] !== CONTRACT_VERSION.split(".")[0]) {
    return { ok: false, error: `Versión de contrato ${data.version_contrato}; Jaikuaa espera ${CONTRACT_VERSION}` };
  }
  const motor = isObj(data.motor) ? data.motor : {};
  if (!Array.isArray(data.tokens)) return { ok: false, error: "«tokens» debe ser una lista" };
  const tokens: MotorToken[] = [];
  for (const [i, t] of data.tokens.entries()) {
    const where = `tokens[${i}]`;
    if (!isObj(t) || !str(t.superficie)) return { ok: false, error: `${where}.superficie falta` };
    if (!Array.isArray(t.lecturas)) return { ok: false, error: `${where}.lecturas debe ser una lista (vacía si no hay análisis)` };
    const lecturas: MotorReading[] = [];
    for (const [j, r] of t.lecturas.entries()) {
      const parsed = parseReading(r, `${where}.lecturas[${j}]`, j);
      if (typeof parsed === "string") return { ok: false, error: parsed };
      lecturas.push(parsed);
    }
    const seleccion = Number.isInteger(t.seleccion) && (t.seleccion as number) >= 0 && (t.seleccion as number) < lecturas.length ? (t.seleccion as number) : null;
    const declared = STATUSES.includes(t.estado as ReadingStatus) ? (t.estado as ReadingStatus) : null;
    // El estado tiene que ser coherente con las lecturas: si no, se calcula.
    const estado: ReadingStatus =
      lecturas.length === 0 ? "sin_analisis" : lecturas.length === 1 ? "una_lectura" : seleccion !== null && declared === "resuelta" ? "resuelta" : "sin_resolver";
    tokens.push({
      superficie: t.superficie,
      normalizada: str(t.normalizada) ? t.normalizada : t.superficie,
      lecturas,
      seleccion: estado === "resuelta" ? seleccion : null,
      estado,
      metodo: optStr(t.metodo),
    });
  }
  return {
    ok: true,
    value: {
      version_contrato: data.version_contrato,
      motor: { nombre: str(motor.nombre) ? motor.nombre : "motor HFST", version: str(motor.version) ? motor.version : "?", transductor: optStr(motor.transductor) },
      tokens,
    },
  };
}

/** Lectura del Laboratorio reducida a lo que se compara. */
export interface LabReadingKey {
  person: Person | null;
  root: string;
  suffixes: string[];
}

const bare = (s: string) => s.normalize("NFD").replace(/́/g, "").normalize("NFC").toLowerCase();
const keyOf = (person: Person | null, root: string, suffixes: string[]) => `${person ?? ""}|${bare(root)}|${suffixes.map(bare).join("+")}`;

/** ¿Alguna lectura del motor HFST coincide (persona, raíz sin acento, sufijos) con esta del Laboratorio? */
export function matchesLab(reading: MotorReading, lab: LabReadingKey[]): boolean {
  const k = keyOf(reading.persona, reading.raiz, reading.sufijos.map((s) => s.forma));
  return lab.some((l) => keyOf(l.person, l.root, l.suffixes) === k);
}
