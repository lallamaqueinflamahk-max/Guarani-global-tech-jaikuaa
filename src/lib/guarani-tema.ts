import { TEMAS_3RO, TEMAS_9NO, TEMAS_BACH } from "./guarani-tema-ciclos";
export type VocabItem = { gn: string; es: string };
export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
};

export type Tema = {
  slug: string;
  emoji: string;
  title: string;
  subtitle: string;
  explanation: string;
  vocab: VocabItem[];
  quiz: QuizQuestion[];
};

export const TEMAS_6TO: Tema[] = [
  {
    slug: "saludos",
    emoji: "👋",
    title: "Saludos y cortesía",
    subtitle: "Cómo saludar y ser amable en guaraní",
    explanation:
      "En guaraní, los saludos cambian según el momento del día. La palabra más usada es «Mba'éichapa», que significa «¿Cómo estás?» y sirve como saludo general. Para responder se usa «Iporã» (bien). Las palabras «Aguyje» (gracias) y «Mba'eve mba'e» (de nada) son fundamentales para la cortesía.",
    vocab: [
      { gn: "Mba'éichapa", es: "¿Cómo estás? / Hola" },
      { gn: "Iporã", es: "Bien" },
      { gn: "Aguyje", es: "Gracias" },
      { gn: "Mba'eve mba'e", es: "De nada" },
      { gn: "Jajotopáta", es: "Hasta luego" },
      { gn: "Tereg̃uahẽ porãite", es: "Bienvenido" },
      { gn: "Ñañemoñe'ẽmi", es: "Conversemos un poco" },
    ],
    quiz: [
      {
        prompt: "¿Qué significa «Mba'éichapa»?",
        options: ["Adiós", "¿Cómo estás?", "Gracias", "Buenos días"],
        answer: "¿Cómo estás?",
      },
      {
        prompt: "¿Cómo se dice «gracias» en guaraní?",
        options: ["Iporã", "Aguyje", "Jajotopáta", "Mba'éichapa"],
        answer: "Aguyje",
      },
      {
        prompt: "Si alguien te dice «Aguyje», ¿qué respondés?",
        options: ["Iporã", "Mba'éichapa", "Mba'eve mba'e", "Jajotopáta"],
        answer: "Mba'eve mba'e",
      },
      {
        prompt: "«Jajotopáta» significa…",
        options: ["Hola", "Hasta luego", "Bienvenido", "Bien"],
        answer: "Hasta luego",
      },
      {
        prompt: "Para decir que estás bien, decís…",
        options: ["Iporã", "Aguyje", "Mba'eve", "Tereg̃uahẽ"],
        answer: "Iporã",
      },
    ],
  },
  {
    slug: "familia",
    emoji: "👨‍👩‍👧",
    title: "La familia (Ogapýpe)",
    subtitle: "Los miembros de la familia en guaraní",
    explanation:
      "«Ogapýpe» significa «en la casa» o «en familia». En guaraní, los nombres de los miembros de la familia muchas veces cambian según quién habla (hombre o mujer), pero acá vamos a aprender las formas más comunes que se usan en la escuela.",
    vocab: [
      { gn: "Sy", es: "Mamá" },
      { gn: "Túva", es: "Papá" },
      { gn: "Tyke'ýra", es: "Hermano mayor" },
      { gn: "Kypy'y", es: "Hermana menor" },
      { gn: "Jarýi", es: "Abuela" },
      { gn: "Taita guasu", es: "Abuelo" },
      { gn: "Membykuña", es: "Hija (de la mamá)" },
      { gn: "Memby kuimba'e", es: "Hijo (de la mamá)" },
    ],
    quiz: [
      {
        prompt: "¿Cómo se dice «mamá» en guaraní?",
        options: ["Túva", "Sy", "Jarýi", "Memby"],
        answer: "Sy",
      },
      {
        prompt: "«Túva» significa…",
        options: ["Hermano", "Papá", "Abuelo", "Tío"],
        answer: "Papá",
      },
      {
        prompt: "La palabra «Jarýi» se refiere a…",
        options: ["Abuela", "Hermana", "Mamá", "Prima"],
        answer: "Abuela",
      },
      {
        prompt: "¿Qué significa «Ogapýpe»?",
        options: ["En la escuela", "En la casa / en familia", "En el campo", "En la calle"],
        answer: "En la casa / en familia",
      },
      {
        prompt: "«Tyke'ýra» es…",
        options: ["Hermano menor", "Hermano mayor", "Primo", "Tío"],
        answer: "Hermano mayor",
      },
    ],
  },
  {
    slug: "numeros",
    emoji: "🔢",
    title: "Los números (Papapy)",
    subtitle: "Contar del 1 al 20 en guaraní",
    explanation:
      "«Papapy» significa «números». En guaraní, los números del 1 al 5 son palabras propias (peteĩ, mokõi, mbohapy, irundy, po). Del 6 al 10 se forman combinando «po» (mano = 5) con los otros: poteĩ (5+1), mokõi (5+2), etc. Del 11 al 20 se agregan a «pa» (diez).",
    vocab: [
      { gn: "Peteĩ", es: "Uno (1)" },
      { gn: "Mokõi", es: "Dos (2)" },
      { gn: "Mbohapy", es: "Tres (3)" },
      { gn: "Irundy", es: "Cuatro (4)" },
      { gn: "Po", es: "Cinco (5)" },
      { gn: "Poteĩ", es: "Seis (6)" },
      { gn: "Pa", es: "Diez (10)" },
      { gn: "Mokõipa", es: "Veinte (20)" },
    ],
    quiz: [
      {
        prompt: "¿Cómo se dice «tres»?",
        options: ["Mokõi", "Mbohapy", "Irundy", "Peteĩ"],
        answer: "Mbohapy",
      },
      {
        prompt: "«Po» significa…",
        options: ["Diez", "Cinco", "Dos", "Uno"],
        answer: "Cinco",
      },
      {
        prompt: "¿Qué número es «Mokõipa»?",
        options: ["10", "12", "20", "22"],
        answer: "20",
      },
      {
        prompt: "«Irundy» es…",
        options: ["3", "4", "5", "6"],
        answer: "4",
      },
      {
        prompt: "«Pa» significa…",
        options: ["Uno", "Cinco", "Diez", "Veinte"],
        answer: "Diez",
      },
    ],
  },
  {
    slug: "verbos",
    emoji: "🏃",
    title: "Verbos básicos",
    subtitle: "Verbos areales: aha, reho, oho…",
    explanation:
      "Los verbos «areales» en guaraní se conjugan agregando un prefijo al verbo. Por ejemplo, con el verbo «ha» (ir): a-ha (yo voy), re-ho (vos vas), o-ho (él/ella va), ja-ha (nosotros vamos, inclusivo), ro-ho (nosotros vamos, exclusivo), pe-ho (ustedes van), o-ho (ellos van). Es importante recordar quién hace la acción para usar el prefijo correcto.",
    vocab: [
      { gn: "Aha", es: "Yo voy" },
      { gn: "Reho", es: "Vos vas" },
      { gn: "Oho", es: "Él / ella va" },
      { gn: "Jaha", es: "Vamos (todos)" },
      { gn: "Roho", es: "Vamos (sin vos)" },
      { gn: "Peho", es: "Ustedes van" },
      { gn: "Akaru", es: "Yo como" },
      { gn: "Aguata", es: "Yo camino" },
    ],
    quiz: [
      {
        prompt: "¿Qué significa «Aha»?",
        options: ["Vos vas", "Yo voy", "Él va", "Vamos"],
        answer: "Yo voy",
      },
      {
        prompt: "El prefijo «o-» indica…",
        options: ["Yo", "Vos", "Él / ella", "Nosotros"],
        answer: "Él / ella",
      },
      {
        prompt: "«Jaha» significa…",
        options: ["Yo voy", "Ustedes van", "Vamos (todos)", "Ellos van"],
        answer: "Vamos (todos)",
      },
      {
        prompt: "Para decir «vos vas» usamos…",
        options: ["Aha", "Reho", "Oho", "Peho"],
        answer: "Reho",
      },
      {
        prompt: "«Akaru» significa…",
        options: ["Yo camino", "Yo voy", "Yo como", "Yo duermo"],
        answer: "Yo como",
      },
    ],
  },
  {
    slug: "adjetivos",
    emoji: "🎨",
    title: "Adjetivos (Teroja)",
    subtitle: "Adjetivos comunes para describir",
    explanation:
      "«Teroja» significa «adjetivo» en guaraní: son palabras que describen cómo es algo o alguien. En guaraní, el adjetivo suele ir después del sustantivo. Por ejemplo: «óga tuicha» = casa grande.",
    vocab: [
      { gn: "Tuicha", es: "Grande" },
      { gn: "Michĩ", es: "Pequeño" },
      { gn: "Porã", es: "Bonito / bueno" },
      { gn: "Vai", es: "Feo / malo" },
      { gn: "Pyahu", es: "Nuevo" },
      { gn: "Tuja", es: "Viejo" },
      { gn: "Haku", es: "Caliente" },
      { gn: "Ro'y", es: "Frío" },
    ],
    quiz: [
      {
        prompt: "¿Qué significa «Tuicha»?",
        options: ["Pequeño", "Grande", "Lindo", "Nuevo"],
        answer: "Grande",
      },
      {
        prompt: "«Porã» quiere decir…",
        options: ["Feo", "Bonito / bueno", "Frío", "Viejo"],
        answer: "Bonito / bueno",
      },
      {
        prompt: "Para decir «frío» se usa…",
        options: ["Haku", "Ro'y", "Tuja", "Vai"],
        answer: "Ro'y",
      },
      {
        prompt: "«Pyahu» significa…",
        options: ["Viejo", "Nuevo", "Grande", "Malo"],
        answer: "Nuevo",
      },
      {
        prompt: "En guaraní, el adjetivo va…",
        options: ["Antes del sustantivo", "Después del sustantivo", "No hay regla", "Siempre al final"],
        answer: "Después del sustantivo",
      },
    ],
  },
  {
    slug: "frases",
    emoji: "💬",
    title: "Frases de uso diario",
    subtitle: "Lo que decimos todos los días",
    explanation:
      "Estas son frases que escuchás y usás todos los días en Paraguay. Muchas mezclan guaraní y español (jopara), pero acá vamos a aprenderlas en guaraní puro. Son perfectas para empezar a hablar con tu familia.",
    vocab: [
      { gn: "Cherecha'ãna", es: "Mirame" },
      { gn: "Eju ko'ape", es: "Vení acá" },
      { gn: "Ndaikuaái", es: "No sé" },
      { gn: "Ñañe'ẽ", es: "Hablemos" },
      { gn: "Ahayhu", es: "Te amo / lo amo" },
      { gn: "Mba'épa la novedad?", es: "¿Qué hay de nuevo?" },
      { gn: "Ehasamína", es: "Pasá por favor" },
    ],
    quiz: [
      {
        prompt: "¿Qué significa «Ndaikuaái»?",
        options: ["Sé", "No sé", "Lo entiendo", "No quiero"],
        answer: "No sé",
      },
      {
        prompt: "«Eju ko'ape» se traduce como…",
        options: ["Andate", "Vení acá", "Esperame", "Mirame"],
        answer: "Vení acá",
      },
      {
        prompt: "Para decir «te amo» se usa…",
        options: ["Ahayhu", "Ñañe'ẽ", "Cherecha'ãna", "Aguyje"],
        answer: "Ahayhu",
      },
      {
        prompt: "«Ñañe'ẽ» significa…",
        options: ["Comamos", "Vamos", "Hablemos", "Escuchemos"],
        answer: "Hablemos",
      },
      {
        prompt: "Si querés que alguien pase, decís…",
        options: ["Eju ko'ape", "Ehasamína", "Ndaikuaái", "Cherecha'ãna"],
        answer: "Ehasamína",
      },
    ],
  },
];

export const ESCOLAR_GRADES = ["3° grado", "6° grado", "9° grado", "Bachillerato"] as const;
export type EscolarGrade = (typeof ESCOLAR_GRADES)[number];

export function temasFor(grade: EscolarGrade): Tema[] {
  if (grade === "3° grado") return TEMAS_3RO;
  if (grade === "9° grado") return TEMAS_9NO;
  if (grade === "Bachillerato") return TEMAS_BACH;
  return TEMAS_6TO;
}

export function getTema(slug: string): Tema | undefined {
  return [...TEMAS_6TO, ...TEMAS_3RO, ...TEMAS_9NO, ...TEMAS_BACH].find((t) => t.slug === slug);
}

const GRADE_KEY = "aranduka:escolar-grade";
export function loadEscolarGrade(): EscolarGrade {
  try {
    const v = window.localStorage.getItem(GRADE_KEY);
    if (v && (ESCOLAR_GRADES as readonly string[]).includes(v)) return v as EscolarGrade;
  } catch {}
  return "6° grado";
}
export function saveEscolarGrade(g: EscolarGrade) {
  try { window.localStorage.setItem(GRADE_KEY, g); } catch {}
}
