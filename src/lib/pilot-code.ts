import { supabase } from "@/integrations/supabase/client";
import { redeemPilotCode } from "./pilot.functions";

const KEY = "jaikuaa:pilot-code";

export function savePendingPilotCode(code: string) {
  try {
    window.localStorage.setItem(KEY, code.trim().slice(0, 40));
  } catch {}
}

let running: Promise<string | null> | null = null;

/** Si hay un código guardado y hay sesión, el servidor lo valida y asigna el grupo. */
export function redeemPendingPilotCode(): Promise<string | null> {
  if (running) return running;
  running = (async () => {
    let code: string | null = null;
    try {
      code = window.localStorage.getItem(KEY);
    } catch {}
    if (!code) return null;
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    try {
      const r = await redeemPilotCode({ data: { code } });
      if (r.result !== "rate") window.localStorage.removeItem(KEY);
      return r.result;
    } catch {
      return null;
    }
  })().finally(() => {
    running = null;
  });
  return running;
}
