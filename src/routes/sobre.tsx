import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Jaikuaa — Nuestra misión" },
      { name: "description", content: "Jaikuaa, la plataforma paraguaya para aprender idiomas con el guaraní en el corazón." },
      { property: "og:title", content: "Sobre Jaikuaa" },
      { property: "og:description", content: "Hecho en Paraguay 🇵🇾 con amor por nuestra lengua." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Nuestra misión
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Sobre <span className="text-accent">Jaikuaa</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Jaikuaa es una plataforma paraguaya creada para preservar, enseñar y hacer crecer el guaraní y otros idiomas, con orgullo y identidad nacional.
            </p>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
            <ValueCard emoji="🌱" title="Preservar">
              Cuidar el guaraní como tesoro vivo de nuestra cultura.
            </ValueCard>
            <ValueCard emoji="🎓" title="Enseñar">
              Ofrecer una forma moderna, clara y divertida de aprender.
            </ValueCard>
            <ValueCard emoji="🌎" title="Hacer crecer">
              Conectar a Paraguay con el mundo desde nuestra identidad.
            </ValueCard>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-12">
            <p className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Hecho en Paraguay <span aria-hidden>🇵🇾</span> con amor por nuestra lengua.
            </p>
            <p className="mt-4 text-base text-muted-foreground">
              Creemos que cada paraguayo y paraguaya merece aprender en su idioma, con su gente y desde su cultura. Aprendé · Hablá · Ñane Ñe'ẽ.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="cta" size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>Empezar gratis</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/">Volver al inicio</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ValueCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-elegant card-hover">
      <div className="text-4xl" aria-hidden>{emoji}</div>
      <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
