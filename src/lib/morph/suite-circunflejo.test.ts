/**
 * Suite: escritura vieja con circunflejo («morotî», «ñe'ê»).
 * Los pares salen del Wikcionario, que marca cada palabra como «circumflex-system spelling of …»
 * con su forma con tilde. Ninguna palabra fue escrita a mano para esta prueba.
 */
import { describe, expect, it } from "vitest";
import wik from "./data/wikcionario-gn.json";
import { CIRCUMFLEX_TO_TILDE, analyze, normalizeWord } from "./analyzer";
import { checkWord } from "./orthography";
import { buildWiktionaryIndex, type WiktionaryRaw } from "./wikcionario";

const raw = wik.entradas as WiktionaryRaw[];
const pairs = raw
  .map(([w, , g]) => ({ w, m: g[0]?.match(/^circumflex-system spelling of (.+)$/)?.[1] }))
  .filter((p): p is { w: string; m: string } => !!p.m);

describe("44. Vocales con circunflejo", () => {
  it("las seis vocales y la «ÿ» pasan a su vocal nasal con tilde", () => {
    expect(CIRCUMFLEX_TO_TILDE).toEqual({ "â": "ã", "ê": "ẽ", "î": "ĩ", "ô": "õ", "û": "ũ", "ŷ": "ỹ", "ÿ": "ỹ" });
    expect(normalizeWord("ÂÊÎÔÛŶ")).toBe("ãẽĩõũỹ");
  });

  it("los 29 pares del Wikcionario quedan iguales a su forma con tilde", () => {
    expect(pairs.length).toBe(29);
    for (const { w, m } of pairs) expect(normalizeWord(w)).toBe(normalizeWord(m));
  });

  it("no toca el acento agudo, la diéresis de préstamos ni el puso", () => {
    expect(normalizeWord("mbo'ehára")).toBe("mbo'ehára");
    expect(normalizeWord("ára")).toBe("ára");
    expect(normalizeWord("itaugüeño")).toBe("itaugüeño");
    expect(normalizeWord("mboʼehára")).toBe("mbo'ehára");
  });
});

describe("45. El motor lee igual las dos escrituras", () => {
  it("«moñe'ê» da las mismas lecturas que «moñe'ẽ»", () => {
    const a = analyze("moñe'ê").map((x) => `${x.person}|${x.root}`);
    const b = analyze("moñe'ẽ").map((x) => `${x.person}|${x.root}`);
    expect(a).toEqual(b);
  });

  it("el Wikcionario encuentra «ko'êrô» como «ko'ẽrõ»", () => {
    const idx = buildWiktionaryIndex(raw);
    expect(idx.lookup("ko'êrô").some((h) => h.entry.word === "ko'ẽrõ")).toBe(true);
  });

  it("la ortografía avisa (revisar) que la forma oficial usa tilde, sin marcarlo como error", () => {
    const issues = checkWord("morotî");
    expect(issues.some((i) => i.rule === "alfabeto" && i.severity === "revisar")).toBe(true);
    expect(issues.some((i) => i.severity === "error")).toBe(false);
    expect(checkWord("morotĩ")).toEqual([]);
  });
});
