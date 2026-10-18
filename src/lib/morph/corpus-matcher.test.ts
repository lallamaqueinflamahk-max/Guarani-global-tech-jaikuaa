import { describe, expect, it } from "vitest";
import { analyze } from "./analyzer";
import {
  MESSAGE_PENDING,
  MESSAGE_VERIFIED,
  createMemoryLookup,
  lookupVariants,
  matchWithCorpus,
  rootKey,
  verifyWithCorpus,
} from "./corpus-matcher";

/**
 * Corpus de PRUEBA: raíces tomadas de las tablas del libro (págs. 25, 101, 103, 105, 129).
 * Solo ejercitan el código; no son el corpus validado de la plataforma.
 * "sẽ" va con tilde nasal (pág. 101), no con diéresis.
 */
const MOCK_ROOTS = ["guapy", "maña", "japo", "japó", "ñani", "ñaní", "karu", "sẽ", "pota"];
const lookup = createMemoryLookup(MOCK_ROOTS);

describe("matchWithCorpus", () => {
  it("pág. 103: 'aguapy' → raíz 'guapy' en el corpus → verified, 1.0", async () => {
    const r = (await matchWithCorpus("aguapy", lookup)).find((m) => m.root === "guapy");
    expect(r?.rootFoundInCorpus).toBe(true);
    expect(r?.status).toBe("verified");
    expect(r?.confidence).toBe(1);
    expect(r?.validationMessage).toBe(MESSAGE_VERIFIED);
    expect(r?.sourceReference).toBe("Gramática Guaraní, Academia de la Lengua Guaraní (2020), pág. 103");
  });

  it("pág. 25: 'ndojapói' → raíz 'japó' en el corpus → verified, 1.0, citando la negación", async () => {
    const r = (await matchWithCorpus("ndojapói", lookup)).find((m) => m.analysis.negated);
    expect(r?.root).toBe("japó");
    expect(r?.status).toBe("verified");
    expect(r?.confidence).toBe(1);
    expect(r?.sourceReference).toContain("págs. 103, 115");
  });

  it("pág. 95: 'areko' → estructura válida (a-) pero 'reko' no está → pending_human_review, 0.5", async () => {
    const results = await matchWithCorpus("areko", lookup);
    const r = results.find((m) => m.analysis.prefix === "a" && m.root === "reko");
    expect(r).toBeDefined();
    expect(r?.rootFoundInCorpus).toBe(false);
    expect(r?.status).toBe("pending_human_review");
    expect(r?.confidence).toBe(0.5);
    expect(r?.validationMessage).toBe(MESSAGE_PENDING);
    expect(results.every((m) => m.status === "pending_human_review")).toBe(true);
  });

  it("acento gráfico: la raíz 'japó' se encuentra aunque el corpus solo tenga 'japo'", async () => {
    expect(lookupVariants("japó")).toEqual(["japó", "japo"]);
    const onlyPlain = createMemoryLookup(["japo"]);
    const r = (await matchWithCorpus("ndojapói", onlyPlain)).find((m) => m.analysis.negated);
    expect(r?.status).toBe("verified");
  });

  it("acento gráfico, al revés: el corpus con 'karú' acepta la raíz 'karu'", async () => {
    const r = (await matchWithCorpus("akarúkuri", createMemoryLookup(["karú"]))).find((m) => m.root === "karú");
    expect(r?.status).toBe("verified");
  });

  it("no desnasaliza: 'mana' en el corpus no valida la raíz 'maña' (pág. 33: ñ es otra letra)", async () => {
    expect(rootKey("maña")).not.toBe(rootKey("mana"));
    const results = await matchWithCorpus("ñamaña", createMemoryLookup(["mana"]));
    expect(results.every((m) => m.status === "pending_human_review")).toBe(true);
  });

  it("no desnasaliza: 'se' sin tilde no valida la raíz 'sẽ' (pág. 101)", async () => {
    const results = await matchWithCorpus("ñasẽ", createMemoryLookup(["se"]));
    expect(results.every((m) => !m.rootFoundInCorpus)).toBe(true);
  });

  it("acepta un buscador asíncrono, como una consulta a la base de datos", async () => {
    const asyncLookup = async (root: string) => {
      await Promise.resolve();
      return MOCK_ROOTS.includes(root);
    };
    const r = (await matchWithCorpus("aipota", asyncLookup)).find((m) => m.root === "pota");
    expect(r?.status).toBe("verified");
  });

  it("palabra sin lectura posible → []", async () => {
    expect(await matchWithCorpus("", lookup)).toEqual([]);
    expect(await matchWithCorpus("xyz", lookup)).toEqual([]);
  });

  it("conserva el análisis original y la regla sigue pendiente de validación", async () => {
    const results = await matchWithCorpus("aguapyse", lookup);
    const original = analyze("aguapyse");
    results.forEach((m, i) => {
      expect(m.analysis).toEqual(original[i]);
      expect(m.analysis.status).toBe("pending_validation");
    });
  });
});

describe("verifyWithCorpus (versión síncrona)", () => {
  it("raíz presente → high; ausente → pending_human_review", () => {
    const ok = verifyWithCorpus(analyze("aguapy"), MOCK_ROOTS).find((a) => a.root === "guapy");
    expect(ok?.confidence).toBe("high");
    const missing = verifyWithCorpus(analyze("areko"), MOCK_ROOTS);
    expect(missing.every((a) => a.confidence === "pending_human_review")).toBe(true);
  });
});
