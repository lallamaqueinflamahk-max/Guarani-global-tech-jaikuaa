type NewsItem = {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: "Cultura" | "Educación" | "Comunidad";
  emoji: string;
};

const NEWS: NewsItem[] = [
  {
    id: "spl-corpus-2026",
    title: "SPL actualiza corpus de guaraní 2026",
    summary:
      "La Secretaría de Políticas Lingüísticas presenta la actualización anual del corpus oficial con nuevas entradas léxicas.",
    date: "2 de julio, 2026",
    category: "SPL",
    emoji: "📚",
  },
  {
    id: "palabras-tec",
    title: "Nuevas palabras tecnológicas en guaraní",
    summary:
      "Ateneo de Lengua y Cultura Guaraní publica términos para 'nube', 'algoritmo' y 'inteligencia artificial'.",
    date: "28 de junio, 2026",
    category: "Cultura",
    emoji: "💻",
  },
  {
    id: "dia-lengua",
    title: "Día de la Lengua Guaraní: eventos en Asunción",
    summary:
      "Conciertos, ferias y charlas gratuitas se realizarán en la Costanera y el Cabildo durante toda la semana.",
    date: "25 de agosto, 2026",
    category: "Comunidad",
    emoji: "🎉",
  },
  {
    id: "escuelas-bilingues",
    title: "Más escuelas se suman al programa bilingüe",
    summary:
      "El MEC anuncia la incorporación de 120 instituciones al programa de educación bilingüe guaraní-español.",
    date: "18 de junio, 2026",
    category: "Educación",
    emoji: "🎒",
  },
];

const CATEGORY_STYLES: Record<NewsItem["category"], string> = {
  SPL: "bg-primary/10 text-primary",
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
                <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground select-none" style={{ WebkitTouchCallout: "none" }}>
                  ⚠️ Información en proceso de validación con la SPL
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
