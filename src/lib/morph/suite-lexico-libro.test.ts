/**
 * Suite: léxico de la Gramática ALG 2020 (formas impresas en sus páginas en guaraní), palabras
 * compuestas (pág. 53), formas parecidas y orden de lecturas por atestiguación.
 * Las palabras probadas salen del propio archivo de datos, es decir, del libro.
 */
import { describe, expect, it } from "vitest";
import data from "./data/gramatica-alg-2020-formas.json";
import { analyze } from "./analyzer";
import { buildBookIndex, letterDistance } from "./book-lexicon";
import { analyzeNominal } from "./nominal-analyzer";
import { attestRoot, rankByAttestation } from "./corpus-index";
import { checkWord, graphemes } from "./orthography";

const book = buildBookIndex(data.forms as Record<string, number[]>);
const observaciones = data.observaciones as Record<string, { pages: number[]; issues: string[] }>;

describe("30. Léxico de la Gramática (formas impresas)", () => {
  it("más de 3.600 formas, todas sin avisos de error del corrector", () => {
    expect(book.size).toBeGreaterThan(3600);
    const withErrors = Object.keys(data.forms).filter((w) => checkWord(w).some((i) => i.severity === "error"));
    expect(withErrors).toEqual([]);
  });

  it("'jagua' y 'ñe'ẽ' aparecen con sus páginas", () => {
    expect(book.lookup("jagua")?.pages).toContain(50);
    expect(book.lookup("Ñe’ẽ")?.form).toBe("ñe'ẽ");
  });

  it("las formas con observación quedan aparte: 'orgueraha' (pág. 50), 'rógakuéra' (82), 'kavará' (18)", () => {
    for (const w of ["orgueraha", "rógakuéra", "kavará"]) {
      expect(observaciones[w]).toBeDefined();
      expect(book.lookup(w)?.form === w).toBe(false);
    }
    expect(observaciones["orgueraha"]?.pages).toEqual([50]);
  });
});

describe("31. Formas parecidas: no corrigen, muestran lo que el libro imprime", () => {
  it("la distancia cuenta letras del alfabeto: «ñe'e» está a 1 de «ñe'ẽ»", () => {
    const L = (w: string) => graphemes(w).map((g) => g.letter);
    expect(letterDistance(L("ñe'e"), L("ñe'ẽ"))).toBe(1);
    expect(letterDistance(L("mbo"), L("mbo"))).toBe(0);
  });

  it("para 'orgueraha' (pág. 50) aparece 'ogueraha', que el libro imprime en la línea anterior", () => {
    expect(book.similar("orgueraha").map((s) => s.form)).toContain("ogueraha");
  });
});

describe("32. Palabras compuestas (pág. 53)", () => {
  it("'mitãkuña' (pág. 55) → mitã + kuña, las dos en el libro", () => {
    const parts = book.compounds("mitãkuña").map((c) => c.parts.map((p) => p.form).join("+"));
    expect(parts).toContain("mitã+kuña");
  });

  it("cada parte tiene al menos dos letras y la primera termina en vocal", () => {
    for (const c of book.compounds("mitãkuña")) {
      expect(graphemes(c.parts[0].form).length).toBeGreaterThanOrEqual(2);
      expect(graphemes(c.parts[1].form).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("33. Orden de lecturas: docente > libro > vocabulario > nada", () => {
  it("la raíz 'guata' está en el libro (págs. 16, 32 y 92)", () => {
    expect(attestRoot("guata", null, book)).toMatchObject({ level: "book", pages: [16, 32, 92] });
  });

  it("en 'aguata' la lectura con raíz del libro va primero", () => {
    const ranked = rankByAttestation(analyze("aguata"), null, book);
    expect(ranked[0]?.reading.root).toBe("guata");
    expect(ranked[0]?.attestation.level).toBe("book");
  });

  it("también ordena lecturas nominales: 'karaikuéra' → karai (en el libro)", () => {
    const ranked = rankByAttestation(analyzeNominal("karaikuéra"), null, book);
    expect(ranked[0]?.reading.root).toBe("karai");
    expect(ranked[0]?.attestation.level).toBe("book");
  });
});
