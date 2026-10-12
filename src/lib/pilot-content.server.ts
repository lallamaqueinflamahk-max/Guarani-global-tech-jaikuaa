/**
 * Texto de la página del piloto. Vive solo en el servidor: mientras la página está
 * en Borrador, el texto no llega al navegador de nadie salvo el admin.
 * Única mención institucional permitida: INSTITUTIONAL_LINE (no cambiar su redacción).
 */
export const INSTITUTIONAL_LINE =
  "Jaikuaa desarrolla un plan piloto con el Ateneo de Lengua y Cultura Guaraní";

export const PILOT_CONTENT = {
  welcome: {
    title: "Bienvenidos al plan piloto de Jaikuaa",
    institutional: INSTITUTIONAL_LINE,
    line: "Una herramienta gratuita de apoyo para docentes y estudiantes. Jaikuaa no reemplaza al docente: lo acompaña.",
  },
  timeline: {
    title: "Cómo es el piloto",
    stages: [
      {
        label: "Etapa 0",
        when: "Desde el 30 de noviembre de 2026",
        who: "Con docentes",
        text: "Revisan y validan el vocabulario y prueban lecciones y juegos.",
      },
      {
        label: "Etapa 1",
        when: "Inicio del año lectivo 2027",
        who: "Con estudiantes",
        text: "Si los docentes lo aprueban.",
      },
    ],
    note: "El Ateneo puede pausar el piloto en cualquier momento.",
  },
  teachers: {
    title: "Para docentes: cómo validar en 3 pasos",
    steps: [
      "Creá tu cuenta en Jaikuaa con tu email.",
      "La coordinación te habilita como Docente validador.",
      "Entrá al \"Panel de validación\", filtrá \"Pendientes de validación docente\", revisá cada palabra y su traducción, corregí si hace falta y marcá como validada.",
    ],
    note: "Ninguna palabra se muestra a estudiantes sin la aprobación de un docente.",
  },
  recognition: {
    title: "Reconocimiento",
    items: [
      "Cada palabra validada queda registrada con el nombre del docente.",
      "Certificado conjunto de participación.",
      "Invitación al lanzamiento.",
    ],
    note: "La participación en el piloto no es remunerada. Los encargos especiales de revisión se acuerdan aparte.",
  },
  students: {
    title: "Para estudiantes",
    items: [
      "Lecciones con audio de voces reales.",
      "Juegos: Ahorcado, Sopa de letras, Memoria, Palabra del día y Penales.",
      "Seguimiento de su progreso.",
    ],
    note: "Gratis.",
  },
  data: {
    title: "Tus datos",
    items: [
      "Se usan solo para el funcionamiento del piloto y para medir el uso de forma agregada.",
      "No se venden ni se comparten con terceros.",
      "Se puede pedir la baja de la cuenta.",
    ],
  },
  experimental: {
    title: "Funciones experimentales",
    text: "El Traductor y el Tutor IA no están validados y no forman parte del piloto.",
  },
  contact: {
    title: "Contacto",
    org: "Coordinación del piloto: Guaraní Global Tech E.A.S.",
  },
};

export type PilotContent = typeof PILOT_CONTENT;
