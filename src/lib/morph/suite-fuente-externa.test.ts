/**
 * Suite: segunda fuente marcada como externa — Estigarribia, «A Grammar of Paraguayan Guarani»,
 * UCL Press, 2020 (CC BY 4.0). Solo complementa lo que la Gramática ALG no lista. Las palabras
 * probadas aparecen en la Gramática ALG o en los apéndices del libro de Estigarribia.
 */
import { describe, expect, it } from "vitest";
import { EXTERNAL_SUFFIXES, RELATIONAL_ROOTS } from "./external-rules";
import { analyzeNominal, suffixNasality } from "./nominal-analyzer";

describe("39. Fuente externa marcada (Estigarribia 2020)", () => {
  it("cada regla externa cita libro, página y licencia, y queda pendiente", () => {
    for (const r of EXTERNAL_SUFFIXES) {
      expect(r.source).toMatchObject({ book: "Estigarribia 2020", license: "CC BY 4.0" });
      expect(r.status).toBe("pending_validation");
    }
    expect(RELATIONAL_ROOTS.roots.length).toBeGreaterThan(100);
  });

  it("'mbo'ehára' (Gramática ALG, pág. 35) → mbo'e + «hára» (agentivo, Estigarribia pág. 309), marcado como externo", () => {
    const a = analyzeNominal("mbo'ehára").find((x) => x.root === "mbo'e");
    expect(a?.suffixes[0]).toMatchObject({ form: "hára", external: true, page: 309 });
  });

  it("'pakovaty' y 'ñanandy' (Gramática ALG, pág. 51) → colectivo ty/ndy con armonía nasal", () => {
    expect(analyzeNominal("pakovaty").find((x) => x.root === "pakova")?.harmony).toBe("ok");
    expect(analyzeNominal("ñanandy").find((x) => x.root === "ñana")?.harmony).toBe("ok");
  });

  it("raíces relacionales: 'heko' → teko, 'hendápe' → tenda + pe", () => {
    expect(analyzeNominal("heko").find((x) => x.multiform)?.multiform).toMatchObject({ absolute: "teko", external: true });
    expect(analyzeNominal("hendápe").some((x) => x.multiform?.absolute === "tenda" && x.suffixes[0]?.form === "pe")).toBe(true);
  });

  it("una lectura con piezas del libro ALG va antes que otra con piezas externas", () => {
    const r = analyzeNominal("ka'aguýpe");
    expect(r[0]?.suffixes.every((s) => !s.external)).toBe(true);
  });
});

describe("40. Armonía nasal por cercanía (ALG pág. 63; Estigarribia págs. 41–43)", () => {
  it("decide por la última sílaba de la raíz", () => {
    expect(suffixNasality("mitã")).toBe("nasal"); // mitãnguéra, pág. 61
    expect(suffixNasality("karai")).toBe("oral"); // karaikuéra, pág. 61
    expect(suffixNasality("mbo'ehara")).toBe("oral"); // mbo'eharakuéra, pág. 63
    expect(suffixNasality("ñu")).toBe("nasal"); // ñúme, pág. 29
    expect(suffixNasality("ka'aguy")).toBe("oral"); // ka'aguýpe, pág. 29
  });
});
