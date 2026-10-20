import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Strategic sections: visible only to signed-in admins. */
export function PrivateGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return alive && setState("denied");
      const { data: ok } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (alive) setState(ok ? "ok" : "denied");
    })();
    return () => {
      alive = false;
    };
  }, []);
  if (state === "ok") return <>{children}</>;
  if (state === "loading") return <div className="min-h-screen bg-background" />;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Lock className="h-10 w-10 text-primary" aria-hidden />
      <h1 className="font-display text-2xl font-bold text-foreground">Sección privada</h1>
      <p className="max-w-sm text-muted-foreground">Esta sección está disponible solo con acceso autorizado.</p>
      <Link to="/" className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
        Volver al inicio
      </Link>
    </main>
  );
}
