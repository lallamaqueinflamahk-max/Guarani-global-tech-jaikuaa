import type { Tema } from "./guarani-tema";

// Módulo Agro-Rural (piloto MAG). Contenido propuesto, pendiente de validación docente.
export const TEMAS_AGRO: Tema[] = [
  {
    slug: "agro-yvy",
    emoji: "🌱",
    title: "Yvy ha ñemitỹ (Suelo y siembra)",
    subtitle: "Palabras del campo para sembrar y cuidar la tierra",
    explanation:
      "«Yvy» es la tierra y «ñemitỹ» la siembra o la chacra. En el campo paraguayo estas palabras se usan todos los días para hablar de preparar el suelo, sembrar y cosechar.",
    vocab: [
      { gn: "Yvy", es: "Tierra / suelo" },
      { gn: "Ñemitỹ", es: "Siembra / chacra" },
      { gn: "Ñemitỹha", es: "Lugar de siembra" },
      { gn: "Ra'ỹi", es: "Semilla" },
      { gn: "Y", es: "Agua" },
      { gn: "Amana", es: "Lluvia" },
      { gn: "Kokue", es: "Chacra / campo de cultivo" },
    ],
    quiz: [
      { prompt: "¿Qué significa «Yvy»?", options: ["Agua", "Tierra / suelo", "Lluvia", "Semilla"], answer: "Tierra / suelo" },
      { prompt: "«Ra'ỹi» es…", options: ["Semilla", "Raíz", "Hoja", "Fruta"], answer: "Semilla" },
      { prompt: "¿Cómo se dice «lluvia»?", options: ["Y", "Amana", "Yvy", "Kokue"], answer: "Amana" },
      { prompt: "«Kokue» se refiere a…", options: ["La casa", "La chacra", "El río", "El monte"], answer: "La chacra" },
    ],
  },
  {
    slug: "agro-cultivos",
    emoji: "🌽",
    title: "Temitỹ (Rubros y cultivos)",
    subtitle: "Los cultivos de la agricultura familiar",
    explanation:
      "La agricultura familiar paraguaya se basa en rubros como el maíz, la mandioca, el poroto y el maní. Conocer sus nombres en guaraní ayuda a comunicarse con productores y técnicos.",
    vocab: [
      { gn: "Avati", es: "Maíz" },
      { gn: "Mandi'o", es: "Mandioca" },
      { gn: "Kumanda", es: "Poroto" },
      { gn: "Manduvi", es: "Maní" },
      { gn: "Andai", es: "Zapallo" },
      { gn: "Jety", es: "Batata" },
      { gn: "Ka'a", es: "Yerba mate" },
    ],
    quiz: [
      { prompt: "¿Qué cultivo es «Mandi'o»?", options: ["Maíz", "Mandioca", "Maní", "Batata"], answer: "Mandioca" },
      { prompt: "«Avati» significa…", options: ["Maíz", "Poroto", "Zapallo", "Yerba"], answer: "Maíz" },
      { prompt: "¿Cómo se dice «poroto»?", options: ["Kumanda", "Jety", "Manduvi", "Andai"], answer: "Kumanda" },
      { prompt: "«Jety» es…", options: ["Batata", "Mandioca", "Maní", "Zapallo"], answer: "Batata" },
    ],
  },
  {
    slug: "agro-mymba",
    emoji: "🐄",
    title: "Mymba (Ganado y animales de granja)",
    subtitle: "Animales de la producción pecuaria",
    explanation:
      "«Mymba» designa a los animales domésticos y de cría. En la producción pecuaria se usan estos nombres para hablar del cuidado, la alimentación y la sanidad animal.",
    vocab: [
      { gn: "Mymba", es: "Animal doméstico / de cría" },
      { gn: "Vaka", es: "Vaca" },
      { gn: "Kure", es: "Cerdo" },
      { gn: "Ryguasu", es: "Gallina" },
      { gn: "Kavaju", es: "Caballo" },
      { gn: "Kamby", es: "Leche" },
      { gn: "Ryguasu rupi'a", es: "Huevo de gallina" },
    ],
    quiz: [
      { prompt: "¿Qué significa «Kure»?", options: ["Cerdo", "Vaca", "Caballo", "Gallina"], answer: "Cerdo" },
      { prompt: "«Ryguasu» es…", options: ["Gallina", "Pato", "Cerdo", "Oveja"], answer: "Gallina" },
      { prompt: "¿Cómo se dice «leche»?", options: ["Kamby", "Y", "Kesu", "Rupi'a"], answer: "Kamby" },
      { prompt: "«Kavaju» significa…", options: ["Caballo", "Vaca", "Perro", "Toro"], answer: "Caballo" },
    ],
  },
  {
    slug: "agro-tembiapo",
    emoji: "🧑‍🌾",
    title: "Tembiapo kokuépe (Trabajo en la chacra)",
    subtitle: "Acciones del día a día del productor",
    explanation:
      "«Tembiapo» es trabajo. Estas palabras describen las tareas de la chacra: sembrar, carpir, regar y cosechar. Sirven para dar indicaciones claras en las prácticas de campo.",
    vocab: [
      { gn: "Tembiapo", es: "Trabajo" },
      { gn: "Ñemitỹ", es: "Sembrar / siembra" },
      { gn: "Ñemono'õ", es: "Cosecha" },
      { gn: "Mba'apohára", es: "Trabajador" },
      { gn: "Aramirõ", es: "Arroz" },
      { gn: "Ka'aguy", es: "Monte / bosque" },
    ],
    quiz: [
      { prompt: "¿Qué significa «Tembiapo»?", options: ["Trabajo", "Descanso", "Comida", "Casa"], answer: "Trabajo" },
      { prompt: "«Ñemono'õ» es…", options: ["Cosecha", "Siembra", "Riego", "Venta"], answer: "Cosecha" },
      { prompt: "«Ka'aguy» se refiere a…", options: ["Monte / bosque", "Río", "Chacra", "Pueblo"], answer: "Monte / bosque" },
      { prompt: "«Mba'apohára» significa…", options: ["Trabajador", "Maestro", "Vendedor", "Médico"], answer: "Trabajador" },
    ],
  },
];
