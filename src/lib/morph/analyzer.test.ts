import { describe, it, expect } from "vitest";
import { analyze } from "./analyzer";

// Ejemplos tomados literalmente del libro (págs. 25 y 103).
describe("analizador morfológico", () => {
  it("aguapy → areal 1sg, raíz guapy", () => {
    expect(analyze("aguapy").some((a) => a.paradigm === "areal" && a.person === "1sg" && a.root === "guapy")).toBe(true);
  });
  it("ñamaña → areal 1pl inclusivo, raíz maña", () => {
    expect(analyze("ñamaña").some((a) => a.person === "1pl_incl" && a.root === "maña")).toBe(true);
  });
  it("ndojapói → negada, 3.ª persona, raíz japó", () => {
    expect(analyze("ndojapói").some((a) => a.negated && a.person === "3" && a.root === "japó")).toBe(true);
  });
  it("noñaníri → negada con -ri, raíz ñaní", () => {
    expect(analyze("noñaníri").some((a) => a.negated && a.root === "ñaní")).toBe(true);
  });
  it("todo resultado queda pendiente de validación", () => {
    expect(analyze("ndojapói").every((a) => a.status === "pending_validation")).toBe(true);
  });
});
