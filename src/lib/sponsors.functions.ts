import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FOUNDERS_KEY, SPONSOR_SLOTS, SPONSOR_SLOT_IDS, type SponsorSlot } from "./sponsor-slots";

const slotEnum = z.enum(SPONSOR_SLOT_IDS as [SponsorSlot, ...SponsorSlot[]]);

function parseFounders(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
}

async function requireAdmin(sb: { rpc: (...a: never[]) => unknown }, userId: string) {
  const { data } = await (sb.rpc as unknown as (f: string, a: object) => Promise<{ data: unknown }>)(
    "has_role",
    { _user_id: userId, _role: "admin" },
  );
  if (data !== true) throw new Error("Forbidden");
}

/** Auspiciante de un espacio (juego o Palabra del día). Vacío = no se muestra nada. */
export const getSlotSponsor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slot: slotEnum }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", SPONSOR_SLOTS[data.slot].key)
      .maybeSingle();
    return { name: (row?.value ?? "").trim() };
  });

/** Muro de Auspiciantes Fundadores: público (se muestra en la portada). */
export const getFoundingSponsors = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin.from("app_settings").select("value").eq("key", FOUNDERS_KEY).maybeSingle();
  return { names: parseFounders(row?.value) };
});

export const getSponsorAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const keys = [...SPONSOR_SLOT_IDS.map((s) => SPONSOR_SLOTS[s].key), FOUNDERS_KEY];
    const { data } = await supabaseAdmin.from("app_settings").select("key, value").in("key", keys);
    const m = new Map((data ?? []).map((r) => [r.key, r.value ?? ""]));
    const slots = Object.fromEntries(SPONSOR_SLOT_IDS.map((s) => [s, m.get(SPONSOR_SLOTS[s].key) ?? ""])) as Record<
      SponsorSlot,
      string
    >;
    return { slots, founders: parseFounders(m.get(FOUNDERS_KEY)).join("\n") };
  });

export const saveSponsorSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slots: z.record(slotEnum, z.string().trim().max(80)).optional(),
        founders: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const rows: { key: string; value: string; updated_at: string }[] = [];
    for (const [slot, value] of Object.entries(data.slots ?? {}) as [SponsorSlot, string][]) {
      rows.push({ key: SPONSOR_SLOTS[slot].key, value, updated_at: now });
    }
    if (data.founders !== undefined) {
      const names = parseFounders(data.founders).map((n) => n.slice(0, 60));
      rows.push({ key: FOUNDERS_KEY, value: names.join("\n"), updated_at: now });
    }
    if (rows.length) {
      const { error } = await supabaseAdmin.from("app_settings").upsert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Registra una impresión del auspiciante actual del espacio (el nombre lo resuelve el servidor). */
export const recordSponsorImpression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slot: slotEnum }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", SPONSOR_SLOTS[data.slot].key)
      .maybeSingle();
    const name = (row?.value ?? "").trim();
    if (!name) return { ok: false };
    const { error } = await context.supabase
      .from("sponsor_impressions")
      .insert({ slot: data.slot, sponsor_name: name, user_id: context.userId });
    return { ok: !error };
  });

/** Reporte de impresiones de los últimos 30 días (solo admin). */
export const getSponsorImpressions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase.rpc("sponsor_impressions_report", { _days: 30 });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      slot: r.slot,
      sponsorName: r.sponsor_name,
      impressions: Number(r.impressions),
      uniqueUsers: Number(r.unique_users),
    }));
  });
