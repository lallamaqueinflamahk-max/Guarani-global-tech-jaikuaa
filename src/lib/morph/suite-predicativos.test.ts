/**
 * Suite de conformidad: predicativos (págs. 93, 95 y 101), pronominales (pág. 103) y
 * lexemas variables (pág. 97) de "Guarani Ñe'ẽtekuaa / Gramática Guaraní", ALG, 2020.
 * Cada palabra probada aparece LITERALMENTE en el libro, en la página citada.
 */
import { describe, expect, it } from "vitest";
import { analyze, type Analysis } from "./analyzer";
import { IRREGULAR_LEXEMES, PREDICATIVE_PREFIXES, PRONOMINAL_PREFIXES } from "./predicative-rules";

type Want = Partial<Pick<Analysis, "paradigm" | "person" | "prefix" | "root" | "negated">> & { suffixes?: string[] };

function reading(word: string, want: Want): Analysis | undefined {
  return analyze(word).find(
    (a) =>
      (want.paradigm === undefined || a.paradigm === want.paradigm) &&
      (want.person === undefined || a.person === want.person) &&
      (want.prefix === undefined || a.prefix === want.prefix) &&
      (want.root === undefined || a.root === want.root) &&
      (want.negated === undefined || a.negated === want.negated) &&
      (want.suffixes === undefined || a.suffixes.map((s) => s.form).join("+") === want.suffixes.join("+")),
  );
}

describe("13. Verbos predicativos (págs. 93, 95 y 101)", () => {
  it("pág. 101: prefijos che, nde/ne, i/ij/iñ, ñande/ñane, ore, pende/pene; pendiente de validación", () => {
    expect(PREDICATIVE_PREFIXES.source.page).toBe(101);
    expect(PREDICATIVE_PREFIXES.status).toBe("pending_validation");
    expect(PREDICATIVE_PREFIXES.prefixes["3"]).toEqual(["ij", "iñ", "i"]);
  });

  it("pág. 101: 'cheyvate' → che + yvate y 'ijyvate' → ij + yvate (oral)", () => {
    expect(reading("cheyvate", { paradigm: "predicativo", person: "1sg", prefix: "che", root: "yvate" })?.pages).toEqual([101]);
    expect(reading("ijyvate", { paradigm: "predicativo", person: "3", prefix: "ij", root: "yvate" })).toBeDefined();
  });

  it("pág. 101: 'neakãhatã' → ne + akãhatã y 'iñakãhatã' → iñ + akãhatã (nasal)", () => {
    expect(reading("neakãhatã", { paradigm: "predicativo", person: "2sg", prefix: "ne", root: "akãhatã" })).toBeDefined();
    expect(reading("iñakãhatã", { paradigm: "predicativo", person: "3", prefix: "iñ", root: "akãhatã" })).toBeDefined();
  });

  it("pág. 93: adjetivo y adverbio verbalizados: 'cheporã', 'iporã', 'ñaneporã', 'imombyry'", () => {
    expect(reading("cheporã", { paradigm: "predicativo", root: "porã" })).toBeDefined();
    expect(reading("iporã", { paradigm: "predicativo", person: "3", root: "porã" })).toBeDefined();
    expect(reading("ñaneporã", { paradigm: "predicativo", person: "1pl_incl", root: "porã" })).toBeDefined();
    expect(reading("imombyry", { paradigm: "predicativo", root: "mombyry" })).toBeDefined();
  });

  it("págs. 93 y 95: 'chemitã', 'ndejuky' y 'chepyguasu'", () => {
    expect(reading("chemitã", { paradigm: "predicativo", root: "mitã" })).toBeDefined();
    expect(reading("ndejuky", { paradigm: "predicativo", person: "2sg", root: "juky" })).toBeDefined();
    expect(reading("chepyguasu", { paradigm: "predicativo", root: "pyguasu" })).toBeDefined();
  });

  it("los predicativos no llevan voz ni la negación nd- … -i en estas reglas", () => {
    for (const w of ["cheyvate", "iporã", "chemitã"]) {
      for (const a of analyze(w).filter((x) => x.paradigm === "predicativo")) {
        expect(a.voices).toEqual([]);
        expect(a.negated).toBe(false);
      }
    }
  });
});

describe("14. Verbos pronominales (pág. 103)", () => {
  it("pág. 103: 'chejuhu' → che (objeto, 1.ª sing.) + juhu", () => {
    expect(reading("chejuhu", { paradigm: "pronominal", person: "1sg", prefix: "che", root: "juhu" })?.pages).toEqual([103]);
  });

  it("pág. 103: «ro» = de che a nde: 'rojuhu' → ro (objeto, 2.ª sing.) + juhu", () => {
    expect(reading("rojuhu", { paradigm: "pronominal", person: "2sg", prefix: "ro", root: "juhu" })).toBeDefined();
    // También sigue la lectura areal de ore (ro-), que el libro tiene en la pág. 103.
    expect(reading("rojuhu", { paradigm: "areal", person: "1pl_excl", root: "juhu" })).toBeDefined();
  });

  it("pág. 103: 'nemuña' y 'pendejuhu'", () => {
    expect(reading("nemuña", { paradigm: "pronominal", person: "2sg", root: "muña" })).toBeDefined();
    expect(reading("pendejuhu", { paradigm: "pronominal", person: "2pl", root: "juhu" })).toBeDefined();
  });

  it("«po» no está cargado: la persona que reemplaza queda como pregunta para los especialistas", () => {
    expect(Object.values(PRONOMINAL_PREFIXES.prefixes).flat()).not.toContain("po");
    expect(analyze("pojuhu").some((a) => a.paradigm === "pronominal")).toBe(false);
  });
});

describe("15. Lexemas variables (pág. 97)", () => {
  it("pág. 97: solo tres lexemas variables: «ho» (ir), «ju» (venir) y «'e» (decir)", () => {
    expect(IRREGULAR_LEXEMES.map((l) => [l.lexeme, l.meaning])).toEqual([
      ["ho", "ir"],
      ["ju", "venir"],
      ["'e", "decir"],
    ]);
  });

  for (const lex of IRREGULAR_LEXEMES) {
    for (const f of lex.forms) {
      it(`pág. 97: '${f.form}' es la forma de «${lex.lexeme}» (${lex.meaning}) para ${f.person}`, () => {
        const a = reading(f.form, { paradigm: "irregular", person: f.person, suffixes: [] });
        expect(a?.lexeme).toEqual({ form: lex.lexeme, meaning: lex.meaning, page: 97 });
        expect(a?.pages).toEqual([97]);
      });
    }
  }

  it("una forma irregular con sufijo del libro: 'ajujey' (pág. 173) → aju + -jey, lexema «ju»", () => {
    expect(reading("ajujey", { paradigm: "irregular", root: "aju", suffixes: ["jey"] })?.lexeme?.form).toBe("ju");
  });
});
