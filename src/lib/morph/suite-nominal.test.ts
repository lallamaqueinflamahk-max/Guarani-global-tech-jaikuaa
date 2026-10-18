/**
 * Suite de conformidad: sustantivo y adjetivo (págs. 49–85), clases cerradas (págs. 73–81 y
 * 179–201), posposiciones unidas (pág. 207), partículas interrogativas (pág. 185) y negación con
 * vocal eufónica (págs. 29 y 115) de "Guarani Ñe'ẽtekuaa / Gramática Guaraní", ALG, 2020.
 * Cada palabra probada aparece LITERALMENTE en el libro, en la página citada.
 */
import { describe, expect, it } from "vitest";
import { analyze } from "./analyzer";
import { CLOSED_CLASSES, lookupClosed } from "./closed-classes";
import { analyzeNominal, type NominalAnalysis } from "./nominal-analyzer";
import { MULTIFORM_NOUNS, NOMINAL_SUFFIXES } from "./nominal-rules";

type Want = { root?: string; suffixes?: string[]; possessor?: string; multiform?: string };

function nominal(word: string, want: Want): NominalAnalysis | undefined {
  return analyzeNominal(word).find(
    (a) =>
      (want.root === undefined || a.root === want.root) &&
      (want.suffixes === undefined || a.suffixes.map((s) => s.form).join("+") === want.suffixes.join("+")) &&
      (want.possessor === undefined || a.possessor?.form === want.possessor) &&
      (want.multiform === undefined || a.multiform?.kind === want.multiform),
  );
}

describe("22. Clases cerradas del libro", () => {
  it("todas las entradas citan página y quedan pendientes de validación", () => {
    expect(CLOSED_CLASSES.status).toBe("pending_validation");
    expect(CLOSED_CLASSES.entries.length).toBeGreaterThan(150);
    expect(CLOSED_CLASSES.entries.every((e) => e.page >= 73 && e.page <= 201)).toBe(true);
  });

  it("pág. 179: 'ápe' es adverbio de lugar ('aquí'); escrita sin tilde coincide, con aviso", () => {
    expect(lookupClosed("ápe")[0]).toMatchObject({ accentDiffers: false, entry: { cls: "adverbio-lugar", gloss: "aquí", page: 179 } });
    expect(lookupClosed("ape")[0]?.accentDiffers).toBe(true);
  });

  it("págs. 187 y 199: 'ha'e' es pronombre sujeto y también conjunción copulativa", () => {
    expect(lookupClosed("ha'e").map((m) => m.entry.cls)).toEqual(["pronombre-sujeto", "conjuncion-copulativa"]);
  });

  it("pág. 187: el libro imprime 'hikúai' y 'hikuái'; están las dos", () => {
    expect(lookupClosed("hikúai")[0]?.entry.cls).toBe("pronombre-sujeto");
    expect(lookupClosed("hikuái")[0]?.entry.cls).toBe("pronombre-sujeto");
  });

  it("pág. 73: demostrativos de presencia ko, pe, amo / ã, ko'ã, umi", () => {
    const pres = CLOSED_CLASSES.entries.filter((e) => e.cls === "demostrativo-presencia").map((e) => e.form);
    expect(pres).toEqual(["ko", "pe", "amo", "ã", "ko'ã", "umi"]);
  });

  it("pág. 179: «O)kápe» así impreso no se carga (observación)", () => {
    expect(lookupClosed("okápe")).toEqual([]);
  });

  it("pág. 189: «po» como 2.ª plural, con nota de la diferencia con la pág. 103", () => {
    const po = lookupClosed("po").find((m) => m.entry.cls === "pronombre-objeto-directo");
    expect(po?.entry.person).toBe("2pl");
    expect(po?.entry.note).toContain("103");
  });
});

describe("23. Sustantivos biformes, triformes y cuatriformes (págs. 51–53)", () => {
  it("doce sustantivos listados, con su forma absoluta primero", () => {
    expect(MULTIFORM_NOUNS).toHaveLength(12);
    expect(MULTIFORM_NOUNS.find((m) => m.forms.includes("hóga"))?.forms).toEqual(["óga", "róga", "hóga"]);
  });

  it("'hóga' → índice «h» + óga (triforme, págs. 53 y 75)", () => {
    expect(nominal("hóga", { root: "óga", possessor: "h", multiform: "triforme" })).toBeDefined();
  });

  it("'rógakuéra' (pág. 83) → róga (forma de óga) + kuéra", () => {
    expect(nominal("rógakuéra", { root: "óga", suffixes: ["kuéra"], multiform: "triforme" })).toBeDefined();
  });

  it("'mymba' es la cuarta forma de tymba (cuatriforme)", () => {
    expect(nominal("mymba", { root: "tymba", multiform: "cuatriforme" })).toBeDefined();
  });

  it("'hesa' (pág. 75) no está en las tablas: no se deduce ninguna forma absoluta", () => {
    expect(analyzeNominal("hesa").some((a) => a.multiform)).toBe(false);
  });
});

describe("24. Formas de uso del sustantivo (pág. 59)", () => {
  it("preteritiva: 'aokue', 'rembirekore', 'iñakãngue'", () => {
    expect(nominal("aokue", { root: "ao", suffixes: ["kue"] })).toBeDefined();
    expect(nominal("rembirekore", { root: "rembireko", suffixes: ["re"] })).toBeDefined();
    expect(nominal("iñakãngue", { possessor: "iñ", root: "akã", suffixes: ["ngue"] })).toBeDefined();
  });

  it("futuritiva y frustrativa: 'aorã', 'tembirekorã', 'pa'irãngue'", () => {
    expect(nominal("aorã", { root: "ao", suffixes: ["rã"] })).toBeDefined();
    expect(nominal("tembirekorã", { root: "tembireko", suffixes: ["rã"] })).toBeDefined();
    expect(nominal("pa'irãngue", { root: "pa'i", suffixes: ["rãngue"] })).toBeDefined();
  });
});

describe("25. Número del sustantivo (págs. 61–63)", () => {
  it("plural discriminativo: 'karaikuéra' (oral), 'mitãnguéra' y 'ñe'ẽnguéra' (nasales), con armonía", () => {
    expect(nominal("karaikuéra", { root: "karai", suffixes: ["kuéra"] })?.harmony).toBe("ok");
    expect(nominal("mitãnguéra", { root: "mitã", suffixes: ["nguéra"] })?.harmony).toBe("ok");
    expect(nominal("ñe'ẽnguéra", { root: "ñe'ẽ", suffixes: ["nguéra"] })?.harmony).toBe("ok");
  });

  it("plural de multitud «ita» tras vocal fuerte: jaguaita, kyseita, ñe'ẽita, so'oita, votõita", () => {
    for (const [w, root] of [["jaguaita", "jagua"], ["kyseita", "kyse"], ["ñe'ẽita", "ñe'ẽ"], ["so'oita", "so'o"], ["votõita", "votõ"]]) {
      expect(nominal(w!, { root, suffixes: ["ita"] })).toBeDefined();
    }
  });

  it("plural de multitud «eta» tras vocal débil: ju'ieta, kavajueta, kokũeta, jukyeta, petỹeta", () => {
    for (const [w, root] of [["ju'ieta", "ju'i"], ["kavajueta", "kavaju"], ["kokũeta", "kokũ"], ["jukyeta", "juky"], ["petỹeta", "petỹ"]]) {
      expect(nominal(w!, { root, suffixes: ["eta"] })).toBeDefined();
    }
  });

  it("pág. 63: 'mbo'eharakuéra' — el libro prefiere «kuéra»; con solo naso-orales la armonía queda en duda", () => {
    expect(nominal("mbo'eharakuéra", { root: "mbo'ehara", suffixes: ["kuéra"] })?.harmony).toBe("duda");
  });
});

describe("26. Grados del sustantivo, adjetivo y adverbio (págs. 67–71 y 185)", () => {
  it("superlativo según la vocal final: 'karia'yete', 'kuñaite', 'kumba'ete' (pág. 69, así impreso)", () => {
    expect(nominal("karia'yete", { root: "karia'y", suffixes: ["ete"] })).toBeDefined();
    expect(nominal("kuñaite", { root: "kuña", suffixes: ["ite"] })).toBeDefined();
    expect(nominal("kumba'ete", { root: "kumba'e", suffixes: ["te"] })).toBeDefined();
    expect(analyzeNominal("kuñaite").some((a) => a.suffixes.some((s) => s.form === "ete"))).toBe(false);
  });

  it("supersuperlativo: 'karia'yeterei', 'kuñaiterei', 'kuimba'eterei'", () => {
    expect(nominal("karia'yeterei", { root: "karia'y", suffixes: ["eterei"] })).toBeDefined();
    expect(nominal("kuñaiterei", { root: "kuña", suffixes: ["iterei"] })).toBeDefined();
    expect(nominal("kuimba'eterei", { root: "kuimba'e", suffixes: ["terei"] })).toBeDefined();
  });

  it("superlativísimo y ultrasuperlativo: 'karairasa', 'mitãrasa', 'karia'yetereirasa', 'mitãitereirasa'", () => {
    expect(nominal("karairasa", { root: "karai", suffixes: ["rasa"] })).toBeDefined();
    expect(nominal("mitãrasa", { root: "mitã", suffixes: ["rasa"] })).toBeDefined();
    expect(nominal("karia'yetereirasa", { root: "karia'y", suffixes: ["etereirasa"] })).toBeDefined();
    expect(nominal("mitãitereirasa", { root: "mitã", suffixes: ["itereirasa"] })).toBeDefined();
  });

  it("excelso (págs. 69–71): 'vy'apavẽ', 'mburuvichavete', 'ñanderuvusu'", () => {
    expect(nominal("vy'apavẽ", { root: "vy'a", suffixes: ["pavẽ"] })).toBeDefined();
    expect(nominal("mburuvichavete", { root: "mburuvicha", suffixes: ["vete"] })).toBeDefined();
    expect(nominal("ñanderuvusu", { root: "ñanderu", suffixes: ["vusu"] })).toBeDefined();
  });

  it("comparativo de igualdad «icha» (pág. 67): 'mbyjáicha', 'kavajúicha'", () => {
    expect(nominal("mbyjáicha", { root: "mbyjá", suffixes: ["icha"] })).toBeDefined();
    expect(nominal("kavajúicha", { root: "kavajú", suffixes: ["icha"] })).toBeDefined();
  });

  it("pág. 185: grados del adverbio 'mombyryve', 'mombyryete', 'mombyryrasa', 'mombyryetereirasa'", () => {
    expect(nominal("mombyryve", { root: "mombyry", suffixes: ["ve"] })).toBeDefined();
    expect(nominal("mombyryete", { root: "mombyry", suffixes: ["ete"] })).toBeDefined();
    expect(nominal("mombyryrasa", { root: "mombyry", suffixes: ["rasa"] })).toBeDefined();
    expect(nominal("mombyryetereirasa", { root: "mombyry", suffixes: ["etereirasa"] })).toBeDefined();
  });
});

describe("27. Ordinal, posposiciones unidas e interrogativas (págs. 79, 207, 181–185)", () => {
  it("ordinal «ha» (pág. 79): peteĩha, mokõiha, mbohapyha, poha", () => {
    for (const [w, root] of [["peteĩha", "peteĩ"], ["mokõiha", "mokõi"], ["mbohapyha", "mbohapy"], ["poha", "po"]]) {
      expect(nominal(w!, { root, suffixes: ["ha"] })).toBeDefined();
    }
  });

  it("posposición unida (pág. 207): 'ógape', 'Ka'akupépe', 'Paraguarígui'", () => {
    expect(nominal("ógape", { root: "óga", suffixes: ["pe"] })?.harmony).toBe("ok");
    expect(nominal("Ka'akupépe", { root: "ka'akupé", suffixes: ["pe"] })).toBeDefined();
    expect(nominal("Paraguarígui", { root: "paraguarí", suffixes: ["gui"] })).toBeDefined();
  });

  it("pe/me con armonía nasal (págs. 29 y 35): 'ka'aguýpe' (oral) y 'ñúme', 'akãme' (nasales)", () => {
    expect(nominal("ka'aguýpe", { root: "ka'aguý", suffixes: ["pe"] })?.harmony).toBe("ok");
    expect(nominal("akãme", { root: "akã", suffixes: ["me"] })?.harmony).toBe("ok");
  });

  it("interrogativa (pág. 181): 'Moõpiko' → moõ (adverbio de interrogación) + piko", () => {
    expect(nominal("Moõpiko", { root: "moõ", suffixes: ["piko"] })).toBeDefined();
    expect(lookupClosed("moõ")[0]?.entry.cls).toBe("adverbio-interrogacion");
  });

  it("las partículas cargadas citan su página", () => {
    expect(NOMINAL_SUFFIXES.every((s) => s.source.page >= 59 && s.source.page <= 207)).toBe(true);
  });
});

describe("28. Índices de posesión de 3.ª persona (págs. 75–77)", () => {
  it("«ij» e «iñ»: 'ijao', 'ijapyka', 'iñakã'", () => {
    expect(nominal("ijao", { possessor: "ij", root: "ao" })).toBeDefined();
    expect(nominal("ijapyka", { possessor: "ij", root: "apyka" })).toBeDefined();
    expect(nominal("iñakã", { possessor: "iñ", root: "akã" })).toBeDefined();
  });

  it("«i» ante consonante: 'imbarakaja', 'ikuatia'; «hi'» ante vocal tónica: 'hi'ára', 'hi'áva'", () => {
    expect(nominal("imbarakaja", { possessor: "i", root: "mbarakaja" })).toBeDefined();
    expect(nominal("ikuatia", { possessor: "i", root: "kuatia" })).toBeDefined();
    expect(nominal("hi'ára", { possessor: "hi'", root: "ára" })).toBeDefined();
    expect(nominal("hi'áva", { possessor: "hi'", root: "áva" })).toBeDefined();
  });
});

describe("29. Negación con vocal eufónica (págs. 29 y 115)", () => {
  const neg = (w: string, person: string, prefix: string, root: string) =>
    analyze(w).find((a) => a.negated && a.person === person && a.prefix === prefix && a.root === root);

  it("verbo oral: nde-rejuhú-i, nda-jajuhú-i, ndo-rojuhú-i, nda-pejuhúi", () => {
    expect(neg("nderejuhúi", "2sg", "re", "juhú")).toBeDefined();
    expect(neg("ndajajuhúi", "1pl_incl", "ja", "juhú")).toBeDefined();
    expect(neg("ndorojuhúi", "1pl_excl", "ro", "juhú")).toBeDefined();
    expect(neg("ndapejuhúi", "2pl", "pe", "juhú")).toBeDefined();
  });

  it("verbo nasal: ne-resẽ-i, na-ñasẽ-i, no-rosẽ-i, na-pesẽi", () => {
    expect(neg("neresẽi", "2sg", "re", "sẽ")).toBeDefined();
    expect(neg("nañasẽi", "1pl_incl", "ña", "sẽ")).toBeDefined();
    expect(neg("norosẽi", "1pl_excl", "ro", "sẽ")).toBeDefined();
    expect(neg("napesẽi", "2pl", "pe", "sẽ")).toBeDefined();
  });

  it("pág. 29: 'nderejapói' → Nd-e-rejapó-i", () => {
    expect(neg("nderejapói", "2sg", "re", "japó")).toBeDefined();
  });

  it("la vocal eufónica solo vale para la persona de la tabla: «nda» + «re» no da 2.ª singular", () => {
    expect(analyze("ndarejuhúi").some((a) => a.negated && a.person === "2sg")).toBe(false);
  });
});
