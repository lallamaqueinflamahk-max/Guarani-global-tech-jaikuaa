/**
 * Suite de conformidad: voces (págs. 117–123), modos (págs. 139–173), imperativo (págs. 165–171)
 * y grados (págs. 173–177) de "Guarani Ñe'ẽtekuaa / Gramática Guaraní", ALG, 2020.
 *
 * Regla de esta suite: cada palabra probada aparece LITERALMENTE en el libro, en la página citada.
 * Ninguna se construyó ni se corrigió. Todo sigue "pending_validation".
 */
import { describe, expect, it } from "vitest";
import { analyze, type Analysis } from "./analyzer";
import { GRADE_SUFFIXES, IMPERATIVE_MOOD_SUFFIXES, MOOD_SUFFIXES, ALL_SUFFIX_RULES } from "./suffixes-rules";
import { VOICE_RULES } from "./voices-rules";
import { IMPERATIVE_PREFIXES } from "./imperative-rules";

type Want = Partial<Pick<Analysis, "paradigm" | "person" | "prefix" | "root">> & { voices?: string[]; suffixes?: string[] };

function reading(word: string, want: Want): Analysis | undefined {
  return analyze(word).find(
    (a) =>
      (want.paradigm === undefined || a.paradigm === want.paradigm) &&
      (want.person === undefined || a.person === want.person) &&
      (want.prefix === undefined || a.prefix === want.prefix) &&
      (want.root === undefined || a.root === want.root) &&
      (want.voices === undefined || a.voices.map((v) => v.form).join("+") === want.voices.join("+")) &&
      (want.suffixes === undefined || a.suffixes.map((s) => s.form).join("+") === want.suffixes.join("+")),
  );
}

/* -------------------------------------------------------------------------- */
describe("8. Voces del verbo (págs. 117–123)", () => {
  it("pág. 117: las voces van entre el prefijo de persona y el lexema; todas quedan pendientes", () => {
    expect(VOICE_RULES.map((r) => r.id)).toEqual(["voz-pasiva", "voz-coactiva", "voz-reciproca", "voz-objetiva", "voz-subsuntiva"]);
    for (const r of VOICE_RULES) {
      expect(r.status).toBe("pending_validation");
      expect(r.page).toBeGreaterThanOrEqual(117);
      expect(r.page).toBeLessThanOrEqual(123);
    }
  });

  it("págs. 117–119: voz pasiva 'ajeja'o' → a + je + ja'o y 'añemosẽ' → a + ñe + mosẽ", () => {
    const a = reading("ajeja'o", { person: "1sg", voices: ["je"], root: "ja'o", suffixes: [] });
    expect(a?.voices[0]).toMatchObject({ meaning: "Voz pasiva", page: 117 });
    expect(a?.pages).toEqual([103, 117]);
    expect(reading("añemosẽ", { voices: ["ñe"], root: "mosẽ" })).toBeDefined();
  });

  it("pág. 123: pasiva refleja con las mismas partículas: 'ajejapi' y 'añekytĩ'", () => {
    expect(reading("ajejapi", { voices: ["je"], root: "japi" })).toBeDefined();
    expect(reading("añekytĩ", { voices: ["ñe"], root: "kytĩ" })).toBeDefined();
  });

  it("pág. 119: voz coactiva 'amboguata' → a + mbo + guata y 'amoñe'ẽ' → a + mo + ñe'ẽ", () => {
    expect(reading("amboguata", { person: "1sg", voices: ["mbo"], root: "guata" })?.voices[0]?.page).toBe(119);
    expect(reading("amoñe'ẽ", { voices: ["mo"], root: "ñe'ẽ" })).toBeDefined();
    // pág. 119: con ñande el libro escribe «ña-mbo-guata».
    expect(reading("ñamboguata", { person: "1pl_incl", prefix: "ña", voices: ["mbo"], root: "guata" })).toBeDefined();
  });

  it("págs. 119–121: voz recíproca solo en plural: 'jajojuhu' y 'ñañomoirũ'", () => {
    expect(reading("jajojuhu", { person: "1pl_incl", voices: ["jo"], root: "juhu" })).toBeDefined();
    expect(reading("ñañomoirũ", { person: "1pl_incl", voices: ["ño"], root: "moirũ" })).toBeDefined();
  });

  it("pág. 117: 'ajoka' (voz activa, 1.ª singular) nunca se lee como recíproca", () => {
    expect(reading("ajoka", { person: "1sg", root: "joka", voices: [] })).toBeDefined();
    expect(analyze("ajoka").some((a) => a.voices.some((v) => v.meaning === "Voz recíproca"))).toBe(false);
  });

  it("pág. 121: voz objetiva 'aporohayhu' (personas) y 'amba'ejuka' (animales)", () => {
    expect(reading("aporohayhu", { voices: ["poro"], root: "hayhu" })?.voices[0]?.page).toBe(121);
    expect(reading("amba'ejuka", { voices: ["mba'e"], root: "juka" })).toBeDefined();
  });

  it("págs. 121–123: voz subsuntiva 'reguerosapukái' y 'aguerotĩ'", () => {
    expect(reading("reguerosapukái", { person: "2sg", voices: ["guero"], root: "sapukái" })).toBeDefined();
    expect(reading("aguerotĩ", { voices: ["guero"], root: "tĩ" })).toBeDefined();
  });

  it("pág. 184: 'ndojeporuva'erãi' ahora también muestra la voz: nd- + o + je + poru + va'erã + -i", () => {
    const a = reading("ndojeporuva'erãi", { prefix: "o", voices: ["je"], root: "poru", suffixes: ["va'erã"] });
    expect(a?.negated).toBe(true);
    expect(a?.pages).toEqual([103, 115, 117, 131]);
  });
});

/* -------------------------------------------------------------------------- */
describe("9. Modos indicativos (págs. 139–173): cada ejemplo del libro se desarma con su partícula", () => {
  for (const rule of MOOD_SUFFIXES) {
    for (const ex of rule.examples ?? []) {
      it(`pág. ${rule.examplesPage ?? rule.page}: '${ex}' tiene una lectura con ${rule.meaning} (pág. ${rule.page})`, () => {
        const found = analyze(ex).some((a) => a.paradigm !== "imperativo" && a.suffixes.some((s) => s.meaning === rule.meaning && s.page === rule.page));
        expect(found).toBe(true);
      });
    }
  }

  it("pág. 145: mediativo 'ajapouka' → a + japo + -uka", () => {
    expect(reading("ajapouka", { person: "1sg", root: "japo", suffixes: ["uka"] })?.pages).toEqual([103, 145]);
  });

  it("pág. 147: concomitante 'ahechávo' → a + hechá + -vo (el acento se mueve antes de la partícula átona)", () => {
    expect(reading("ahechávo", { root: "hechá", suffixes: ["vo"] })).toBeDefined();
  });

  it("pág. 149: el modo colectivo 'joa' solo se lee en plural ('javy'ajoa' → ja + vy'a + -joa)", () => {
    expect(reading("javy'ajoa", { person: "1pl_incl", root: "vy'a", suffixes: ["joa"] })).toBeDefined();
    const singular = analyze("javy'ajoa").filter((a) => a.suffixes.some((s) => s.meaning === "Modo colectivo"));
    expect(singular.every((a) => ["1pl_incl", "1pl_excl", "2pl", "3"].includes(a.person))).toBe(true);
  });

  it("pág. 173: reiterativo 'ajujey' → a + ju + -jey", () => {
    expect(reading("ajujey", { root: "ju", suffixes: ["jey"] })).toBeDefined();
  });

  it("las filas de tabla que no siguen el patrón quedan anotadas para preguntar, no corregidas", () => {
    const observed = MOOD_SUFFIXES.filter((r) => r.bookObservation).map((r) => r.id);
    expect(observed).toEqual(["modo-habitual", "modo-narrativo-verosimil", "modo-antelativo", "modo-confirmativo"]);
    // Ningún ejemplo cargado sale de esas filas.
    for (const r of MOOD_SUFFIXES) for (const ex of r.examples ?? []) expect(["reguerúva", "amb'eningo", "peerurejepe", "rehókatu"]).not.toContain(ex);
  });
});

/* -------------------------------------------------------------------------- */
describe("10. Modos imperativos (págs. 165–171)", () => {
  it("pág. 165: prefijos imperativos e / pe y optativos ta / tere / to / taja / taña / toro / tape", () => {
    expect(IMPERATIVE_PREFIXES.source.page).toBe(165);
    expect(IMPERATIVE_PREFIXES.prefixes).toEqual({
      "1sg": ["ta"],
      "2sg": ["e", "tere"],
      "3": ["to"],
      "1pl_incl": ["taja", "taña"],
      "1pl_excl": ["toro"],
      "2pl": ["pe", "tape"],
    });
    expect(IMPERATIVE_PREFIXES.status).toBe("pending_validation");
  });

  it("pág. 167: imperativo sin partícula 'teregueraha' → tere + gueraha", () => {
    expect(reading("teregueraha", { paradigm: "imperativo", person: "2sg", prefix: "tere", root: "gueraha", suffixes: [] })).toBeDefined();
  });

  for (const rule of IMPERATIVE_MOOD_SUFFIXES) {
    for (const ex of rule.examples ?? []) {
      it(`pág. ${rule.examplesPage ?? rule.page}: '${ex}' tiene una lectura imperativa con ${rule.meaning}`, () => {
        const found = analyze(ex).some((a) => a.paradigm === "imperativo" && a.suffixes.some((s) => s.meaning === rule.meaning));
        expect(found).toBe(true);
      });
    }
  }

  it("pág. 167: 'tapytáke' → ta (1.ª sing.) + pytá + -ke", () => {
    expect(reading("tapytáke", { paradigm: "imperativo", person: "1sg", root: "pytá", suffixes: ["ke"] })?.pages).toEqual([165, 167]);
  });

  it("las partículas imperativas solo se leen con prefijos imperativos u optativos", () => {
    for (const ex of ["tapytáke", "tahejána", "tajoguami", "tapytamíkena", "tahekýimba'e"]) {
      for (const a of analyze(ex)) {
        if (a.suffixes.some((s) => IMPERATIVE_MOOD_SUFFIXES.some((r) => r.meaning === s.meaning))) expect(a.paradigm).toBe("imperativo");
      }
    }
  });

  it("el imperativo no se combina con la negación nd- … -i", () => {
    expect(analyze("ndojapói").some((a) => a.paradigm === "imperativo")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
describe("11. Grados del verbo (págs. 173–177)", () => {
  const verbal = GRADE_SUFFIXES.filter((r) => r.id !== "grado-superlativo-relativo");
  for (const rule of verbal) {
    for (const ex of rule.examples ?? []) {
      it(`pág. ${rule.examplesPage ?? rule.page}: '${ex}' tiene una lectura con ${rule.meaning}`, () => {
        expect(analyze(ex).some((a) => a.suffixes.some((s) => s.type === "grade" && s.meaning === rule.meaning))).toBe(true);
      });
    }
  }

  it("pág. 175: 'amba'apove' → a + mba'apo + -ve (comparativo de superioridad)", () => {
    expect(reading("amba'apove", { root: "mba'apo", suffixes: ["ve"] })?.suffixes[0]).toMatchObject({ type: "grade", page: 173 });
  });

  it("pág. 175: 'ajaty'ive' → a + jaty + -'ive (comparativo de inferioridad)", () => {
    expect(reading("ajaty'ive", { root: "jaty", suffixes: ["'ive"] })).toBeDefined();
  });

  it("pág. 177: superlativo relativo con predicativo: 'iñarandueteve' → iñ + arandu + -eteve (pág. 101 para iñ-)", () => {
    const rel = GRADE_SUFFIXES.find((r) => r.id === "grado-superlativo-relativo");
    expect(rel?.forms).toEqual(["eteve", "iteve"]);
    expect(reading("iñarandueteve", { paradigm: "predicativo", prefix: "iñ", root: "arandu", suffixes: ["eteve"] })?.pages).toEqual([101, 177]);
    expect(analyze("ijaguaraiteve").some((a) => a.paradigm === "predicativo" && a.suffixes.some((s) => s.meaning === rel?.meaning))).toBe(true);
  });

  it("pág. 173: 'icha' va unido al sustantivo, no al verbo: no está cargado como sufijo verbal", () => {
    expect(ALL_SUFFIX_RULES.flatMap((r) => r.forms)).not.toContain("icha");
  });
});
