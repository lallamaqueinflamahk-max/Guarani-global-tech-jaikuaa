import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/languages";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Aranduka — Tu panel" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");

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

          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Elegí tu idioma
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Empezá con cualquiera de nuestros cinco idiomas.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LANGUAGES.map((l) => {
                const progress = 0;
                return (
                  <Link
                    key={l.slug}
                    to="/curso/$lang"
                    params={{ lang: l.slug }}
                    className="group relative flex flex-col rounded-xl border border-border/60 bg-card p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md"
                  >
                    {l.featured && (
                      <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                        Destacado
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
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
