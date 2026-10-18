/**
 * Suite: significados del Wikcionario (CC BY-SA 4.0, «Wiktionary contributors, vía kaikki.org»).
 * Fuente externa y colaborativa: se prueba que se cite, que solo se busque lo que la fuente
 * escribe y que nunca se mezcle con la Gramática ALG 2020.
 */
import { describe, expect, it } from "vitest";
import data from "./data/wikcionario-gn.json";
import { buildWiktionaryIndex, parseFormOf, type WiktionaryRaw } from "./wikcionario";

const raw = data.entradas as WiktionaryRaw[];
const idx = buildWiktionaryIndex(raw);

describe("39. Archivo del Wikcionario: atribución y forma", () => {
  it("trae fuente, atribución, licencia y fecha", () => {
    expect(data.licencia).toContain("CC BY-SA 4.0");
    expect(data.atribucion).toContain("Wiktionary contributors");
    expect(data.atribucion).toContain("kaikki.org");
    expect(data.fecha_de_descarga).toBe("2026-10-18");
    expect(data.aviso).toContain("NO validada");
  });

  it("957 entradas, cada una con palabra, clase y de 1 a 3 definiciones de hasta 120 caracteres", () => {
    expect(raw).toHaveLength(957);
    for (const [w, pos, g] of raw) {
      expect(w.length).toBeGreaterThan(0);
      expect(pos.length).toBeGreaterThan(0);
      expect(g.length >= 1 && g.length <= 3).toBe(true);
      for (const x of g) expect(x.length <= 120).toBe(true);
    }
  });
});

describe("40. Búsqueda de significados", () => {
  it("palabra que la fuente escribe tal cual: «ary»", () => {
    const h = idx.lookup("ary");
    expect(h[0]?.entry.glosses).toEqual(["year"]);
    expect(h[0]?.accentDiffers).toBe(false);
  });

  it("plural que remite al singular: «jaguakuéra» → «jagua»", () => {
    const h = idx.lookup("jaguakuéra")[0];
    expect(h?.entry.formOf).toEqual({ kind: "plural", lemma: "jagua" });
    expect(h?.lemma?.[0]?.glosses).toEqual(["dog", "jaguar"]);
  });

  it("forma dependiente: «rape» → «tape»", () => {
    const h = idx.lookup("rape")[0];
    expect(h?.entry.formOf?.kind).toBe("forma-dependiente");
    expect(h?.lemma?.[0]?.word).toBe("tape");
  });

  it("la fuente marca errores de escritura y se muestra la forma a la que remite: «herava» → «hérava»", () => {
    const h = idx.lookup("herava")[0];
    expect(h?.entry.formOf).toEqual({ kind: "error-de-escritura", lemma: "hérava" });
    expect(h?.lemma?.[0]?.glosses).toEqual(["named, called"]);
  });

  it("variante con aclaración entre paréntesis: «Apeika» → «Amérika»", () => {
    expect(parseFormOf("alternative form of Amérika (“America”)")).toEqual({ kind: "variante", lemma: "Amérika" });
    expect(idx.lookup("Apeika")[0]?.lemma?.[0]?.word).toBe("Amérika");
  });

  it("otro apóstrofo y otra tilde: «mbo’ehára» exacta, «mbo'ehara» avisa que la fuente usa tilde", () => {
    expect(idx.lookup("mbo’ehára")[0]?.accentDiffers).toBe(false);
    const h = idx.lookup("mbo'ehara")[0];
    expect(h?.entry.word).toBe("mbo'ehára");
    expect(h?.accentDiffers).toBe(true);
  });

  it("no inventa: una palabra que la fuente no tiene no da nada", () => {
    expect(idx.lookup("oñemoaranduhína")).toEqual([]);
    expect(idx.has("")).toBe(false);
  });
});
