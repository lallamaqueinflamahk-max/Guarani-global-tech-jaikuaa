export type VocabItem = { gn: string; es: string };
export type GuaraniLesson = {
  n: number;
  title: string;
  theme: string;
  vocab: VocabItem[];
};

export const GUARANI_LESSONS: GuaraniLesson[] = [
  {
    n: 1,
    title: "Saludos",
    theme: "Saludos y expresiones básicas",
    vocab: [
      { gn: "Mba'éichapa", es: "Hola / ¿Qué tal?" },
      { gn: "Iporã", es: "Bien" },
      { gn: "Ko'ẽ porã", es: "Buenos días" },
      { gn: "Ka'aru porã", es: "Buenas tardes" },
      { gn: "Pyhare porã", es: "Buenas noches" },
      { gn: "Aguyje", es: "Gracias" },
      { gn: "Heẽ", es: "Sí" },
      { gn: "Nahániri", es: "No" },
      { gn: "Jajotopa peve", es: "Hasta luego" },
      { gn: "Mba'éichapa nde réra", es: "¿Cómo te llamás?" },
    ],
  },
  {
    n: 2,
    title: "Números",
    theme: "Números del 1 al 10",
    vocab: [
      { gn: "Peteĩ", es: "1" },
      { gn: "Mokõi", es: "2" },
      { gn: "Mbohapy", es: "3" },
      { gn: "Irundy", es: "4" },
      { gn: "Po", es: "5" },
      { gn: "Poteĩ", es: "6" },
      { gn: "Pokõi", es: "7" },
      { gn: "Poapy", es: "8" },
      { gn: "Porundy", es: "9" },
      { gn: "Pa", es: "10" },
    ],
  },
  {
    n: 3,
    title: "La Familia",
    theme: "Miembros de la familia",
    vocab: [
      { gn: "Sy", es: "Madre" },
      { gn: "Túva", es: "Padre" },
      { gn: "Memby", es: "Hijo/a" },
      { gn: "Kyvy", es: "Hermano" },
      { gn: "Reindy", es: "Hermana" },
      { gn: "Taita", es: "Abuelo" },
      { gn: "Jarýi", es: "Abuela" },
      { gn: "Ñemoñare", es: "Familia" },
    ],
  },
  {
    n: 4,
    title: "El Cuerpo",
    theme: "Partes del cuerpo",
    vocab: [
      { gn: "Akã", es: "Cabeza" },
      { gn: "Tesa", es: "Ojo" },
      { gn: "Juru", es: "Boca" },
      { gn: "Tĩ", es: "Nariz" },
      { gn: "Nambi", es: "Oreja" },
      { gn: "Po", es: "Mano" },
      { gn: "Py", es: "Pie" },
      { gn: "Ñe'ã", es: "Corazón" },
    ],
  },
  {
    n: 5,
    title: "Colores",
    theme: "Los colores",
    vocab: [
      { gn: "Pytã", es: "Rojo" },
      { gn: "Hovy", es: "Azul / Verde" },
      { gn: "Sa'yju", es: "Amarillo" },
      { gn: "Morotĩ", es: "Blanco" },
      { gn: "Hũ", es: "Negro" },
      { gn: "Para", es: "De varios colores" },
    ],
  },
  {
    n: 6,
    title: "Animales",
    theme: "Animales comunes",
    vocab: [
      { gn: "Jagua", es: "Perro" },
      { gn: "Mbarakaja", es: "Gato" },
      { gn: "Vaka", es: "Vaca" },
      { gn: "Kavaju", es: "Caballo" },
      { gn: "Guyra", es: "Pájaro" },
      { gn: "Pira", es: "Pez" },
      { gn: "Jaguarete", es: "Jaguar" },
      { gn: "Mainumby", es: "Colibrí" },
    ],
  },
  {
    n: 7,
    title: "Comida",
    theme: "Comidas típicas",
    vocab: [
      { gn: "Tembi'u", es: "Comida" },
      { gn: "So'o", es: "Carne" },
      { gn: "Kamby", es: "Leche" },
      { gn: "Y", es: "Agua" },
      { gn: "Chipa", es: "Chipa" },
      { gn: "Mbeju", es: "Mbejú" },
      { gn: "Avati", es: "Maíz" },
      { gn: "Mandi'o", es: "Mandioca" },
    ],
  },
  {
    n: 8,
    title: "La Naturaleza",
    theme: "Elementos de la naturaleza",
    vocab: [
      { gn: "Kuarahy", es: "Sol" },
      { gn: "Jasy", es: "Luna" },
      { gn: "Mbyja", es: "Estrella" },
      { gn: "Yvy", es: "Tierra" },
      { gn: "Ama", es: "Lluvia" },
      { gn: "Yvoty", es: "Flor" },
      { gn: "Yvyra", es: "Árbol" },
      { gn: "Ka'aguy", es: "Monte" },
    ],
  },
  {
    n: 9,
    title: "Verbos básicos",
    theme: "Acciones cotidianas",
    vocab: [
      { gn: "Aha", es: "Voy" },
      { gn: "Aju", es: "Vengo" },
      { gn: "Akaru", es: "Como" },
      { gn: "Añe'ẽ", es: "Hablo" },
      { gn: "Aiko", es: "Vivo / estoy" },
      { gn: "Ake", es: "Duermo" },
      { gn: "Ahecha", es: "Veo" },
      { gn: "Ahendu", es: "Escucho" },
    ],
  },
  {
    n: 10,
    title: "Frases útiles",
    theme: "Frases para la vida diaria",
    vocab: [
      { gn: "Aipota y", es: "Quiero agua" },
      { gn: "Moõpa reho", es: "¿A dónde vas?" },
      { gn: "Che vy'a", es: "Estoy contento" },
      { gn: "Ndaikuaái", es: "No sé" },
      { gn: "Ñañe'ẽ guaraníme", es: "Hablemos en guaraní" },
      { gn: "Eju ke", es: "Vení" },
    ],
  },
];

export function getGuaraniLesson(n: number): GuaraniLesson | undefined {
  return GUARANI_LESSONS.find((l) => l.n === n);
}
