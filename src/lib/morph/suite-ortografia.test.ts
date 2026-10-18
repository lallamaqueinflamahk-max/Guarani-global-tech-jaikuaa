/**
 * Suite de conformidad: reglas ortográficas (págs. 33–37), sílaba directa (págs. 19–23),
 * eufonía (págs. 27–31) y posposiciones (págs. 207–209) de "Guarani Ñe'ẽtekuaa / Gramática
 * Guaraní", ALG, 2020. Cada palabra probada aparece LITERALMENTE en el libro, en la página citada.
 */
import { describe, expect, it } from "vitest";
import {
  checkText,
  checkWord,
  expectedAllomorph,
  graphemes,
  nasalSyllableIssue,
  rootNasality,
  syllabify,
  tokenize,
} from "./orthography";
import { EUPHONY_RULES, NASAL_CONSONANTS, NASAL_VOWELS, ORTHOGRAPHY_RULES, POSTPOSITIONS } from "./orthography-rules";

const rules = (w: string) => checkWord(w).map((i) => `${i.rule}:${i.severity}`);

describe("16. Primera regla: alfabeto oficial (pág. 33)", () => {
  it("los dígrafos son una sola letra: 'mbo'ehára' → mb·o·'·e·h·á·r·a", () => {
    expect(graphemes("mbo'ehára").map((g) => g.letter)).toEqual(["mb", "o", "'", "e", "h", "a", "r", "a"]);
    expect(graphemes("mbo'ehára")[5]?.acute).toBe(true);
  });

  it("la g̃ es una letra: 'hag̃ua' (pág. 209)", () => {
    expect(graphemes("hag̃ua").map((g) => g.letter)).toEqual(["h", "a", "g̃", "u", "a"]);
  });

  it("el puso se unifica: ’ (libro) y ' son la misma letra en 'ñe’ẽ'", () => {
    expect(graphemes("ñe’ẽ").map((g) => g.letter)).toEqual(["ñ", "e", "'", "ẽ"]);
  });

  it("el puso escrito como «ʼ» (U+02BC), muy común en textos reales, es la misma letra: 'ñeʼẽ' = 'ñe'ẽ'", () => {
    expect(graphemes("ñeʼẽ").map((g) => g.letter)).toEqual(["ñ", "e", "'", "ẽ"]);
    expect(rules("mbaʼe")).toEqual([]);
  });

  it("archivo digital: 'Amoneῖse' (pág. 249) trae «ῖ» griega por «ĩ» → se unifica y no da aviso", () => {
    expect(graphemes("amoneῖse").map((g) => g.letter)).toContain("ĩ");
    expect(rules("Amoneῖse")).toEqual([]);
  });

  it("pág. 19: 'cabra' (castellano) usa letras fuera del alfabeto; 'kavara' es la forma guaraní", () => {
    expect(rules("cabra")).toEqual(["alfabeto:error"]);
    expect(rules("kavara")).toEqual([]);
  });

  it("pág. 33: D, F y LL solo para préstamos → aviso «préstamo», no error", () => {
    expect(rules("adiómante")).toContain("alfabeto:prestamo"); // pág. 205
    expect(checkWord("adiómante").some((i) => i.severity === "error")).toBe(false);
  });
});

describe("17. Segunda regla: tilde acentual (págs. 33–35)", () => {
  it("sin tilde en vocal tónica final: guata, ñani, ao", () => {
    for (const w of ["guata", "ñani", "ao"]) expect(rules(w)).toEqual([]);
  });

  it("con tilde antes del final: ára, purahéi; dos tónicas: mbo'ehára", () => {
    for (const w of ["ára", "purahéi", "mbo'ehára"]) expect(rules(w)).toEqual([]);
  });

  it("vocales nasales sin tilde: mokõi, ko'ẽrõ, akãme", () => {
    for (const w of ["mokõi", "ko'ẽrõ", "akãme"]) expect(rules(w)).toEqual([]);
  });

  it("tilde móvil: pirapire, pirapirére, oñembopirapirevéta", () => {
    for (const w of ["pirapire", "pirapirére", "oñembopirapirevéta"]) expect(rules(w)).toEqual([]);
  });

  it("observación: la pág. 18 imprime 'kavará' (tilde final) y la pág. 19 'kavara'", () => {
    expect(rules("kavará")).toEqual(["tilde:error"]);
  });

  it("observación: la pág. 82 imprime 'rógakuéra' con dos tildes", () => {
    expect(rules("rógakuéra")).toEqual(["tilde:error"]);
  });
});

describe("18. Tercera regla: sílabas nasales (pág. 35)", () => {
  it("sílabas del libro sin dos nasales: g̃ua, ma, ne, ña, nda, pytã", () => {
    for (const w of ["g̃ua", "ma", "ne", "ña", "nda", "pytã"]) expect(rules(w)).toEqual([]);
  });

  it("«g̃ua» es una sola sílaba", () => {
    expect(syllabify("g̃ua").syllables.map((s) => s.text)).toEqual(["g̃ua"]);
  });

  it("cada consonante nasal del libro (g̃, m, n, ñ) con cada vocal nasal → error", () => {
    for (const c of NASAL_CONSONANTS) for (const v of NASAL_VOWELS) expect(nasalSyllableIssue(c, v)).toBe("error");
  });

  it("naso-oral con vocal nasal: el libro no lo muestra → «revisar», no error", () => {
    for (const c of ["mb", "nd", "ng", "nt"]) expect(nasalSyllableIssue(c, "ã")).toBe("revisar");
  });

  it("vocal nasal con consonante oral forma sílaba nasal válida: 'pytã', 'ñe'ẽ'", () => {
    expect(rules("ñe'ẽ")).toEqual([]);
  });
});

describe("19. Sílaba directa y consonante final (págs. 19 y 21–23)", () => {
  it("sílabas directas: 'purahéi' → pu·ra·hé·i", () => {
    expect(syllabify("purahéi").syllables.map((s) => s.text)).toEqual(["pu", "ra", "hé", "i"]);
  });

  it("pág. 23: perereg, peteg, pepeg, pocog, añag perdieron la consonante final", () => {
    for (const w of ["perereg", "peteg", "pepeg", "añag"]) expect(rules(w)).toEqual(["silaba-directa:revisar"]);
    expect(rules("pocog")).toEqual(["alfabeto:error"]); // además usa «c»
    for (const w of ["perere", "pete", "pepe", "poko", "aña"]) expect(rules(w)).toEqual([]);
  });
});

describe("20. Cuarta regla: formación de palabras y posposiciones (págs. 37, 207–209)", () => {
  it("pág. 207: cinco monosilábicas; pág. 209: once polisilábicas", () => {
    expect(POSTPOSITIONS.monosyllabic.map((p) => p.forms[0])).toEqual(["pe", "gua", "gui", "re", "ndi"]);
    expect(POSTPOSITIONS.polysyllabic).toHaveLength(11);
    expect(POSTPOSITIONS.polysyllabic.map((p) => p.forms[0])).toContain("g̃uarã");
    expect(POSTPOSITIONS.polysyllabic.map((p) => p.forms[0])).toContain("rehe'ỹ");
  });

  it("los ejemplos de las págs. 37, 207 y 209 no dan avisos", () => {
    const texts = [...POSTPOSITIONS.examples, "Ou rehe", "amo guive", "Amógui", "Oúre", "Oporogueroguataseténiko"];
    for (const t of texts) expect(checkText(t)).toEqual([]);
  });

  it("«pe» suelto es también demostrativo ('Pe mitã', pág. 82): no se marca", () => {
    expect(checkText("Pe mitã")).toEqual([]);
  });

  it("monosilábica suelta: 'amo gui' (pág. 37 escribe 'amógui') → revisar", () => {
    const i = checkText("amo gui");
    expect(i.map((x) => `${x.rule}:${x.severity}`)).toEqual(["formacion-palabras:revisar"]);
    expect(i[0]?.page).toBe(37);
  });

  it("polisilábica pegada a una palabra conocida: 'amoguive' (pág. 37 escribe 'amo guive') → revisar", () => {
    const known = new Set(["amo"]);
    expect(checkText("amoguive", { isKnownWord: (w) => known.has(w) }).map((x) => x.rule)).toEqual(["formacion-palabras"]);
    expect(checkText("amoguive")).toEqual([]); // sin vocabulario no se arriesga
  });

  it("separa palabras conservando puso y g̃", () => {
    expect(tokenize("Ou okaru hag̃ua. Ha’ekuéra")).toEqual(["ou", "okaru", "hag̃ua", "ha'ekuéra"]);
  });
});

describe("21. Eufonía (págs. 27–31)", () => {
  it("nueve cambios eufónicos transcriptos, todos pendientes de validación", () => {
    expect(EUPHONY_RULES.map((r) => r.id)).toEqual(["jo-ño", "nd-n", "pe-me", "pa-mba", "k-ng", "s-nd", "t-nd", "vocal-e", "h-glotal"]);
    expect(EUPHONY_RULES.every((r) => r.status === "pending_validation")).toBe(true);
  });

  it("pág. 29: pe/me → 'ka'aguýpe' (raíz oral) y 'ñúme' (raíz nasal)", () => {
    expect(expectedAllomorph("pe-me", "ka'aguy")).toMatchObject({ form: "pe", verdict: "oral", page: 29 });
    expect(expectedAllomorph("pe-me", "ñu")).toMatchObject({ form: "me", verdict: "nasal" });
  });

  it("pág. 29: pa/mba → 'ohopa' y 'osẽmba'", () => {
    expect(expectedAllomorph("pa-mba", "oho").form).toBe("pa");
    expect(expectedAllomorph("pa-mba", "osẽ").form).toBe("mba");
  });

  it("pág. 27: jo/ño → 'johecha' y 'ñohetũ'", () => {
    expect(expectedAllomorph("jo-ño", "hecha").form).toBe("jo");
    expect(expectedAllomorph("jo-ño", "hetũ").form).toBe("ño");
  });

  it("solo naso-orales: 'mbohapy' (pág. 82) → el libro no decide → «duda», sin forma", () => {
    expect(rootNasality("mbohapy")).toBe("duda");
    expect(expectedAllomorph("pe-me", "mbohapy").form).toBe(null);
  });

  it("todas las reglas de ortografía citan su página del libro", () => {
    expect(Object.values(ORTHOGRAPHY_RULES).map((r) => [r.id, r.source.page])).toEqual([
      ["alfabeto", 33],
      ["tilde", 33],
      ["silaba-nasal", 35],
      ["formacion-palabras", 37],
      ["silaba-directa", 19],
    ]);
  });
});
