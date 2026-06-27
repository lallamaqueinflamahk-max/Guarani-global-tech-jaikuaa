import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/nhe-rape")({
  head: () => ({
    meta: [
      { title: "Aranduka — Ñe'ẽ Rape" },
      {
        name: "description",
        content: "Homenaje al Prof. Ramón Silva, referente de la lengua guaraní.",
      },
    ],
  }),
  component: NheRape,
});

function NheRape() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-primary"
          >
            <BrandLogo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span aria-hidden>📖</span>
              <span>Ñe'ẽ Rape</span>
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Ñe'ẽ Rape
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              El camino de la palabra
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex flex-col items-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-primary/10 text-5xl ring-4 ring-primary/20">
                <span aria-hidden>🪶</span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prof. Ramón Silva
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Prof. Ramón Silva
              </h2>
              <p className="mt-1 text-base text-primary/90">
                Referente de la lengua guaraní
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border-l-4 border-accent bg-accent/5 p-6 shadow-sm sm:p-8">
            <blockquote className="font-display text-xl font-semibold italic text-foreground sm:text-2xl">
              "El siglo XXI será el siglo de oro del guaraní."
            </blockquote>
          </div>

          <section className="mt-10 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
            <h3 className="font-display text-xl font-bold text-foreground">
              Homenaje
            </h3>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Aranduka honra al Prof. Ramón Silva, referente vivo del guaraní,
              cuya vida dedicada a nuestra lengua inspira este proyecto. Su
              sabiduría y su ejemplo nos guían en la misión de que el guaraní
              viva y crezca.
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-6 text-center sm:p-8">
            <span className="text-3xl" aria-hidden>
              🔜
            </span>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Próximamente: las enseñanzas y reflexiones del Prof. Ramón Silva.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
