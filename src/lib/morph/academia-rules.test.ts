import { describe, it, expect } from "vitest";
import { ALPHABET, ALL_RULES, HAREAL_ROOTS, negationPrefix, negationSuffix, PERSON_PREFIXES } from "./academia-rules";

describe("reglas de la Gramática ALG 2020", () => {
  it("el alfabeto oficial tiene 33 grafemas", () => {
    expect(ALPHABET.letters).toHaveLength(33);
  });
  it("hay exactamente 5 raíces hareales", () => {
    expect(HAREAL_ROOTS.roots).toHaveLength(5);
  });
  it("negación: ri tras i final, i en otro caso", () => {
    expect(negationSuffix("japi")).toBe("ri");
    expect(negationSuffix("japo")).toBe("i");
  });
  it("negación: nd oral, n nasal", () => {
    expect(negationPrefix(false)).toBe("nd");
    expect(negationPrefix(true)).toBe("n");
  });
  it("prefijo areal 3.ª persona es o-", () => {
    expect(PERSON_PREFIXES.areal.prefixes["3"]).toEqual(["o"]);
  });
  it("ninguna regla está marcada como validada", () => {
    expect(ALL_RULES.every((r) => r.status === "pending_validation")).toBe(true);
  });
});
