type NewsItem = {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: "Cultura" | "Educación" | "Comunidad";
  emoji: string;
  source: string;
};

const NEWS: NewsItem[] = [
  {
    id: "arandupy-2026",
    title: "AranduPy 2026: premio a la mejor investigación lingüística",
    summary:
      "La SPL lanza la tercera edición del premio AranduPy, que reconoce estudios sobre la riqueza lingüística del Paraguay. Primer premio: G. 10.000.000.",
    date: "Mayo 2026",
    category: "Cultura",
    emoji: "🏆",
    source: "Fuente: Paraguay TV",
  },
  {
    id: "rincon-spl",
    title: "La Biblioteca Nacional tendrá un 'Rincón SPL'",
    summary:
      "El ministro de la SPL, Javier Viveros, y la Biblioteca Nacional acordaron crear un 'Rincón SPL' con publicaciones sobre la diversidad lingüística del país.",
    date: "Mayo 2026",
    category: "Cultura",
    emoji: "📚",
    source: "Fuente: SPL",
  },
  {
    id: "diccionario-monolingue",
    title: "Nuevo diccionario monolingüe de la lengua guaraní",
    summary:
      "La Academia de la Lengua Guaraní presentó una versión corregida y aumentada del Diccionario de la Lengua Guaraní, que describe el idioma en la propia lengua y rescata su uso actual.",
    date: "2026",
    category: "Educación",
    emoji: "📖",
    source: "Fuente: Academia de la Lengua Guaraní",
  },
  {
    id: "convenio-chaco",
    title: "Convenio para revitalizar lenguas indígenas del Chaco",
    summary:
      "La SPL firmó un Convenio Marco de Cooperación con la Coordinadora de Líderes y Lideresas Indígenas del Bajo Chaco, para promover y revitalizar las lenguas indígenas.",
    date: "Abril 2026",
    category: "Comunidad",
    emoji: "🤝",
    source: "Fuente: SPL",
  },
  {
    id: "cancilleria-guarani",
    title: "La Cancillería y la Academia difunden el guaraní en el exterior",
    summary:
      "El Ministerio de Relaciones Exteriores y la Academia de la Lengua Guaraní firmaron un convenio para promover la lengua guaraní en embajadas y consulados.",
    date: "2026",
    category: "Cultura",
    emoji: "🌐",
    source: "Fuente: MRE Paraguay",
  },
  {
    id: "decenio-lenguas-indigenas",
    title: "Paraguay y el Decenio Internacional de las Lenguas Indígenas",
    summary:
      "En el marco del Decenio Internacional de las Lenguas Indígenas de la UNESCO (2022-2032), Paraguay impulsa la preservación y revitalización de sus lenguas, entre ellas el guaraní.",
    date: "2022-2032",
    category: "Educación",
    emoji: "🌍",
    source: "Fuente: UNESCO / SPL",
  },
];

const CATEGORY_STYLES: Record<NewsItem["category"], string> = {
  Cultura: "bg-accent/15 text-accent",
  Educación: "bg-emerald-100 text-emerald-700",
  Comunidad: "bg-amber-100 text-amber-800",
};


export function NhandeMarandu() {
  return (
    <section className="mt-12 select-none" style={{ WebkitTouchCallout: "none" }}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Ñande Marandu <span aria-hidden>📰</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Noticias de nuestra lengua.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NEWS.map((n) => (
          <article
            key={n.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-elegant card-hover hover:shadow-lift select-none"
            style={{ WebkitTouchCallout: "none" }}
          >
            <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-muted text-5xl" aria-hidden>
              {n.emoji}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide select-none ${CATEGORY_STYLES[n.category]}`}
                  style={{ WebkitTouchCallout: "none" }}
                >
                  {n.category}
                </span>
                <span className="text-xs text-muted-foreground select-none" style={{ WebkitTouchCallout: "none" }}>{n.date}</span>
              </div>
              <h3 className="font-display text-lg font-bold leading-snug text-foreground select-none" style={{ WebkitTouchCallout: "none" }}>
                {n.title}
              </h3>
              <p className="text-sm text-muted-foreground select-none" style={{ WebkitTouchCallout: "none" }}>{n.summary}</p>
              <div className="mt-auto pt-2">
                <span className="text-[10px] font-medium text-muted-foreground/80 select-none" style={{ WebkitTouchCallout: "none" }}>
                  {n.source}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
