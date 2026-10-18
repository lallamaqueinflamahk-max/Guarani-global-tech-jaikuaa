/**
 * Suite: diccionario monolingüe de la Academia de la Lengua Guaraní publicado por la SPL.
 * Solo entradas, abreviaturas y enlaces (las definiciones se leen en el sitio de la SPL).
 */
import { describe, expect, it } from "vitest";
import data from "./data/spl-diccionario-alg.json";
import { buildSplIndex, posLabel, splUrl, type SplRaw } from "./spl-dictionary";
import { attestRoot, rankByAttestation } from "./corpus-index";

const raw = data.entradas as SplRaw[];
const dict = buildSplIndex(raw);

describe("41. Archivo del diccionario: autoría, uso y forma", () => {
  it("cita a la Academia como autora y a la SPL como quien lo publica, y marca el uso interno", () => {
    expect(data.autoria).toContain("Academia de la Lengua Guaraní");
    expect(data.publica).toContain("Secretaría de Políticas Lingüísticas");
    expect(data.uso).toContain("Uso interno");
    expect(data.cambios).toContain("No se copian las definiciones");
  });

  it("2.104 entradas, cada una con su enlace a la página de la SPL y sin definiciones copiadas", () => {
    expect(raw).toHaveLength(2104);
    for (const e of raw) {
      expect(/^\d\d#e\d+$/.test(e[2])).toBe(true);
      expect(e[0].length < 60).toBe(true);
    }
  });

  it("el enlace lleva a la entrada exacta", () => {
    expect(splUrl("01#e160")).toBe("https://spl.gov.py/recurso/Diccionario%20Guarani%20Paraguayo/lexicon/01.htm#e160");
  });
});

describe("42. Búsqueda en el diccionario", () => {
  it("entrada simple con el puso del diccionario («’») escrito con apóstrofo común: «mbo'ehára»", () => {
    const h = dict.lookup("mbo'ehára");
    expect(h[0]?.entry.headword).toBe("mbo’ehára");
    expect(h[0]?.accentDiffers).toBe(false);
  });

  it("entrada con varias formas: «róga» encuentra «óga, róga ha hóga»", () => {
    const h = dict.lookup("róga")[0];
    expect(h?.entry.headword).toBe("óga, róga ha hóga");
    expect(h?.form).toBe("róga");
  });

  it("palabras de la Ley de Lenguas que el motor no tenía: «moakãhapavẽ», «pokatu»", () => {
    expect(dict.has("moakãhapavẽ")).toBe(true);
    expect(dict.has("pokatu")).toBe(true);
  });

  it("abreviaturas: se explican solo las conocidas, las demás quedan tal cual", () => {
    expect(posLabel("t./ñ")).toBe("téra (sustantivo)");
    expect(posLabel("ñk")).toBe(null);
  });

  it("no inventa: lo que el diccionario no trae no da nada", () => {
    expect(dict.lookup("leiguasu")).toEqual([]);
  });
});

describe("43. Orden por atestiguación con el diccionario", () => {
  it("una raíz del diccionario queda como «dictionary», con su enlace", () => {
    const a = attestRoot("pokatu", null, null, dict);
    expect(a.level).toBe("dictionary");
    if (a.level === "dictionary") expect(a.refs[0]).toBe("21#e1350");
  });

  it("el libro va antes que el diccionario, y el diccionario antes que nada", () => {
    const book = { lookup: (w: string) => (w === "japo" ? { form: "japo", pages: [100] } : null) };
    expect(attestRoot("japo", null, book, dict).level).toBe("book");
    const ranked = rankByAttestation([{ root: "xx" }, { root: "pokatu" }], null, null, dict);
    expect(ranked.map((r) => r.reading.root)).toEqual(["pokatu", "xx"]);
  });
});
