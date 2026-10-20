/**
 * Suite: los cinco tiempos y los dos aspectos que faltaban (págs. 127–137 de la Gramática ALG
 * 2020), encontrados en la súper prueba del 18/10/2026 al comparar con las segmentaciones del
 * libro. Cada palabra probada aparece LITERALMENTE en la página citada.
 */
import { describe, expect, it } from "vitest";
import { analyze } from "./analyzer";
import { ASPECT_SUFFIXES, TENSE_SUFFIXES } from "./suffixes-rules";

const has = (word: string, person: string, root: string, suffixes: string[]) =>
  analyze(word).some((a) => a.person === person && a.root === root && a.suffixes.map((s) => s.form).join("+") === suffixes.join("+"));

describe("37. Tiempos del verbo completos (págs. 123–135)", () => {
  it("once tiempos: los seis de antes y los cinco agregados", () => {
    expect(TENSE_SUFFIXES.map((t) => t.id)).toEqual([
      "preterito-perfecto",
      "preterito-pluscuamperfecto",
      "preterito-reciente",
      "futuro-perfecto",
      "futuro-obligatorio",
      "futuro-necesario",
      "preterito-imperfecto",
      "preterito-remoto",
      "preterito-anterior",
      "futuro-proximo",
      "futuro-dudoso",
    ]);
  });

  it("pretérito imperfecto «mi» (pág. 127): ajokó-mi, añatõi-mi", () => {
    expect(has("ajokómi", "1sg", "jokó", ["mi"])).toBe(true);
    expect(has("añatõimi", "1sg", "ñatõi", ["mi"])).toBe(true);
  });

  it("pretérito remoto «raka'e» (pág. 129): akéraka'e, añomíraka'e", () => {
    expect(has("akéraka'e", "1sg", "ké", ["raka'e"])).toBe(true);
    expect(has("añomíraka'e", "1sg", "ñomí", ["raka'e"])).toBe(true);
  });

  it("pretérito anterior «ra'e» (págs. 129–131): akáira'e, akañýra'e", () => {
    expect(has("akáira'e", "1sg", "kái", ["ra'e"])).toBe(true);
    expect(has("akañýra'e", "1sg", "kañý", ["ra'e"])).toBe(true);
  });

  it("futuro próximo «pota»/«mbota» (págs. 133–135): ajahupota, asẽmbota", () => {
    expect(has("ajahupota", "1sg", "jahu", ["pota"])).toBe(true);
    expect(has("asẽmbota", "1sg", "sẽ", ["mbota"])).toBe(true);
  });

  it("futuro dudoso «ne» (pág. 135): ajohéine, ambyatyrõne", () => {
    expect(has("ajohéine", "1sg", "johéi", ["ne"])).toBe(true);
    expect(has("ambyatyrõne", "1sg", "mbyatyrõ", ["ne"])).toBe(true);
  });
});

describe("38. Aspecto (págs. 135–137)", () => {
  it("dos aspectos × seis personas, cada forma con su persona", () => {
    expect(ASPECT_SUFFIXES).toHaveLength(12);
    expect(ASPECT_SUFFIXES.find((a) => a.forms[0] === "hína")?.person).toBe("3");
  });

  it("imperfectivo «ína» en las seis personas de la tabla: apytu'u'aína … pepytu'upeína", () => {
    expect(has("apytu'u'aína", "1sg", "pytu'u", ["'aína"])).toBe(true);
    expect(has("repytu'ureína", "2sg", "pytu'u", ["reína"])).toBe(true);
    expect(has("opytu'uhína", "3", "pytu'u", ["hína"])).toBe(true);
    expect(has("japytu'uñaína", "1pl_incl", "pytu'u", ["ñaína"])).toBe(true);
    expect(has("ropytu'uroína", "1pl_excl", "pytu'u", ["roína"])).toBe(true);
    expect(has("pepytu'upeína", "2pl", "pytu'u", ["peína"])).toBe(true);
  });

  it("intermitente «ikóni»: ajapo'aikóni, ojapohikóni", () => {
    expect(has("ajapo'aikóni", "1sg", "japo", ["'aikóni"])).toBe(true);
    expect(has("ojapohikóni", "3", "japo", ["hikóni"])).toBe(true);
  });

  it("la forma del aspecto concuerda con la persona: «reína» no se lee con «a» (1.ª singular)", () => {
    expect(analyze("apytu'ureína").some((a) => a.person === "1sg" && a.suffixes.some((s) => s.form === "reína"))).toBe(false);
  });

  it("tiempo + aspecto (pág. 137): «Aguatava'erã'aína», «oñe'ẽnehikóni»", () => {
    expect(has("aguatava'erã'aína", "1sg", "guata", ["va'erã", "'aína"])).toBe(true);
    expect(has("oñe'ẽnehikóni", "3", "ñe'ẽ", ["ne", "hikóni"])).toBe(true);
  });
});
