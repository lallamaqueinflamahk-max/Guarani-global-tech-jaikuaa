/**
 * Suite: análisis de un texto completo (vista «semáforo» del Laboratorio).
 * Las palabras salen de Mozilla Common Voice (guaraní, CC0), del Wikcionario y de la Ley 4251
 * («leiguasu»); ninguna fue escrita a mano para esta prueba.
 */
import { describe, expect, it } from "vitest";
import forms from "./data/gramatica-alg-2020-formas.json";
import wik from "./data/wikcionario-gn.json";
import spl from "./data/spl-diccionario-alg.json";
import { buildBookIndex } from "./book-lexicon";
import { buildWiktionaryIndex, type WiktionaryRaw } from "./wikcionario";
import { buildSplIndex, type SplRaw } from "./spl-dictionary";
import { analyzeText, buildBookRootIndex, classifyWord, type TextSources } from "./text-analyzer";

const bookForms = (forms as { forms: Record<string, number[]> }).forms;
const src: TextSources = {
  book: buildBookIndex(bookForms),
  wiktionary: buildWiktionaryIndex(wik.entradas as WiktionaryRaw[]),
  dictionary: buildSplIndex(spl.entradas as SplRaw[]),
  bookRoots: buildBookRootIndex(bookForms),
};

describe("48. Estado de cada palabra", () => {
  it("respaldada por el libro, el diccionario o el Wikcionario, en ese orden", () => {
    expect(classifyWord("ohasáva", src).evidence.kind).toBe("libro");
    const p = classifyWord("pokatu", src);
    expect(p.status).toBe("respaldada");
    expect(p.evidence.kind).toBe("diccionario");
    expect(classifyWord("okẽ", src).evidence.kind).toBe("wikcionario");
  });

  it("armada por el motor sobre una raíz del diccionario: «og̃uahẽ» = o + g̃uahẽ", () => {
    const w = classifyWord("og̃uahẽ", src);
    expect(w.status).toBe("armada");
    if (w.evidence.kind === "reglas") {
      expect(w.evidence.parts).toEqual(["o", "g̃uahẽ"]);
      expect(w.evidence.rootSource).toBe("diccionario");
    }
  });

  it("raíz que el libro imprime dentro de otra forma: «ojuhu» se respalda con una forma del libro de raíz «juhu»", () => {
    const w = classifyWord("ojuhu", src);
    expect(w.status).toBe("armada");
    expect(w.evidence.kind === "reglas" && w.evidence.rootSource === "libro-forma" && !!w.evidence.inForm).toBe(true);
    if (w.evidence.kind === "reglas") expect(bookForms[w.evidence.inForm!]).toBeDefined();
  });

  it("sin respaldo y fuera del alfabeto", () => {
    expect(classifyWord("leiguasu", src).status).toBe("sin_respaldo");
    expect(classifyWord("estilo", src).status).toBe("fuera_alfabeto");
  });
});

describe("49. Texto completo", () => {
  it("conserva el texto tal cual (espacios, comas, comillas) y no cuenta números romanos ni cifras", () => {
    const text = "PEHẼNGUE II\n«Ohasáva», estilo 12 leiguasu.";
    const r = analyzeText(text, src);
    expect(r.pieces.map((p) => (p.kind === "gap" ? p.text : p.surface)).join("")).toBe(text);
    expect(r.pieces.filter((p) => p.kind === "word").map((p) => (p.kind === "word" ? p.surface : ""))).toEqual(["PEHẼNGUE", "Ohasáva", "estilo", "leiguasu"]);
    expect(r.counts.fuera_alfabeto).toBe(1);
  });

  it("el porcentaje cuenta solo las palabras en guaraní", () => {
    const r = analyzeText("ohasáva og̃uahẽ leiguasu estilo", src);
    expect(r.guarani).toBe(3);
    expect(r.recognized).toBe(66.7);
    expect(analyzeText("estilo, 2026", src).recognized).toBe(null);
  });
});
