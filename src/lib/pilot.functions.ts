import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PilotContent } from "./pilot-content.server";

type Status = "draft" | "published";

async function readSettings() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["pilot_page_status", "pilot_contact"]);
  const m = new Map((data ?? []).map((r) => [r.key, r.value]));
  return {
    status: (m.get("pilot_page_status") === "published" ? "published" : "draft") as Status,
    contact: m.get("pilot_contact") ?? "",
  };
}

async function requireAdmin(sb: { rpc: (...a: never[]) => unknown }, userId: string) {
  const { data } = await (sb.rpc as unknown as (f: string, a: object) => Promise<{ data: unknown }>)(
    "has_role",
    { _user_id: userId, _role: "admin" },
  );
  if (data !== true) throw new Error("Forbidden");
}

/** Página pública solo si está publicada; en Borrador solo la ve el admin. */
export const getPilotPage = createServerFn({ method: "GET" }).handler(async () => {
  const { verifyBearer } = await import("./server-guards.server");
  const user = await verifyBearer(getRequest().headers).catch(() => null);
  const s = await readSettings();
  const isAdmin = !!user?.isAdmin;
  if (s.status !== "published" && !isAdmin) {
    return { visible: false as const };
  }
  const { PILOT_CONTENT } = await import("./pilot-content.server");
  return {
    visible: true as const,
    draft: s.status !== "published",
    contact: s.contact.trim(),
    content: PILOT_CONTENT as PilotContent,
  };
});

/** Canjea un código de invitación: asigna solo el grupo, nunca roles. */
export const redeemPilotCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().trim().min(3).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const { consumeRateLimit, clientIp } = await import("./server-guards.server");
    const ip = clientIp(getRequest().headers);
    const okUser = await consumeRateLimit(`invite:u:${context.userId}`, 5, 3600);
    const okIp = await consumeRateLimit(`invite:ip:${ip}`, 20, 3600);
    if (!okUser || !okIp) return { result: "rate" as const };
    const s = await readSettings();
    if (s.status !== "published") return { result: "invalid" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r, error } = await supabaseAdmin.rpc("redeem_invite", {
      _user_id: context.userId,
      _code: data.code,
    });
    if (error) throw new Error("No se pudo validar el código");
    return { result: (r === "ok" ? "ok" : r === "full" ? "full" : "invalid") as "ok" | "full" | "invalid" };
  });

/* ------------------------------- ADMIN ------------------------------- */

export const getPilotAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await readSettings();
    const { data: codes } = await supabaseAdmin
      .from("invite_codes")
      .select("id, code, cohort, max_uses, uses, expires_at, active, created_at")
      .order("created_at", { ascending: false });
    return { ...s, codes: codes ?? [] };
  });

export const savePilotSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(["draft", "published"]).optional(),
        contact: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = [
      ...(data.status ? [{ key: "pilot_page_status", value: data.status }] : []),
      ...(data.contact !== undefined ? [{ key: "pilot_contact", value: data.contact }] : []),
    ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    if (rows.length) {
      const { error } = await supabaseAdmin.from("app_settings").upsert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const createInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().trim().regex(/^[A-Za-z0-9-]{6,40}$/, "6 a 40 letras, números o guiones"),
        cohort: z.string().trim().min(1).max(60).default("Piloto Ateneo"),
        maxUses: z.number().int().min(1).max(10000),
        expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("invite_codes").insert({
      code: data.code.toUpperCase(),
      cohort: data.cohort,
      max_uses: data.maxUses,
      // Vence al final del día elegido (hora de Paraguay, UTC-3).
      expires_at: data.expiresAt ? `${data.expiresAt}T23:59:59-03:00` : null,
    });
    if (error) throw new Error(error.code === "23505" ? "Ese código ya existe" : error.message);
    return { ok: true };
  });

export const setInviteActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("invite_codes").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
