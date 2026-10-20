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
  it("ñamaña no se lee como hareal: solo hay 5 raíces hareales (pág. 105)", () => {
    expect(analyze("ñamaña").some((a) => a.paradigm === "hareal")).toBe(false);
  });
  it("ha'a → hareal 1sg, raíz 'a (pág. 105)", () => {
    expect(analyze("ha'a").some((a) => a.paradigm === "hareal" && a.person === "1sg" && a.root === "'a")).toBe(true);
  });
  it("todo resultado queda pendiente de validación", () => {
    expect(analyze("ndojapói").every((a) => a.status === "pending_validation")).toBe(true);
  });
});

// Sufijos: formas literales del libro, con su página.
const has = (word: string, root: string, forms: string[], negated = false) =>
  analyze(word).some(
    (a) => a.root === root && a.negated === negated && a.suffixes.map((s) => s.form).join("+") === forms.join("+"),
  );

describe("sufijos verbales", () => {
  it("aguapyse → volitivo -se (pág. 139)", () => {
    expect(has("aguapyse", "guapy", ["se"])).toBe(true);
  });
  it("ajapopa / amoĩmba → totalitativo -pa / -mba (pág. 143)", () => {
    expect(has("ajapopa", "japo", ["pa"])).toBe(true);
    expect(has("amoĩmba", "moĩ", ["mba"])).toBe(true);
  });
  it("aguerúma → aseverativo -ma (pág. 161)", () => {
    expect(has("aguerúma", "guerú", ["ma"])).toBe(true);
  });
  it("akarúkuri → pretérito reciente -kuri (págs. 127–129)", () => {
    expect(has("akarúkuri", "karú", ["kuri"])).toBe(true);
  });
  it("agueruakue → pretérito perfecto -akue (pág. 125)", () => {
    expect(has("agueruakue", "gueru", ["akue"])).toBe(true);
  });
  it("agueru-va'ekue → pluscuamperfecto -va'ekue (págs. 125–127)", () => {
    expect(has("agueru-va’ekue", "gueru", ["va'ekue"])).toBe(true);
  });
  it("apoíta → futuro perfecto -ta (pág. 131)", () => {
    expect(has("apoíta", "poí", ["ta"])).toBe(true);
  });
  it("aguatava'erã / ajohei'arã → futuros obligatorio y necesario (págs. 131–133)", () => {
    expect(has("aguatava’erã", "guata", ["va'erã"])).toBe(true);
    expect(has("ajohei’arã", "johei", ["'arã"])).toBe(true);
  });
  it("ndojeporuva'erãi → negación con sufijo en el medio (pág. 184)", () => {
    expect(has("ndojeporuva’erãi", "jeporu", ["va'erã"], true)).toBe(true);
  });
  it("siempre ofrece la lectura sin sufijos y suma las páginas", () => {
    expect(has("aguata", "guata", [])).toBe(true);
    const r = analyze("aguapyse").find((a) => a.suffixes.length === 1);
    expect(r?.pages).toEqual([103, 139]);
  });
});
