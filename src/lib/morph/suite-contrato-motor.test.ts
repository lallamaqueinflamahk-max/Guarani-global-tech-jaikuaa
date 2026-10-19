/**
 * Suite: contrato 1.0 con el motor HFST/LEXC (docs/motor/contrato-motores.md).
 * La palabra de ejemplo, «ndojapói», está impresa en la Gramática ALG 2020 (pág. 24).
 */
import { describe, expect, it } from "vitest";
import { matchesLab, parseMotorResponse, type MotorResponse } from "./motor-contract";

const reading = {
  raiz: "japo",
  lema: "japo",
  categoria: "verbo",
  persona: "3",
  negacion: true,
  prefijos: [{ forma: "nd", rasgo: "negacion" }, { forma: "o", rasgo: "persona", valor: "3" }],
  sufijos: [{ forma: "i", rasgo: "negacion" }],
  analisis_crudo: "<salida de hfst-lookup>",
  rango: 1,
  peso: null,
  paginas: [25, 115],
  procedencia: "hfst",
};
const envelope = (data: unknown, success = true) => ({ success, message: success ? null : "falló", data, timestamp: "2026-10-19T12:00:00Z" });
const body = (lecturas: unknown[], extra: Record<string, unknown> = {}) =>
  envelope({
    version_contrato: "1.0",
    motor: { nombre: "jaikuaa-hfst", version: "3.12", transductor: null },
    tokens: [{ superficie: "ndojapói", normalizada: "ndojapói", estado: "una_lectura", seleccion: null, metodo: null, lecturas, ...extra }],
  });

describe("50. Contrato con el motor HFST: forma de la respuesta", () => {
  it("acepta el ejemplo del contrato, con el sobre de la API de Alan", () => {
    const r = parseMotorResponse(body([reading]));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.tokens[0]!.lecturas[0]!.raiz).toBe("japo");
      expect(r.value.tokens[0]!.estado).toBe("una_lectura");
    }
  });

  it("rechaza otra versión mayor, un error del motor y lecturas sin raíz o sin salida cruda", () => {
    const v2 = envelope({ version_contrato: "2.0", motor: {}, tokens: [] });
    expect(parseMotorResponse(v2).ok).toBe(false);
    const fail = parseMotorResponse(envelope(null, false));
    expect(fail.ok === false && fail.error).toBe("falló");
    expect(parseMotorResponse(body([{ ...reading, raiz: "" }])).ok).toBe(false);
    expect(parseMotorResponse(body([{ ...reading, analisis_crudo: undefined }])).ok).toBe(false);
    expect(parseMotorResponse(body([{ ...reading, persona: "4pl" }])).ok).toBe(false);
  });

  it("no acepta que elija una lectura sin decir «resuelta», y corrige el estado según las lecturas", () => {
    const two = parseMotorResponse(body([reading, { ...reading, raiz: "japó" }], { estado: "una_lectura", seleccion: 0 }));
    expect(two.ok && two.value.tokens[0]!.estado).toBe("sin_resolver");
    expect(two.ok && two.value.tokens[0]!.seleccion).toBe(null);
    const none = parseMotorResponse(body([], { estado: "resuelta", seleccion: 0 }));
    expect(none.ok && none.value.tokens[0]!.estado).toBe("sin_analisis");
  });

  it("peso: número o null, nunca otra cosa", () => {
    expect(parseMotorResponse(body([{ ...reading, peso: "alto" }])).ok).toBe(false);
    const r = parseMotorResponse(body([{ ...reading, peso: undefined }]));
    expect(r.ok && r.value.tokens[0]!.lecturas[0]!.peso).toBe(null);
  });
});

describe("51. Comparación con el Laboratorio", () => {
  const parsed = parseMotorResponse(body([reading])) as { ok: true; value: MotorResponse };
  const r = parsed.value.tokens[0]!.lecturas[0]!;

  it("coincide con la misma persona, raíz (sin acento agudo) y sufijos", () => {
    expect(matchesLab(r, [{ person: "3", root: "japó", suffixes: ["i"] }])).toBe(true);
  });

  it("no coincide si cambia la persona o los sufijos", () => {
    expect(matchesLab(r, [{ person: "1sg", root: "japo", suffixes: ["i"] }])).toBe(false);
    expect(matchesLab(r, [{ person: "3", root: "japo", suffixes: [] }])).toBe(false);
  });
});
