import type { Tema } from "./guarani-tema";

// Contenido redactado como borrador pedagógico; pendiente de validación docente
// (la sección muestra ValidationNotice).

export const TEMAS_3RO: Tema[] = [
  {
    slug: "colores",
    emoji: "🎨",
    title: "Los colores (Sa'ykuéra)",
    subtitle: "Nombrar los colores de las cosas",
    explanation:
      "«Sa'y» significa «color». Para decir que algo tiene un color se usa el prefijo «h-» o «i-»: «hovy» (azul), «pytã» (rojo), «morotĩ» (blanco). Ejemplo: «Pe ita morotĩ» = «Esa piedra es blanca».",
    vocab: [
      { gn: "Pytã", es: "Rojo" },
      { gn: "Hovy", es: "Azul" },
      { gn: "Sa'yju", es: "Amarillo" },
      { gn: "Hovyũ", es: "Verde" },
      { gn: "Morotĩ", es: "Blanco" },
      { gn: "Hũ", es: "Negro" },
    ],
    quiz: [
      { prompt: "¿Cómo se dice «rojo»?", options: ["Hovy", "Pytã", "Hũ", "Morotĩ"], answer: "Pytã" },
      { prompt: "«Morotĩ» significa…", options: ["Negro", "Blanco", "Verde", "Azul"], answer: "Blanco" },
      { prompt: "El color del cielo de día es…", options: ["Hovy", "Pytã", "Sa'yju", "Hũ"], answer: "Hovy" },
      { prompt: "«Sa'y» significa…", options: ["Sol", "Color", "Casa", "Agua"], answer: "Color" },
      { prompt: "«Hũ» es…", options: ["Negro", "Amarillo", "Rojo", "Blanco"], answer: "Negro" },
    ],
  },
  {
    slug: "mymba",
    emoji: "🐄",
    title: "Los animales (Mymbakuéra)",
    subtitle: "Animales de la casa y del campo",
    explanation:
      "«Mymba» significa «animal doméstico». Muchos nombres de animales en guaraní se usan todos los días en Paraguay: «jagua» (perro), «mbarakaja» (gato), «vaka» (vaca).",
    vocab: [
      { gn: "Jagua", es: "Perro" },
      { gn: "Mbarakaja", es: "Gato" },
      { gn: "Vaka", es: "Vaca" },
      { gn: "Ryguasu", es: "Gallina" },
      { gn: "Kavaju", es: "Caballo" },
      { gn: "Pira", es: "Pez" },
    ],
    quiz: [
      { prompt: "¿Cómo se dice «perro»?", options: ["Mbarakaja", "Jagua", "Vaka", "Pira"], answer: "Jagua" },
      { prompt: "«Ryguasu» es…", options: ["Gallina", "Caballo", "Gato", "Pez"], answer: "Gallina" },
      { prompt: "«Mbarakaja» significa…", options: ["Perro", "Vaca", "Gato", "Pájaro"], answer: "Gato" },
      { prompt: "El animal que vive en el agua es…", options: ["Kavaju", "Pira", "Jagua", "Vaka"], answer: "Pira" },
      { prompt: "«Mymba» significa…", options: ["Animal doméstico", "Árbol", "Comida", "Casa"], answer: "Animal doméstico" },
    ],
  },
  {
    slug: "hete",
    emoji: "🧒",
    title: "El cuerpo (Ñande rete)",
    subtitle: "Partes del cuerpo humano",
    explanation:
      "«Ñande rete» significa «nuestro cuerpo». Las partes del cuerpo cambian su primera letra según el dueño: «che akã» (mi cabeza), «nde po» (tu mano).",
    vocab: [
      { gn: "Akã", es: "Cabeza" },
      { gn: "Po", es: "Mano" },
      { gn: "Py", es: "Pie" },
      { gn: "Resa", es: "Ojo" },
      { gn: "Juru", es: "Boca" },
      { gn: "Apysa", es: "Oreja" },
    ],
    quiz: [
      { prompt: "¿Cómo se dice «cabeza»?", options: ["Py", "Akã", "Juru", "Po"], answer: "Akã" },
      { prompt: "«Po» significa…", options: ["Pie", "Mano", "Ojo", "Boca"], answer: "Mano" },
      { prompt: "Con la «juru» hablamos. «Juru» es…", options: ["Oreja", "Boca", "Ojo", "Nariz"], answer: "Boca" },
      { prompt: "«Py» significa…", options: ["Pie", "Cabeza", "Mano", "Oreja"], answer: "Pie" },
      { prompt: "«Ñande rete» significa…", options: ["Nuestra casa", "Nuestro cuerpo", "Nuestra escuela", "Nuestra familia"], answer: "Nuestro cuerpo" },
    ],
  },
  {
    slug: "mbo-ehao",
    emoji: "✏️",
    title: "En la escuela (Mbo'ehaópe)",
    subtitle: "Útiles y lugares del aula",
    explanation:
      "«Mbo'ehao» significa «escuela» (lugar donde se enseña). «Mbo'ehára» es el docente y «temimbo'e» el alumno.",
    vocab: [
      { gn: "Mbo'ehao", es: "Escuela" },
      { gn: "Mbo'ehára", es: "Docente" },
      { gn: "Temimbo'e", es: "Alumno/a" },
      { gn: "Kuatiañe'ẽ", es: "Libro" },
      { gn: "Haiha", es: "Lápiz / bolígrafo" },
      { gn: "Kuatia", es: "Papel" },
    ],
    quiz: [
      { prompt: "¿Cómo se dice «escuela»?", options: ["Óga", "Mbo'ehao", "Kokue", "Tape"], answer: "Mbo'ehao" },
      { prompt: "«Mbo'ehára» es…", options: ["Alumno", "Docente", "Libro", "Papá"], answer: "Docente" },
      { prompt: "Escribimos con un…", options: ["Haiha", "Kuatia", "Mesa", "Py"], answer: "Haiha" },
      { prompt: "«Temimbo'e» significa…", options: ["Alumno/a", "Docente", "Escuela", "Libro"], answer: "Alumno/a" },
      { prompt: "«Kuatiañe'ẽ» es…", options: ["Lápiz", "Libro", "Silla", "Pizarra"], answer: "Libro" },
    ],
  },
  {
    slug: "oga",
    emoji: "🏠",
    title: "La casa (Óga)",
    subtitle: "Cosas y lugares de la casa",
    explanation:
      "«Óga» significa «casa». Con el sufijo «-pe» decimos «en»: «ógape» = «en la casa». Así: «Che aime ógape» = «Yo estoy en casa».",
    vocab: [
      { gn: "Óga", es: "Casa" },
      { gn: "Okẽ", es: "Puerta" },
      { gn: "Ovetã", es: "Ventana" },
      { gn: "Tata", es: "Fuego" },
      { gn: "Y", es: "Agua" },
      { gn: "Ógape", es: "En la casa" },
    ],
    quiz: [
      { prompt: "«Óga» significa…", options: ["Casa", "Puerta", "Agua", "Fuego"], answer: "Casa" },
      { prompt: "¿Cómo se dice «puerta»?", options: ["Ovetã", "Okẽ", "Tata", "Y"], answer: "Okẽ" },
      { prompt: "«Y» significa…", options: ["Fuego", "Agua", "Sol", "Tierra"], answer: "Agua" },
      { prompt: "El sufijo «-pe» en «ógape» significa…", options: ["De", "En", "Con", "Para"], answer: "En" },
      { prompt: "«Ovetã» es…", options: ["Ventana", "Mesa", "Techo", "Patio"], answer: "Ventana" },
    ],
  },
  {
    slug: "ordenes",
    emoji: "🙋",
    title: "Órdenes en clase",
    subtitle: "Lo que dice la profe en el aula",
    explanation:
      "Para dar una orden a una persona se usa el prefijo «e-»: «eguapy» (sentate), «epu'ã» (levantate), «ehendu» (escuchá). Para varias personas se usa «pe-»: «pejapysaka» (presten atención).",
    vocab: [
      { gn: "Eguapy", es: "Sentate" },
      { gn: "Epu'ã", es: "Levantate" },
      { gn: "Ehendu", es: "Escuchá" },
      { gn: "Emoñe'ẽ", es: "Leé" },
      { gn: "Ehai", es: "Escribí" },
      { gn: "Eju ko'ápe", es: "Vení acá" },
    ],
    quiz: [
      { prompt: "«Eguapy» significa…", options: ["Levantate", "Sentate", "Escribí", "Leé"], answer: "Sentate" },
      { prompt: "Para decir «escuchá», la profe dice…", options: ["Ehendu", "Ehai", "Epu'ã", "Emoñe'ẽ"], answer: "Ehendu" },
      { prompt: "«Ehai» es…", options: ["Leé", "Escribí", "Dibujá", "Cantá"], answer: "Escribí" },
      { prompt: "El prefijo de orden para una persona es…", options: ["a-", "e-", "o-", "ja-"], answer: "e-" },
      { prompt: "«Epu'ã» significa…", options: ["Levantate", "Sentate", "Vení", "Andá"], answer: "Levantate" },
    ],
  },
];

export const TEMAS_9NO: Tema[] = [
  {
    slug: "triformes",
    emoji: "🔤",
    title: "Sustantivos triformes",
    subtitle: "Palabras que cambian con t-, r-, h-",
    explanation:
      "Algunos sustantivos cambian su consonante inicial según el poseedor: forma absoluta con «t-» (tetã: país), forma relacionada con «r-» (che retã: mi país) y forma de tercera persona con «h-» (hetã: su país).",
    vocab: [
      { gn: "Tete / che rete / hete", es: "Cuerpo / mi cuerpo / su cuerpo" },
      { gn: "Tetã / che retã / hetã", es: "País / mi país / su país" },
      { gn: "Tesa / che resa / hesa", es: "Ojo / mi ojo / su ojo" },
      { gn: "Tembiapo / che rembiapo / hembiapo", es: "Trabajo / mi trabajo / su trabajo" },
    ],
    quiz: [
      { prompt: "«Che retã» significa…", options: ["Su país", "Mi país", "País", "Tu cuerpo"], answer: "Mi país" },
      { prompt: "La forma de tercera persona usa…", options: ["t-", "r-", "h-", "ñ-"], answer: "h-" },
      { prompt: "La forma absoluta empieza con…", options: ["t-", "r-", "h-", "m-"], answer: "t-" },
      { prompt: "«Hesa» significa…", options: ["Mi ojo", "Su ojo", "Ojo", "Tu ojo"], answer: "Su ojo" },
      { prompt: "Completá: che ___embiapo", options: ["t", "r", "h", "j"], answer: "r" },
    ],
  },
  {
    slug: "chendales",
    emoji: "🧩",
    title: "Verbos areales y chendales",
    subtitle: "Dos formas de conjugar",
    explanation:
      "Los verbos areales usan a-, re-, o-, ja/ña-, ro-, pe-, o- (ajapo, rejapo, ojapo). Los chendales (aireales/predicados de estado) usan che, nde, i/hi, ñande, ore, pende (che kane'õ: estoy cansado).",
    vocab: [
      { gn: "Aguata", es: "Yo camino (areal)" },
      { gn: "Reguata", es: "Vos caminás" },
      { gn: "Oguata", es: "Él/ella camina" },
      { gn: "Che kane'õ", es: "Estoy cansado (chendal)" },
      { gn: "Nde vy'a", es: "Estás alegre" },
      { gn: "Ivy'a", es: "Él/ella está alegre" },
    ],
    quiz: [
      { prompt: "«Oguata» corresponde a…", options: ["Yo", "Vos", "Él/ella", "Nosotros"], answer: "Él/ella" },
      { prompt: "«Che kane'õ» es un verbo…", options: ["Areal", "Chendal", "Aireal", "Irregular"], answer: "Chendal" },
      { prompt: "El prefijo areal de 1ª persona singular es…", options: ["a-", "re-", "o-", "pe-"], answer: "a-" },
      { prompt: "«Nde vy'a» significa…", options: ["Estoy alegre", "Estás alegre", "Está alegre", "Estamos alegres"], answer: "Estás alegre" },
      { prompt: "«Reguata» significa…", options: ["Yo camino", "Vos caminás", "Ellos caminan", "Caminemos"], answer: "Vos caminás" },
    ],
  },
  {
    slug: "tiempos",
    emoji: "⏳",
    title: "Tiempos verbales",
    subtitle: "Pasado, presente y futuro",
    explanation:
      "El presente no lleva marca: «ahai» (escribo). El futuro se marca con «-ta»: «ahaíta» (escribiré). El pasado se puede marcar con «-va'ekue»: «ahaiva'ekue» (escribí, hace tiempo).",
    vocab: [
      { gn: "Ahai", es: "Escribo" },
      { gn: "Ahaíta", es: "Escribiré" },
      { gn: "Ahaiva'ekue", es: "Escribí (pasado remoto)" },
      { gn: "Ahasáta", es: "Pasaré" },
      { gn: "-ta", es: "Marca de futuro" },
    ],
    quiz: [
      { prompt: "El sufijo de futuro es…", options: ["-ta", "-va'ekue", "-pe", "-kuéra"], answer: "-ta" },
      { prompt: "«Ahaíta» significa…", options: ["Escribo", "Escribiré", "Escribí", "Escribía"], answer: "Escribiré" },
      { prompt: "«-va'ekue» marca…", options: ["Futuro", "Pasado", "Plural", "Lugar"], answer: "Pasado" },
      { prompt: "«Ahai» está en…", options: ["Presente", "Futuro", "Pasado", "Imperativo"], answer: "Presente" },
      { prompt: "«Ahasáta» significa…", options: ["Pasé", "Paso", "Pasaré", "Pasá"], answer: "Pasaré" },
    ],
  },
  {
    slug: "acentuacion",
    emoji: "✒️",
    title: "Acento y nasalidad",
    subtitle: "Tilde, puso y vocales nasales",
    explanation:
      "Las palabras guaraníes son mayormente agudas y no llevan tilde si el acento cae en la última sílaba. Se marca la tilde cuando el acento no está al final (ej.: «óga»). La tilde nasal (~) marca vocales nasales (ã, ẽ, ĩ, õ, ũ, ỹ) y el puso (') es una consonante: «ka'a».",
    vocab: [
      { gn: "Ka'a", es: "Yerba (puso entre vocales)" },
      { gn: "Óga", es: "Casa (tilde fuera de la última sílaba)" },
      { gn: "Ñe'ẽ", es: "Palabra / idioma (nasal + puso)" },
      { gn: "Puso (')", es: "Consonante oclusiva glotal" },
      { gn: "Tilde nasal (~)", es: "Marca vocal nasal" },
    ],
    quiz: [
      { prompt: "En guaraní, el puso (') es…", options: ["Un adorno", "Una consonante", "Una vocal", "Un acento"], answer: "Una consonante" },
      { prompt: "La mayoría de las palabras guaraníes son…", options: ["Agudas", "Graves", "Esdrújulas", "Sin acento"], answer: "Agudas" },
      { prompt: "¿Por qué «óga» lleva tilde?", options: ["Es nasal", "El acento no cae al final", "Tiene puso", "Es plural"], answer: "El acento no cae al final" },
      { prompt: "La «~» sobre una vocal indica…", options: ["Nasalidad", "Plural", "Pasado", "Pregunta"], answer: "Nasalidad" },
      { prompt: "¿Cuál palabra tiene puso?", options: ["Óga", "Ka'a", "Py", "Akã"], answer: "Ka'a" },
    ],
  },
  {
    slug: "conectores",
    emoji: "🔗",
    title: "Conectores (Ñe'ẽjoajuha)",
    subtitle: "Unir ideas en oraciones",
    explanation:
      "Los conectores unen oraciones: «ha» (y), «térã» (o), «katu» (pero/en cambio), «upévare» (por eso), «ndaha'éi… ha'e» (no es… sino).",
    vocab: [
      { gn: "Ha", es: "Y" },
      { gn: "Térã", es: "O" },
      { gn: "Katu", es: "Pero / en cambio" },
      { gn: "Upévare", es: "Por eso" },
      { gn: "Avei", es: "También" },
    ],
    quiz: [
      { prompt: "«Ha» significa…", options: ["O", "Y", "Pero", "Por eso"], answer: "Y" },
      { prompt: "«Upévare» significa…", options: ["Por eso", "También", "O", "Cuando"], answer: "Por eso" },
      { prompt: "Para decir «o» se usa…", options: ["Ha", "Térã", "Avei", "Katu"], answer: "Térã" },
      { prompt: "«Avei» significa…", options: ["Nunca", "También", "Ahora", "Pero"], answer: "También" },
      { prompt: "«Katu» expresa…", options: ["Contraste", "Suma", "Causa", "Tiempo"], answer: "Contraste" },
    ],
  },
  {
    slug: "plural",
    emoji: "👥",
    title: "Plural y posesivos",
    subtitle: "-kuéra / -nguéra y che, nde, ñande, ore",
    explanation:
      "El plural se forma con «-kuéra» (o «-nguéra» después de vocal nasal): «óga» → «ogakuéra», «mitã» → «mitãnguéra». Existen dos «nosotros»: «ñande» (incluye al oyente) y «ore» (lo excluye).",
    vocab: [
      { gn: "Ogakuéra", es: "Casas" },
      { gn: "Mitãnguéra", es: "Niños" },
      { gn: "Ñande", es: "Nosotros (inclusivo)" },
      { gn: "Ore", es: "Nosotros (exclusivo)" },
      { gn: "Pende", es: "Ustedes" },
    ],
    quiz: [
      { prompt: "El plural de «óga» es…", options: ["Ogakuéra", "Oganguéra", "Ogas", "Ogape"], answer: "Ogakuéra" },
      { prompt: "«Ñande» incluye al oyente…", options: ["Sí", "No"], answer: "Sí" },
      { prompt: "Después de vocal nasal, el plural es…", options: ["-kuéra", "-nguéra", "-pe", "-ta"], answer: "-nguéra" },
      { prompt: "«Ore» significa…", options: ["Nosotros (exclusivo)", "Ustedes", "Ellos", "Nosotros (inclusivo)"], answer: "Nosotros (exclusivo)" },
      { prompt: "«Pende» es…", options: ["Vos", "Ustedes", "Yo", "Ellos"], answer: "Ustedes" },
    ],
  },
];

export const TEMAS_BACH: Tema[] = [
  {
    slug: "ley-4251",
    emoji: "⚖️",
    title: "Ley de Lenguas 4.251/10",
    subtitle: "Derechos lingüísticos en Paraguay",
    explanation:
      "La Ley 4.251/10 reglamenta el artículo 140 de la Constitución: Paraguay es un país pluricultural y bilingüe, con el castellano y el guaraní como idiomas oficiales. Crea la Secretaría de Políticas Lingüísticas y la Academia de la Lengua Guaraní.",
    vocab: [
      { gn: "Ñe'ẽ", es: "Lengua / idioma" },
      { gn: "Léi", es: "Ley" },
      { gn: "Tekoporã", es: "Buen vivir" },
      { gn: "Tetã", es: "País / nación" },
    ],
    quiz: [
      { prompt: "La Ley 4.251 es la Ley de…", options: ["Educación", "Lenguas", "Tránsito", "Salud"], answer: "Lenguas" },
      { prompt: "Los idiomas oficiales de Paraguay son…", options: ["Solo castellano", "Castellano y guaraní", "Solo guaraní", "Guaraní y portugués"], answer: "Castellano y guaraní" },
      { prompt: "La ley reglamenta el artículo … de la Constitución", options: ["77", "140", "1", "200"], answer: "140" },
      { prompt: "¿Qué institución crea la ley?", options: ["La Academia de la Lengua Guaraní", "El MEC", "La ANDE", "El Senado"], answer: "La Academia de la Lengua Guaraní" },
      { prompt: "«Ñe'ẽ» significa…", options: ["Ley", "Lengua / idioma", "País", "Escuela"], answer: "Lengua / idioma" },
    ],
  },
  {
    slug: "literatura",
    emoji: "📜",
    title: "Literatura guaraní (Ñe'ẽpoty)",
    subtitle: "Poesía y autores paraguayos",
    explanation:
      "«Ñe'ẽpoty» (flor de la palabra) es la poesía. Autores como Emiliano R. Fernández, Manuel Ortiz Guerrero y Susy Delgado marcaron la literatura en guaraní, con temas de patria, amor y naturaleza.",
    vocab: [
      { gn: "Ñe'ẽpoty", es: "Poesía" },
      { gn: "Mombe'urã", es: "Narración / relato" },
      { gn: "Purahéi", es: "Canción" },
      { gn: "Ñe'ẽpapára", es: "Poeta" },
    ],
    quiz: [
      { prompt: "«Ñe'ẽpoty» significa…", options: ["Canción", "Poesía", "Leyenda", "Novela"], answer: "Poesía" },
      { prompt: "«Purahéi» es…", options: ["Canción", "Cuento", "Teatro", "Dicho"], answer: "Canción" },
      { prompt: "¿Quién es un poeta en guaraní de Paraguay?", options: ["Emiliano R. Fernández", "Pablo Neruda", "Rubén Darío", "Borges"], answer: "Emiliano R. Fernández" },
      { prompt: "«Mombe'urã» significa…", options: ["Relato", "Poema", "Ley", "Palabra"], answer: "Relato" },
      { prompt: "Literalmente, «ñe'ẽpoty» es…", options: ["Flor de la palabra", "Voz del río", "Palabra antigua", "Canto del pájaro"], answer: "Flor de la palabra" },
    ],
  },
  {
    slug: "mitos",
    emoji: "🌙",
    title: "Mitos y leyendas",
    subtitle: "Tradición oral paraguaya",
    explanation:
      "La mitología guaraní incluye a los hijos de Tau y Kerana: Jasy Jatere, Kurupi, Luisõ, Teju Jagua, entre otros. Estos relatos forman parte de la tradición oral (mombe'u) que se estudia en Educación Media.",
    vocab: [
      { gn: "Jasy Jatere", es: "Ser mítico de la siesta" },
      { gn: "Kurupi", es: "Ser mítico del monte" },
      { gn: "Teju Jagua", es: "Primer hijo de Tau y Kerana" },
      { gn: "Mombe'u", es: "Relato oral" },
    ],
    quiz: [
      { prompt: "Los siete monstruos son hijos de…", options: ["Tau y Kerana", "Tupã y Arasy", "Jasy y Kuarahy", "Pombero y Pora"], answer: "Tau y Kerana" },
      { prompt: "El personaje de la siesta es…", options: ["Jasy Jatere", "Kurupi", "Teju Jagua", "Luisõ"], answer: "Jasy Jatere" },
      { prompt: "«Mombe'u» significa…", options: ["Relato oral", "Canción", "Escuela", "Libro"], answer: "Relato oral" },
      { prompt: "El primer hijo de Tau y Kerana es…", options: ["Teju Jagua", "Kurupi", "Luisõ", "Jasy Jatere"], answer: "Teju Jagua" },
      { prompt: "Estos relatos pertenecen a la tradición…", options: ["Oral", "Escrita europea", "Digital", "Científica"], answer: "Oral" },
    ],
  },
  {
    slug: "sintaxis",
    emoji: "🧠",
    title: "Análisis de la oración",
    subtitle: "Sujeto, verbo y complemento",
    explanation:
      "En guaraní el orden más común es Sujeto–Verbo–Objeto: «Che ahai kuatia» (Yo escribo una carta). El verbo ya lleva la persona en su prefijo, por eso el sujeto puede omitirse: «Ahai kuatia».",
    vocab: [
      { gn: "Ñe'ẽjoaju", es: "Oración" },
      { gn: "Teroja", es: "Sujeto" },
      { gn: "Ñe'ẽtéva", es: "Verbo" },
      { gn: "Ñe'ẽjoapy", es: "Complemento" },
    ],
    quiz: [
      { prompt: "En «Che ahai kuatia», el verbo es…", options: ["Che", "Ahai", "Kuatia"], answer: "Ahai" },
      { prompt: "¿Se puede omitir el sujeto?", options: ["Sí, el verbo indica la persona", "No, nunca"], answer: "Sí, el verbo indica la persona" },
      { prompt: "«Ñe'ẽtéva» significa…", options: ["Verbo", "Sujeto", "Oración", "Adjetivo"], answer: "Verbo" },
      { prompt: "El orden más común es…", options: ["S-V-O", "V-O-S", "O-S-V", "O-V-S"], answer: "S-V-O" },
      { prompt: "En «Che ahai kuatia», el objeto es…", options: ["Che", "Ahai", "Kuatia"], answer: "Kuatia" },
    ],
  },
  {
    slug: "jopara",
    emoji: "🔀",
    title: "Guaraní, jopara y préstamos",
    subtitle: "Interferencia y neologismos",
    explanation:
      "El «jopara» es la mezcla de guaraní y castellano en el habla cotidiana. La enseñanza formal promueve el guaraní cuidado y los neologismos (palabras nuevas) en lugar de préstamos innecesarios.",
    vocab: [
      { gn: "Jopara", es: "Mezcla de guaraní y castellano" },
      { gn: "Ñe'ẽpyahu", es: "Neologismo" },
      { gn: "Ñe'ẽ jeporu", es: "Uso de la lengua" },
      { gn: "Mohendahára", es: "Computadora (neologismo)" },
    ],
    quiz: [
      { prompt: "«Jopara» es…", options: ["Una comida y la mezcla de idiomas", "Un mito", "Un verbo", "Un número"], answer: "Una comida y la mezcla de idiomas" },
      { prompt: "Un neologismo es…", options: ["Una palabra nueva", "Una palabra antigua", "Un error", "Un plural"], answer: "Una palabra nueva" },
      { prompt: "«Ñe'ẽpyahu» significa…", options: ["Neologismo", "Préstamo", "Poesía", "Ley"], answer: "Neologismo" },
      { prompt: "La enseñanza formal promueve…", options: ["El guaraní cuidado", "Solo el jopara", "Solo castellano", "Ningún idioma"], answer: "El guaraní cuidado" },
      { prompt: "«Mohendahára» se propone para…", options: ["Computadora", "Teléfono", "Auto", "Radio"], answer: "Computadora" },
    ],
  },
  {
    slug: "redaccion",
    emoji: "📝",
    title: "Redacción formal",
    subtitle: "Escribir una nota en guaraní",
    explanation:
      "Una nota formal tiene: lugar y fecha, saludo («Mborayhúpe», «Che mbo'eharakuéra»), cuerpo con el pedido y despedida («Aguyje», «Ndéve guarã»). Se cuida la ortografía oficial: puso, nasalidad y tilde.",
    vocab: [
      { gn: "Kuatia", es: "Carta / documento" },
      { gn: "Jehaipyre", es: "Escrito / texto" },
      { gn: "Aguyje", es: "Gracias" },
      { gn: "Jajotopata", es: "Hasta pronto" },
    ],
    quiz: [
      { prompt: "Una nota formal empieza con…", options: ["Lugar y fecha", "La firma", "Un chiste", "La despedida"], answer: "Lugar y fecha" },
      { prompt: "«Jehaipyre» significa…", options: ["Texto escrito", "Canción", "Saludo", "Escuela"], answer: "Texto escrito" },
      { prompt: "Para agradecer se escribe…", options: ["Aguyje", "Mba'éichapa", "Jajotopata", "Ehendu"], answer: "Aguyje" },
      { prompt: "En la redacción formal se cuida…", options: ["La ortografía oficial", "Solo la letra linda", "El jopara", "Nada"], answer: "La ortografía oficial" },
      { prompt: "«Kuatia» puede significar…", options: ["Carta / documento", "Lápiz", "Mesa", "Puerta"], answer: "Carta / documento" },
    ],
  },
];
