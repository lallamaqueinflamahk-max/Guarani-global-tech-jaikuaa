/**
 * Pruebas del índice de vocabulario. Las palabras de los vocabularios de prueba son palabras
 * publicadas en la plataforma (Aguata, Akaru, Ahecha, "Che vy'a") o formas literales del libro.
 */
import { describe, expect, it } from "vitest";
import { analyze } from "./analyzer";
import { buildCorpusIndex, rankByAttestation } from "./corpus-index";

describe("12. Índice del vocabulario para el laboratorio", () => {
  const index = buildCorpusIndex([
    { gn: "Aguata", validated: false },
    { gn: "Akaru", validated: true },
    { gn: "Che vy'a", validated: false },
  ]);

  it("una raíz que aparece en una palabra publicada queda 'en el vocabulario', con la palabra como evidencia", () => {
    expect(index.root("guata")).toEqual({ level: "published", examples: ["Aguata"] });
  });

  it("si la palabra la validó un docente, la raíz queda 'validada'", () => {
    expect(index.root("karu")).toEqual({ level: "validated", examples: ["Akaru"] });
  });

  it("ignora el acento agudo al comparar: 'karú' (akarúkuri, pág. 129) coincide con 'karu'", () => {
    expect(index.root("karú").level).toBe("validated");
  });

  it("una raíz que no aparece no se inventa", () => {
    expect(index.root("hecha")).toEqual({ level: "none", examples: [] });
  });

  it("separa frases en palabras y reconoce la palabra escrita tal cual", () => {
    expect(index.word("vy'a").level).toBe("published");
    expect(index.word("AKARU").level).toBe("validated");
    expect(index.size).toBe(4);
  });

  it("ordena primero las lecturas con raíz atestiguada: 'aguatájepi' (pág. 163) → guatá + -jepi primero", () => {
    const ranked = rankByAttestation(analyze("aguatájepi"), index);
    expect(ranked[0]?.reading.root).toBe("guatá");
    expect(ranked[0]?.reading.suffixes.map((s) => s.form)).toEqual(["jepi"]);
    expect(ranked[0]?.attestation.level).toBe("published");
  });

  it("sin vocabulario cargado, mantiene el orden del analizador", () => {
    const plain = analyze("ndojapói");
    expect(rankByAttestation(plain, null).map((r) => r.reading)).toEqual(plain);
  });

  it("validada siempre antes que publicada", () => {
    const idx = buildCorpusIndex([
      { gn: "Ahecha", validated: false },
      { gn: "Ahecha", validated: true },
    ]);
    expect(idx.root("hecha")).toEqual({ level: "validated", examples: ["Ahecha"] });
  });
});
