import { GUARANI_LESSONS, type VocabItem } from "./guarani-lessons";

export type Lesson = {
  n: number;
  title: string;
  theme: string;
  vocab: VocabItem[];
  /** Locale code used for browser TTS pronunciation. */
  speakLang: string;
};

type LessonsByLang = Record<string, Lesson[]>;

const guaraniLessons: Lesson[] = GUARANI_LESSONS.map((l) => ({
  ...l,
  speakLang: "es-PY",
}));

const inglesLessons: Lesson[] = [
  {
    n: 1,
    title: "Saludos",
    theme: "Greetings and basic expressions",
    speakLang: "en-US",
    vocab: [
      { gn: "Hello", es: "Hola" },
      { gn: "Good morning", es: "Buenos días" },
      { gn: "Good afternoon", es: "Buenas tardes" },
      { gn: "Good night", es: "Buenas noches" },
      { gn: "Thank you", es: "Gracias" },
      { gn: "Please", es: "Por favor" },
      { gn: "Yes", es: "Sí" },
      { gn: "No", es: "No" },
      { gn: "See you later", es: "Hasta luego" },
      { gn: "What's your name?", es: "¿Cómo te llamás?" },
    ],
  },
];

const portuguesLessons: Lesson[] = [
  {
    n: 1,
    title: "Saudações",
    theme: "Saludos y expresiones básicas",
    speakLang: "pt-BR",
    vocab: [
      { gn: "Olá", es: "Hola" },
      { gn: "Bom dia", es: "Buenos días" },
      { gn: "Boa tarde", es: "Buenas tardes" },
      { gn: "Boa noite", es: "Buenas noches" },
      { gn: "Obrigado", es: "Gracias" },
      { gn: "Por favor", es: "Por favor" },
      { gn: "Sim", es: "Sí" },
      { gn: "Não", es: "No" },
      { gn: "Até logo", es: "Hasta luego" },
      { gn: "Qual é o seu nome?", es: "¿Cómo te llamás?" },
    ],
  },
];

const francesLessons: Lesson[] = [
  {
    n: 1,
    title: "Salutations",
    theme: "Saludos y expresiones básicas",
    speakLang: "fr-FR",
    vocab: [
      { gn: "Bonjour", es: "Hola / Buenos días" },
      { gn: "Bonsoir", es: "Buenas noches" },
      { gn: "Merci", es: "Gracias" },
      { gn: "S'il vous plaît", es: "Por favor" },
      { gn: "Oui", es: "Sí" },
      { gn: "Non", es: "No" },
      { gn: "Au revoir", es: "Adiós" },
      { gn: "À bientôt", es: "Hasta pronto" },
      { gn: "Comment ça va ?", es: "¿Cómo estás?" },
      { gn: "Comment tu t'appelles ?", es: "¿Cómo te llamás?" },
    ],
  },
];

const espanolLessons: Lesson[] = [
  {
    n: 1,
    title: "Saludos",
    theme: "Saludos y expresiones básicas",
    speakLang: "es-PY",
    vocab: [
      { gn: "Hola", es: "Saludo informal" },
      { gn: "Buenos días", es: "Saludo de la mañana" },
      { gn: "Buenas tardes", es: "Saludo de la tarde" },
      { gn: "Buenas noches", es: "Saludo de la noche" },
      { gn: "Gracias", es: "Expresión de agradecimiento" },
      { gn: "Por favor", es: "Pedido amable" },
      { gn: "Sí", es: "Afirmación" },
      { gn: "No", es: "Negación" },
      { gn: "Hasta luego", es: "Despedida" },
      { gn: "¿Cómo te llamás?", es: "Pregunta por el nombre" },
    ],
  },
];

const LESSONS: LessonsByLang = {
  guarani: guaraniLessons,
  ingles: inglesLessons,
  portugues: portuguesLessons,
  frances: francesLessons,
  espanol: espanolLessons,
};

export function getLesson(langSlug: string, n: number): Lesson | undefined {
  return LESSONS[langSlug]?.find((l) => l.n === n);
}

export function getLessonsForLang(langSlug: string): Lesson[] {
  return LESSONS[langSlug] ?? [];
}
