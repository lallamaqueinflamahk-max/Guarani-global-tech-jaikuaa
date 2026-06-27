import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/languages";
import { StatsBar, StreakBanner } from "@/components/gamification/stats-bar";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Aranduka — Tu panel" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const fromMeta =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined);
      setName(profile?.full_name || fromMeta || user.email?.split("@")[0] || "amigo/a");
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function handleComingSoon(slug: string) {
    setComingSoon(slug);
    window.setTimeout(() => setComingSoon((current) => (current === slug ? null : current)), 2500);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            Aranduka <span aria-hidden>🐆</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              ¡Mba'éichapa, <span className="text-accent">{name || "..."}</span>!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Bienvenido/a a tu panel de Aranduka.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <StatsBar />
            <StreakBanner />
          </div>

          <section className="mt-10">
            <Link
              to="/guarani-escolar"
              className="group relative flex flex-col items-center justify-between gap-4 rounded-2xl border-2 border-accent bg-accent/5 p-6 shadow-elegant card-hover hover:bg-accent/10 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:p-8"
            >
              <div className="text-left">
                <div className="flex items-center gap-2 font-display text-2xl font-bold text-accent sm:text-3xl">
                  Guaraní Escolar <span aria-hidden>🎒</span>
                </div>
                <p className="mt-1 max-w-md text-sm text-muted-foreground sm:text-base">
                  Todo lo que necesitás para entender y aprobar Guaraní en la escuela.
                </p>
              </div>
              <span className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground shadow transition group-hover:bg-accent/90 group-active:scale-95">
                Entrar →
              </span>
            </Link>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              to="/nhe-rape"
              className="group relative flex flex-col gap-2 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant card-hover hover:border-primary hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>📖</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Homenaje
                </span>
              </div>
              <div className="font-display text-lg font-bold text-foreground">Ñe'ẽ Rape</div>
              <p className="text-sm text-muted-foreground">El camino de la palabra. Tributo al Prof. Ramón Silva.</p>
              <span className="mt-1 text-sm font-medium text-primary">Abrir →</span>
            </Link>
            <Link
              to="/traductor"
              className="group relative flex flex-col gap-2 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant card-hover hover:border-primary hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>🌐</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Gratis
                </span>
              </div>
              <div className="font-display text-lg font-bold text-foreground">Traductor</div>
              <p className="text-sm text-muted-foreground">Español ⇄ Guaraní al instante con IA.</p>
              <span className="mt-1 text-sm font-medium text-primary">Abrir →</span>
            </Link>
            <Link
              to="/tutor"
              className="group relative flex flex-col gap-2 rounded-2xl border border-accent/30 bg-card p-5 shadow-elegant card-hover hover:border-accent hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>✨</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                  Premium ⭐
                </span>
              </div>
              <div className="font-display text-lg font-bold text-foreground">Tutor IA</div>
              <p className="text-sm text-muted-foreground">Chateá con tu profe de guaraní 24/7.</p>
              <span className="mt-1 text-sm font-medium text-accent">Abrir →</span>
            </Link>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Elegí tu idioma
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Por ahora el curso completo de Guaraní está disponible. Más idiomas muy pronto.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LANGUAGES.map((l) => {
                const progress = 0;
                const isGuarani = l.slug === "guarani";
                const cardBody = (
                  <>
                    {l.featured && (
                      <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                        Destacado
                      </span>
                    )}
                    {!isGuarani && (
                      <span className="absolute left-4 top-4 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Próximamente 🔜
                      </span>
                    )}
                    <div className="text-4xl" aria-hidden>
                      {l.flag}
                    </div>
                    <div className="mt-4 font-display text-xl font-semibold text-foreground">
                      {l.name}
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span>{progress}%</span>
                      </div>
                      <div
                        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 progress-fill"
                          style={{ width: `${progress}%` }}
                        />

                      </div>
                    </div>

                    {comingSoon === l.slug && (
                      <div className="mt-4 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                        Este curso estará disponible pronto.
                      </div>
                    )}
                  </>
                );

                return isGuarani ? (
                  <Link
                    key={l.slug}
                    to="/curso/$lang"
                    params={{ lang: l.slug }}
                    className="group relative flex flex-col rounded-xl border-2 border-accent bg-card p-6 text-left shadow-elegant card-hover hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {cardBody}
                  </Link>
                ) : (
                  <div
                    key={l.slug}
                    onClick={() => handleComingSoon(l.slug)}
                    className="group relative flex flex-col rounded-xl border border-border/60 bg-card p-6 text-left shadow-sm opacity-80 transition hover:opacity-100 hover:shadow-md"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleComingSoon(l.slug);
                    }}
                    aria-disabled="true"
                  >
                    {cardBody}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
