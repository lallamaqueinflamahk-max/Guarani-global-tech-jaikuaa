import { createFileRoute, Outlet, redirect, useMatches } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { InstallBanner } from "@/components/navigation/install-banner";
import { NetworkStatus } from "@/components/network-status";
import { ValidationUndoNotice } from "@/components/corpus/validation-undo-notice";
import { showsBottomNav } from "@/lib/bottom-nav";

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
  const withNav = showsBottomNav(key);
  return (
    <>
      <div key={key} className={`page-in ${withNav ? "pb-20 md:pb-0" : ""}`}>
        <Outlet />
      </div>
      <MobileBottomNav />
      <InstallBanner />
      <NetworkStatus />
      <ValidationUndoNotice />
    </>
  );
}
