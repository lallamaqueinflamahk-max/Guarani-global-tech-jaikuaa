export type TriviaCategoryId = "vocabulario" | "mitos" | "cultura";

export type TriviaQuestion = {
  q: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
};

export type TriviaCategory = {
  id: TriviaCategoryId;
  title: string;
  subtitle: string;
  emoji: string;
  questions: TriviaQuestion[];
};

export const TRIVIA: Record<TriviaCategoryId, TriviaCategory> = {
  vocabulario: {
    id: "vocabulario",
    title: "Vocabulario Guaraní",
    subtitle: "Palabras esenciales del ñe'ẽ",
    emoji: "📚",
    questions: [
      {
        q: '¿Qué significa "Kuarahy"?',
        options: ["Luna", "Sol", "Estrella", "Río"],
        answer: 1,
        explanation: "Kuarahy es el sol.",
      },
      {
        q: '¿Cómo se dice "agua"?',
        options: ["Yvy", "Y", "Yvoty", "Yvytu"],
        answer: 1,
        explanation: '"Y" significa agua; Yvy es tierra.',
      },
      {
        q: '¿Qué significa "Jaguarete"?',
        options: ["Perro", "Gato montés", "Jaguar", "Zorro"],
        answer: 2,
        explanation: "El jaguarete es el jaguar, símbolo de fuerza.",
      },
      {
        q: '¿Qué significa "Mba\'éichapa"?',
        options: ["Buenos días", "¿Cómo estás?", "Gracias", "Hasta luego"],
        answer: 1,
        explanation: "Es el saludo guaraní más usado.",
      },
      {
        q: '¿Cómo se dice "gracias"?',
        options: ["Aguyje", "Jajoecháta", "Iporã", "Ñandejára"],
        answer: 0,
        explanation: "Aguyje expresa gratitud.",
      },
      {
        q: '¿Cómo se dice "mandioca" en guaraní?',
        options: ["Mandi'o", "Kumanda", "Mba'y", "Ka'a"],
        answer: 0,
        explanation: "Mandi'o es la mandioca, alimento base de la cocina paraguaya.",
      },
      {
        q: '¿Cómo se dice "hermano" en guaraní?',
        options: ["Túva", "Kyra", "Hermano", "Kyvy"],
        answer: 3,
        explanation: "Kyvy significa hermano (de una mujer) / hermano varón en el uso común.",
      },
    ],
  },
  mitos: {
    id: "mitos",
    title: "Mitos y Leyendas",
    subtitle: "Los seres del imaginario paraguayo",
    emoji: "🌙",
    questions: [
      {
        q: "¿Cuál es uno de los siete mitos guaraníes?",
        options: ["El Pombéro", "El Chupacabras", "La Llorona", "El Basilisco"],
        answer: 0,
        explanation: "El Pombéro es uno de los seres míticos más conocidos.",
      },
      {
        q: "¿Cómo se describe tradicionalmente al Jasy Jateré?",
        options: [
          "Un espíritu del agua",
          "Un niño rubio que aparece en la siesta",
          "Un ave gigante",
          "Un árbol sagrado",
        ],
        answer: 1,
        explanation: "Se dice que rapta a los niños que no duermen la siesta.",
      },
      {
        q: "¿Quiénes son los padres de los siete seres míticos según la leyenda?",
        options: ["Tau y Kerana", "Ñande Ru y Arasy", "Jasy y Kuarahy", "Tupã y Sypave"],
        answer: 0,
        explanation: "De Tau y Kerana nacen los siete hijos míticos.",
      },
      {
        q: "¿Qué ser mítico es conocido como protector del monte y sus animales?",
        options: ["El Kurupi", "El Lobizón", "El Mbói Tu'ĩ", "El Ao Ao"],
        answer: 0,
        explanation: "Según la tradición, cuida el monte y sus criaturas.",
      },
      {
        q: "¿Qué es el Luisõ en la mitología popular?",
        options: [
          "Un pájaro nocturno",
          "Un hombre que se transforma (similar al lobizón)",
          "Una serpiente gigante",
          "Un duende del río",
        ],
        answer: 1,
        explanation: "Es la figura paraguaya del hombre lobo.",
      },
      {
        q: "¿Quién es el dios del trueno en la mitología guaraní?",
        options: ["Tupã", "Ñamandu", "Jasy", "Kuarahy"],
        answer: 0,
        explanation: "Tupã es el dios del trueno y de las tormentas en la cosmovisión guaraní.",
      },
      {
        q: "¿Qué criatura mitológica vive en el monte y tiene los pies al revés?",
        options: ["El Pombéro", "El Kurupi", "El Jasy Jateré", "El Ao Ao"],
        answer: 0,
        explanation: "Al Pombéro se lo describe con los pies al revés para confundir a quienes lo persiguen.",
      },
    ],
  },
  cultura: {
    id: "cultura",
    title: "Cultura y Lengua",
    subtitle: "Identidad paraguaya y ñe'ẽ",
    emoji: "🇵🇾",
    questions: [
      {
        q: "¿El guaraní es lengua oficial del Paraguay?",
        options: [
          "No",
          "Sí, junto con el español",
          "Solo en el interior",
          "Solo simbólicamente",
        ],
        answer: 1,
        explanation: "La Constitución reconoce ambas lenguas oficiales.",
      },
      {
        q: '¿Qué significa "Jaikuaa"?',
        options: ["Aprender", "Conozcamos juntos", "Enseñar", "Hablar"],
        answer: 1,
        explanation: "Es el espíritu de esta plataforma.",
      },
      {
        q: '¿Qué es el "jopara"?',
        options: [
          "Un plato típico solamente",
          "La mezcla de guaraní y español",
          "Un dialecto del norte",
          "Una danza",
        ],
        answer: 1,
        explanation: "Es la forma mixta en que se habla a diario.",
      },
      {
        q: '¿Qué es el "puso" en guaraní?',
        options: ["Un acento", "La pausa glotal", "Una letra muda", "Un sufijo"],
        answer: 1,
        explanation: "Como en Ñe'ẽ — corta el sonido entre vocales.",
      },
      {
        q: '¿Qué significa "Ñe\'ẽ"?',
        options: ["Palabra o lengua", "Canto", "Historia", "Silencio"],
        answer: 0,
        explanation: "Ñe'ẽ es palabra, lengua, el habla.",
      },
      {
        q: '¿Cuál es el verbo guaraní para "comer"?',
        options: ["Karu", "Guata", "Hecha", "Jaha"],
        answer: 0,
        explanation: "Karu es el verbo comer en guaraní.",
      },
      {
        q: '¿Cuál es el verbo guaraní para "caminar / andar"?',
        options: ["Guata", "Karu", "Hecha", "Jaha"],
        answer: 0,
        explanation: "Guata significa caminar o andar.",
      },
    ],
  },
};

export const TRIVIA_ORDER: TriviaCategoryId[] = ["vocabulario", "mitos", "cultura"];

// XP economy
export const XP_PER_CORRECT = 10;
export const XP_TIMEOUT = 0;
export const XP_STREAK_BONUS = 5; // per correct answer while streak >= 3
export const QUESTION_SECONDS = 15;
