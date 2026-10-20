/**
 * Suite: calcos del castellano, capítulo 6 de la Gramática ALG 2020 (págs. 246–253).
 * Las frases probadas son las del propio libro (archivo de datos transcripto de esas páginas).
 */
import { describe, expect, it } from "vitest";
import data from "./data/gramatica-alg-2020-calcos.json";
import { buildCalcoIndex, sentenceTokens, type CalcoPair } from "./calcos";
import { checkText } from "./orthography";

const pairs = data.pares as CalcoPair[];
const idx = buildCalcoIndex(pairs);

describe("34. Pares del capítulo 6 (págs. 246–253)", () => {
  it("110 pares numerados del 1 al 110, cada uno con página par (calco) e impar (forma recomendada)", () => {
    expect(pairs.map((p) => p.n)).toEqual(Array.from({ length: 110 }, (_, i) => i + 1));
    for (const p of pairs) {
      expect(p.paginas[0] % 2).toBe(0);
      expect(p.paginas[1]).toBe(p.paginas[0] + 1);
      expect(p.correcta.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("n.º 90 (pág. 252): «g̃uarã» con la letra impresa, no el «§» del archivo digital", () => {
    expect(pairs[89]?.calco).toBe("Pojopy ndéve g̃uarã.");
  });

  it("n.º 31 (pág. 249): dos formas recomendadas, «Ndachevirúi» o «chesogue»", () => {
    expect(pairs[30]?.correcta).toEqual(["Ndachevirúi", "chesogue."]);
  });
});

describe("35. Detector de calcos", () => {
  it("reconoce los 110 calcos del libro como calco exacto de su propio número", () => {
    for (const p of pairs) {
      expect(idx.check(p.calco).some((m) => m.pair.n === p.n && m.kind === "calco" && m.how === "exacta")).toBe(true);
    }
  });

  it("reconoce las formas recomendadas y ninguna choca con un calco", () => {
    for (const p of pairs) {
      for (const c of p.correcta) {
        const m = idx.check(c);
        expect(m.some((x) => x.pair.n === p.n && x.kind === "recomendada")).toBe(true);
        expect(m.some((x) => x.kind === "calco" && x.how !== "parecida")).toBe(false);
      }
    }
  });

  it("n.º 1: sin signos y con otro apóstrofo sigue coincidiendo", () => {
    expect(idx.check("jajapóta peteĩ aty ko’ẽrõ")[0]).toMatchObject({ kind: "calco", how: "exacta", pair: { n: 1 } });
  });

  it("n.º 96 dentro de un texto más largo: «Ja'u terere» (pág. 252)", () => {
    expect(idx.check("Ko'ẽrõ ja'u terere").some((m) => m.pair.n === 96 && m.how === "contiene")).toBe(true);
  });

  it("una frase sin relación con el capítulo no da coincidencias", () => {
    expect(idx.check("Mitã oñemoaranduhína")).toEqual([]); // pág. 63
  });

  it("las palabras se normalizan igual que en el corrector", () => {
    expect(sentenceTokens("¡Ja’u terere!")).toEqual(["ja'u", "terere"]);
  });
});

describe("36. Ortografía de las frases del capítulo 6", () => {
  it("solo una frase da aviso de error: n.º 59 escribe «guaraní» con tilde final (la recomendada escribe «guarani»)", () => {
    const withErrors = pairs.flatMap((p) => [p.calco, ...p.correcta]).filter((s) => checkText(s).some((i) => i.severity === "error"));
    expect(withErrors).toEqual(["Ajapo guaraní rayhu rehegua mbo'e."]);
  });
});
