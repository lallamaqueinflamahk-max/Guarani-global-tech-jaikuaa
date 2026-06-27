import { createFileRoute, Outlet, redirect, useMatches } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const matches = useMatches();
  const key = matches[matches.length - 1]?.pathname ?? "/";
  return (
    <div key={key} className="page-in">
      <Outlet />
    </div>
  );
}

