import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
      const fromMeta = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined);
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
          <Button variant="outline" size="sm" onClick={handleSignOut}>Cerrar sesión</Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            ¡Mba'éichapa, <span className="text-accent">{name || "..."}</span>!
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Bienvenido/a a tu panel de Aranduka. Elegí un idioma para empezar a aprender.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { name: "Guaraní", flag: "🇵🇾" },
              { name: "Inglés", flag: "🇺🇸" },
              { name: "Portugués", flag: "🇧🇷" },
            ].map((l) => (
              <div key={l.name} className="rounded-lg border border-border/60 bg-card p-6">
                <div className="text-4xl">{l.flag}</div>
                <div className="mt-3 font-display text-lg font-semibold">{l.name}</div>
                <Button variant="cta" size="sm" className="mt-4 w-full">Continuar</Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
