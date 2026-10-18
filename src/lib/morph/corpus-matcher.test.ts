import { describe, expect, it } from "vitest";
import { analyze } from "./analyzer";
import { MESSAGE_PENDING, MESSAGE_VERIFIED, rootKey, verifyWithCorpus } from "./corpus-matcher";

/**
 * Raíces de PRUEBA, tomadas de las tablas del libro (págs. 103, 105, 115, 129).
 * Solo sirven para ejercitar el código: no son el corpus validado de la plataforma.
 */
const TEST_ROOTS = ["guapy", "maña", "karu", "'a"];

describe("verifyWithCorpus", () => {
  it("raíz presente → rootVerified, confianza alta y mensaje de verificación (pág. 103: 'aguapy')", () => {
    const [v] = verifyWithCorpus(
      analyze("aguapy").filter((a) => a.root === "guapy"),
      TEST_ROOTS,
    );
    expect(v?.rootVerified).toBe(true);
    expect(v?.confidence).toBe("high");
    expect(v?.message).toBe(MESSAGE_VERIFIED);
  });

  it("raíz ausente → sin verificar, revisión humana y mensaje prudente (pág. 105: 'aipota')", () => {
    const verified = verifyWithCorpus(analyze("aipota"), TEST_ROOTS);
    expect(verified.length).toBeGreaterThan(0);
    for (const v of verified) {
      expect(v.rootVerified).toBe(false);
      expect(v.confidence).toBe("pending_human_review");
      expect(v.message).toBe(MESSAGE_PENDING);
    }
  });

  it("acepta un Set o un arreglo y da el mismo resultado", () => {
    const fromArray = verifyWithCorpus(analyze("ñamaña"), TEST_ROOTS);
    const fromSet = verifyWithCorpus(analyze("ñamaña"), new Set(TEST_ROOTS));
    expect(fromSet).toEqual(fromArray);
  });

  it("ignora el acento desplazado: 'akarúkuri' (pág. 129) da raíz 'karú' y coincide con 'karu'", () => {
    const v = verifyWithCorpus(analyze("akarúkuri"), TEST_ROOTS).find((x) => x.root === "karú");
    expect(v?.rootVerified).toBe(true);
  });

  it("unifica el puso tipográfico (pág. 105): 'ha’a' coincide con 'a; 'ho’u' no, porque 'u no está en la lista", () => {
    const v = verifyWithCorpus(analyze("ha’a"), TEST_ROOTS).find((x) => x.paradigm === "hareal");
    expect(v?.rootVerified).toBe(true);
    const u = verifyWithCorpus(analyze("ho’u"), TEST_ROOTS).find((x) => x.paradigm === "hareal");
    expect(u?.rootVerified).toBe(false);
  });

  it("la ñ es otra letra (pág. 33): 'mana' no verifica la raíz 'maña'", () => {
    expect(rootKey("maña")).not.toBe(rootKey("mana"));
    const v = verifyWithCorpus(analyze("ñamaña"), ["mana"]);
    expect(v.every((x) => !x.rootVerified)).toBe(true);
  });

  it("no busca parecidos: una raíz cercana no alcanza ('guapy' frente a 'guapý' sí; 'guap' no)", () => {
    expect(verifyWithCorpus(analyze("aguapy"), ["guapý"]).some((x) => x.rootVerified)).toBe(true);
    expect(verifyWithCorpus(analyze("aguapy"), ["guap"]).some((x) => x.rootVerified)).toBe(false);
  });

  it("con el corpus vacío todo queda en revisión humana", () => {
    const v = verifyWithCorpus(analyze("ndojapói"), []);
    expect(v.length).toBeGreaterThan(0);
    expect(v.every((x) => x.confidence === "pending_human_review")).toBe(true);
  });

  it("conserva el análisis original y la regla sigue pendiente de validación", () => {
    const original = analyze("aguapyse");
    const verified = verifyWithCorpus(original, TEST_ROOTS);
    verified.forEach((v, i) => {
      expect(v.root).toBe(original[i]?.root);
      expect(v.pages).toEqual(original[i]?.pages);
      expect(v.suffixes).toEqual(original[i]?.suffixes);
      expect(v.status).toBe("pending_validation");
    });
  });

  it("sin análisis devuelve []", () => {
    expect(verifyWithCorpus([], TEST_ROOTS)).toEqual([]);
  });
});
