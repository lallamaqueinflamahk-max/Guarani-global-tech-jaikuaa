import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type GateRole = "admin" | "editor";

/** Strategic sections default to admins; individual routes can allow additional staff roles. */
export function PrivateGate({ children, roles = ["admin"] }: { children: ReactNode; roles?: GateRole[] }) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const roleKey = roles.join(",");
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return alive && setState("denied");
      const checks = await Promise.all(
        (roleKey.split(",") as GateRole[]).map((role) => supabase.rpc("has_role", { _user_id: uid, _role: role })),
      );
      if (alive) setState(checks.some(({ data }) => data === true) ? "ok" : "denied");
    })();
    return () => {
      alive = false;
    };
  }, [roleKey]);
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
