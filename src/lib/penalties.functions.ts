import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPenaltiesLed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("app_settings").select("value").eq("key", "penales_led").maybeSingle();
    if (error) throw new Error("No se pudo cargar la publicidad");
    return { text: data?.value ?? "JAIKUAA · TU MARCA AQUÍ" };
  });
