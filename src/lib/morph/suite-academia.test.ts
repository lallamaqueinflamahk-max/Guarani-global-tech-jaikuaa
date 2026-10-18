/**
 * Suite de conformidad del motor morfológico contra
 * "Guarani Ñe'ẽtekuaa / Gramática Guaraní", Academia de la Lengua Guaraní,
 * versión corregida 2020 (Servilibro).
 *
 * Regla de esta suite: cada palabra probada aparece LITERALMENTE en el libro,
 * en la página citada. Los únicos casos que no son literales están en el bloque
 * "Combinaciones construidas" y lo dicen en su descripción.
 * Todas las reglas siguen "pending_validation" hasta la ficha de regla del Comité.
 */
import { describe, expect, it } from "vitest";
import { analyze, normalizeWord, type Analysis } from "./analyzer";
import { ALPHABET, HAREAL_ROOTS, NEGATION, PERSON_PREFIXES, negationPrefix, negationSuffix } from "./academia-rules";
import { ALL_SUFFIX_RULES, SUFFIX_ORDER } from "./suffixes-rules";
import { VOICE_RULES } from "./voices-rules";
import { IMPERATIVE_PREFIXES } from "./imperative-rules";

/** ¿Hay una lectura con estas partes? */
function reading(
  word: string,
  want: Partial<Pick<Analysis, "paradigm" | "person" | "prefix" | "root" | "negated">> & { suffixes?: string[] },
): Analysis | undefined {
  return analyze(word).find(
    (a) =>
      (want.paradigm === undefined || a.paradigm === want.paradigm) &&
      (want.person === undefined || a.person === want.person) &&
      (want.prefix === undefined || a.prefix === want.prefix) &&
      (want.root === undefined || a.root === want.root) &&
      (want.negated === undefined || a.negated === want.negated) &&
      (want.suffixes === undefined || a.suffixes.map((s) => s.form).join("+") === want.suffixes.join("+")),
  );
}

const rulePage = (id: string) => ALL_SUFFIX_RULES.find((r) => r.id === id)?.page;

/* -------------------------------------------------------------------------- */
describe("1. Alfabeto oficial (pág. 33)", () => {
  it("pág. 33: el alfabeto oficial tiene 33 grafemas", () => {
    expect(ALPHABET.letters.length).toBe(33);
    expect(ALPHABET.source.page).toBe(33);
  });

  it("pág. 33: incluye las seis vocales nasales ã ẽ ĩ õ ũ ỹ, la g̃ y el puso como letra", () => {
    for (const v of ["ã", "ẽ", "ĩ", "õ", "ũ", "ỹ", "g̃", "'"]) expect(ALPHABET.letters).toContain(v);
  });

  it("pág. 33: los dígrafos ch, mb, nd, ng, nt y rr cuentan como una sola letra", () => {
    for (const d of ["ch", "mb", "nd", "ng", "nt", "rr"]) expect(ALPHABET.letters).toContain(d);
  });

  it("pág. 33: d, f y ll solo se admiten para palabras de otras lenguas", () => {
    expect([...ALPHABET.loanLetters]).toEqual(["d", "f", "ll"]);
    for (const l of ALPHABET.loanLetters) expect(ALPHABET.letters).not.toContain(l);
  });
});

/* -------------------------------------------------------------------------- */
describe("2. Paradigma areal (págs. 101 y 103)", () => {
  it("pág. 103: la tabla de prefijos areales es a, re, o, ja/ña, ro, pe", () => {
    expect(PERSON_PREFIXES.areal.prefixes).toEqual({
      "1sg": ["a"],
      "2sg": ["re"],
      "3": ["o"],
      "1pl_incl": ["ja", "ña"],
      "1pl_excl": ["ro"],
      "2pl": ["pe"],
    });
    expect(PERSON_PREFIXES.areal.source.page).toBe(103);
  });

  it("pág. 103: desensambla areal 1sg 'aguapy' → a + guapy", () => {
    expect(reading("aguapy", { paradigm: "areal", person: "1sg", prefix: "a", root: "guapy", suffixes: [] })).toBeDefined();
  });

  it("pág. 103: desensambla el resto de la tabla oral: 'reguapy', 'oguapy', 'roguapy', 'peguapy'", () => {
    const table: [string, Analysis["person"], string][] = [["reguapy", "2sg", "re"], ["oguapy", "3", "o"], ["roguapy", "1pl_excl", "ro"], ["peguapy", "2pl", "pe"]];
    for (const [word, person, prefix] of table) {
      expect(reading(word, { paradigm: "areal", person, prefix, root: "guapy" })).toBeDefined();
    }
  });

  it("pág. 103: desensambla areal 1pl inclusiva oral 'jaguapy' → ja + guapy", () => {
    expect(reading("jaguapy", { paradigm: "areal", person: "1pl_incl", prefix: "ja", root: "guapy" })).toBeDefined();
  });

  it("pág. 103: 1pl inclusiva nasal 'ñamaña' usa ña- → ña + maña", () => {
    expect(reading("ñamaña", { paradigm: "areal", person: "1pl_incl", prefix: "ña", root: "maña" })).toBeDefined();
  });

  it("pág. 101: 1pl inclusiva nasal 'ñasẽ' usa ña- → ña + sẽ", () => {
    expect(reading("ñasẽ", { person: "1pl_incl", prefix: "ña", root: "sẽ" })).toBeDefined();
  });

  it("pág. 103: las formas del libro con guion ('a-guapy') dan el mismo resultado", () => {
    expect(analyze("a-guapy").map((a) => a.root)).toEqual(analyze("aguapy").map((a) => a.root));
  });
});

/* -------------------------------------------------------------------------- */
describe("3. Paradigma aireal (pág. 105)", () => {
  it("pág. 105: la tabla de prefijos aireales es ai, rei, oi, jai/ñai, roi, pei", () => {
    expect(PERSON_PREFIXES.aireal.prefixes).toEqual({
      "1sg": ["ai"],
      "2sg": ["rei"],
      "3": ["oi"],
      "1pl_incl": ["jai", "ñai"],
      "1pl_excl": ["roi"],
      "2pl": ["pei"],
    });
    expect(PERSON_PREFIXES.aireal.source.page).toBe(105);
  });

  it("pág. 105: 'aipota' (lista de aireales) admite la lectura ai + pota", () => {
    expect(reading("aipota", { paradigm: "aireal", person: "1sg", prefix: "ai", root: "pota" })).toBeDefined();
  });

  it("pág. 105: 'aikutu' y 'aipyhy' (lista de aireales) admiten la lectura ai + raíz", () => {
    expect(reading("aikutu", { paradigm: "aireal", person: "1sg", root: "kutu" })).toBeDefined();
    expect(reading("aipyhy", { paradigm: "aireal", person: "1sg", root: "pyhy" })).toBeDefined();
  });
});

/* -------------------------------------------------------------------------- */
describe("4. Verbos hareales (pág. 105)", () => {
  it("pág. 105: el libro identifica exactamente 5 raíces hareales: 'a, 'u, y'u, 'yta, 'yguy", () => {
    expect([...HAREAL_ROOTS.roots]).toEqual(["'a", "'u", "y'u", "'yta", "'yguy"]);
  });

  it("pág. 105: desensambla 'ha'a' (caer, 1sg) → ha + 'a", () => {
    expect(reading("ha'a", { paradigm: "hareal", person: "1sg", prefix: "ha", root: "'a" })).toBeDefined();
  });

  it("pág. 105: desensambla 'ho'u' (comer, 3.ª) → ho + 'u, también con puso tipográfico ’", () => {
    expect(reading("ho'u", { paradigm: "hareal", person: "3", root: "'u" })).toBeDefined();
    expect(reading("ho’u", { paradigm: "hareal", person: "3", root: "'u" })).toBeDefined();
  });

  it("pág. 105: las cinco formas de 1sg del libro se leen como hareales", () => {
    const table: [string, string][] = [["ha'a", "'a"], ["ha'u", "'u"], ["hay'u", "y'u"], ["ha'yta", "'yta"], ["ha'yguy", "'yguy"]];
    for (const [word, root] of table) expect(reading(word, { paradigm: "hareal", person: "1sg", root })).toBeDefined();
  });

  it("pág. 105: fuera de esas 5 raíces no hay lectura hareal ('ñamaña')", () => {
    expect(analyze("ñamaña").some((a) => a.paradigm === "hareal")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
describe("5. Negación discontinua (págs. 23–25 y 115)", () => {
  it("pág. 115: prefijos nd- (oral) y n- (nasal); sufijo -ri tras i y -i en los demás casos", () => {
    expect(NEGATION.prefix).toEqual({ oral: "nd", nasal: "n" });
    expect(NEGATION.suffix).toEqual({ default: "i", afterFinalI: "ri" });
    expect(negationPrefix(false)).toBe("nd");
    expect(negationPrefix(true)).toBe("n");
    // -ri cuando el verbo termina en i; -i en los demás casos.
    expect(negationSuffix("japi")).toBe("ri");
    expect(negationSuffix("juhu")).toBe("i");
  });

  it("pág. 25: desensambla 'ndojapói' → nd- + o + japó + -i", () => {
    expect(reading("ndojapói", { negated: true, person: "3", prefix: "o", root: "japó", suffixes: [] })).toBeDefined();
  });

  it("pág. 25: desensambla 'noñaníri' → n- + o + ñaní + -ri", () => {
    expect(reading("noñaníri", { negated: true, person: "3", prefix: "o", root: "ñaní" })).toBeDefined();
  });

  it("pág. 25: desensambla 'nosẽi' (nasal) → n- + o + sẽ + -i", () => {
    expect(reading("nosẽi", { negated: true, person: "3", root: "sẽ" })).toBeDefined();
  });

  it("pág. 115: desensambla 'ndajapíri' → nd- + a + japí + -ri", () => {
    expect(reading("ndajapíri", { negated: true, person: "1sg", prefix: "a", root: "japí" })).toBeDefined();
  });

  it("págs. 103 y 115: una lectura negada cita la página del prefijo y la de la negación", () => {
    expect(reading("ndojapói", { negated: true, root: "japó" })?.pages).toEqual([103, 115]);
  });
});

/* -------------------------------------------------------------------------- */
describe("6. Sufijos de tiempo y modo (págs. 123–161)", () => {
  it("págs. 125–177: cada sufijo cargado tiene página entre 123 y 177 y queda pendiente de validación", () => {
    for (const r of ALL_SUFFIX_RULES) {
      expect(r.page).toBeGreaterThanOrEqual(123);
      expect(r.page).toBeLessThanOrEqual(177);
      expect(r.status).toBe("pending_validation");
    }
  });

  it("pág. 131: desensambla futuro perfecto 'apoíta' → a + poí + -ta", () => {
    const a = reading("apoíta", { person: "1sg", root: "poí", suffixes: ["ta"] });
    expect(a?.suffixes[0]).toMatchObject({ type: "tense", page: 131 });
  });

  it("pág. 139: desensambla volitivo 'aguapyse' y 'apu'ãse' y suma la pág. 139 a la cita", () => {
    const a = reading("aguapyse", { person: "1sg", root: "guapy", suffixes: ["se"] });
    expect(a?.suffixes[0]).toMatchObject({ type: "mood", page: 139, meaning: "Modo volitivo" });
    expect(a?.pages).toEqual([103, 139]);
    expect(reading("apu'ãse", { person: "1sg", root: "pu'ã", suffixes: ["se"] })).toBeDefined();
  });

  it("págs. 127–129: desensambla pretérito reciente 'akarúkuri' → a + karú + -kuri", () => {
    const a = reading("akarúkuri", { root: "karú", suffixes: ["kuri"] });
    expect(a?.suffixes[0]?.page).toBe(rulePage("preterito-reciente"));
    expect(a?.suffixes[0]?.page).toBe(127);
  });

  it("pág. 125: desensambla pretérito perfecto 'agueruakue' → a + gueru + -akue", () => {
    expect(reading("agueruakue", { root: "gueru", suffixes: ["akue"] })?.suffixes[0]?.page).toBe(125);
  });

  it("págs. 125–127: desensambla pluscuamperfecto 'agueru-va'ekue' → a + gueru + -va'ekue", () => {
    const a = reading("agueru-va’ekue", { root: "gueru", suffixes: ["va'ekue"] });
    expect(a?.suffixes[0]).toMatchObject({ meaning: "Pretérito pluscuamperfecto", page: 125 });
  });

  it("págs. 131–133: desensambla futuro obligatorio 'aguatava'erã' → a + guata + -va'erã", () => {
    expect(reading("aguatava’erã", { root: "guata", suffixes: ["va'erã"] })).toBeDefined();
  });

  it("pág. 133: desensambla futuro necesario 'ajohei'arã' → a + johei + -'arã", () => {
    expect(reading("ajohei’arã", { root: "johei", suffixes: ["'arã"] })).toBeDefined();
  });

  it("pág. 143: desensambla totalitativo oral 'ajapopa' y nasal 'amoĩmba'", () => {
    expect(reading("ajapopa", { root: "japo", suffixes: ["pa"] })).toBeDefined();
    expect(reading("amoĩmba", { root: "moĩ", suffixes: ["mba"] })).toBeDefined();
  });

  it("pág. 161: desensambla aseverativo 'aguerúma' → a + guerú + -ma", () => {
    expect(reading("aguerúma", { root: "guerú", suffixes: ["ma"] })?.suffixes[0]?.page).toBe(161);
  });

  it("pág. 184: negación con sufijo en el medio 'ndojeporuva'erãi' → nd- + o + jeporu + -va'erã + -i", () => {
    const a = reading("ndojeporuva’erãi", { negated: true, prefix: "o", root: "jeporu", suffixes: ["va'erã"] });
    expect(a?.pages).toEqual([103, 115, 131]);
  });
});

/* -------------------------------------------------------------------------- */
describe("Combinaciones construidas (no aparecen literales en el libro)", () => {
  it("construida con las reglas de las págs. 139 y 131: 'aguapyséta' → guapy + -se (modo) + -ta (tiempo)", () => {
    const a = reading("aguapyséta", { root: "guapy", suffixes: ["sé", "ta"] });
    expect(a?.suffixes.map((s) => s.type)).toEqual(["mood", "tense"]);
    expect(a?.pages).toEqual([103, 139, 131]);
    // El orden raíz + modo + tiempo queda pendiente del Comité.
    expect(SUFFIX_ORDER.status).toBe("pending_validation");
    expect([...SUFFIX_ORDER.order]).toEqual(["mood", "tense"]);
  });

  it("construida con las reglas de las págs. 115 y 139: 'ndojaposéi' → nd- + o + japo + -se + -i", () => {
    expect(reading("ndojaposéi", { negated: true, prefix: "o", root: "japo", suffixes: ["sé"] })).toBeDefined();
  });
});

/* -------------------------------------------------------------------------- */
describe("7. Casos límite y antialucinación", () => {
  it("una palabra vacía, con espacios o sin prefijo conocido devuelve []", () => {
    expect(analyze("")).toEqual([]);
    expect(analyze("   ")).toEqual([]);
    expect(analyze("che aguata")).toEqual([]);
    // Sin prefijo personal conocido tampoco hay lectura.
    expect(analyze("xyz")).toEqual([]);
    expect(analyze("kuarahy")).toEqual([]);
  });

  it("no agrega letras: prefijo + raíz + sufijos reconstruye la palabra (sin la negación)", () => {
    for (const w of ["aguapy", "ñamaña", "ha'a", "akarúkuri", "agueru-va'ekue", "ndojeporuva'erãi", "noñaníri"]) {
      const word = normalizeWord(w);
      for (const a of analyze(w)) {
        const core = a.prefix + a.voices.map((v) => v.form).join("") + a.root + a.suffixes.map((s) => s.form).join("");
        expect(word.includes(core)).toBe(true);
      }
    }
  });

  it("toda lectura queda 'pending_validation' y cita solo páginas de reglas cargadas", () => {
    const known = new Set<number>([
      PERSON_PREFIXES.areal.source.page,
      PERSON_PREFIXES.aireal.source.page,
      PERSON_PREFIXES.hareal.source.page,
      NEGATION.source.page,
      IMPERATIVE_PREFIXES.source.page,
      ...ALL_SUFFIX_RULES.map((r) => r.page),
      ...VOICE_RULES.map((r) => r.page),
    ]);
    for (const w of ["aguapy", "aipota", "ha'u", "ndojapói", "aguapyse", "akarúkuri", "ndojeporuva'erãi"]) {
      for (const a of analyze(w)) {
        expect(a.status).toBe("pending_validation");
        for (const p of a.pages) expect(known.has(p)).toBe(true);
      }
    }
  });

  it("es determinista: la misma palabra devuelve siempre el mismo resultado", () => {
    for (const w of ["aguapy", "ndojeporuva'erãi", "aguapyséta"]) {
      expect(JSON.stringify(analyze(w))).toBe(JSON.stringify(analyze(w)));
    }
  });

  it("siempre ofrece la lectura sin sufijos y no la descarta ('aguata' también se lee guata)", () => {
    expect(reading("aguata", { root: "guata", suffixes: [] })).toBeDefined();
  });

  it("'kuaa' e 'ima' no están cargados como sufijos: el libro no los define en las págs. 123–177", () => {
    const forms = ALL_SUFFIX_RULES.flatMap((r) => r.forms);
    expect(forms).not.toContain("kuaa");
    expect(forms).not.toContain("ima");
  });
});
