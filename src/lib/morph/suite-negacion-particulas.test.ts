/**
 * Suite: negación «nd-/n- … -i» con partículas después de la «-i» (págs. 25 y 115) y pleonasmo
 * «iri» (pág. 115). Cada palabra está impresa tal cual en la página que se cita de la Gramática ALG 2020.
 */
import { describe, expect, it } from "vitest";
import { analyze } from "./analyzer";

const neg = (word: string, person: string, root: string, suffixes: string[]) =>
  analyze(word).some((a) => a.negated && a.person === person && a.root === root && a.suffixes.map((s) => s.form).join("+") === suffixes.join("+"));

describe("46. Negación antes de partículas", () => {
  it("«ndorekóiramo» (pág. 94): nd-o-rekó-i-ramo", () => {
    expect(neg("ndorekóiramo", "3", "rekó", ["ramo"])).toBe(true);
  });

  it("«ndopytáima» (pág. 34): nd-o-pytá-i-ma", () => {
    expect(neg("ndopytáima", "3", "pytá", ["ma"])).toBe(true);
  });

  it("«nombotovéiramo» (pág. 251): n-o-mbotové-i-ramo, también con la voz coactiva aparte", () => {
    expect(neg("nombotovéiramo", "3", "mbotové", ["ramo"])).toBe(true);
    expect(analyze("nombotovéiramo").some((a) => a.negated && a.root === "tové" && a.voices.some((v) => v.form === "mbo"))).toBe(true);
  });

  it("«ndojapóiva» (pág. 244): nd-o-japó-i-va", () => {
    expect(neg("ndojapóiva", "3", "japó", ["va"])).toBe(true);
  });

  it("sin partícula no hay negación interior: la «-i» final sigue la regla de siempre", () => {
    expect(neg("ndajuhúi", "1sg", "juhú", [])).toBe(true);
    expect(analyze("ndajuhúi").filter((a) => a.negated && a.suffixes.length > 0)).toEqual([]);
  });

  it("una palabra sin «nd-/n-» no recibe lectura negada", () => {
    expect(analyze("aguerúma").some((a) => a.negated)).toBe(false);
  });
});

describe("47. Pleonasmo «iri» (pág. 115)", () => {
  it("«ndoguatáiri»: nd-o-guatá-iri (verbo no terminado en «i»)", () => {
    expect(neg("ndoguatáiri", "3", "guatá", [])).toBe(true);
  });

  it("con verbo terminado en «i» sigue siendo «-ri»: «ndojapíri» (pág. 115)", () => {
    expect(neg("ndojapíri", "3", "japí", [])).toBe(true);
  });
});
