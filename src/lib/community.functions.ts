import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Lunes 00:00 hora de Paraguay (UTC-3), expresado en UTC. */
function weekStartUtc(now = new Date()): Date {
  const local = new Date(now.getTime() - 3 * 3600_000);
  const dow = (local.getUTCDay() + 6) % 7; // 0 = lunes
  const monday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - dow);
  return new Date(monday + 3 * 3600_000);
}

function firstName(full: string | null | undefined): string {
  const n = (full ?? "").trim().split(/\s+/)[0] ?? "";
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "Estudiante";
}

export type RankingRow = { rank: number; name: string; xp: number; isMe: boolean };

/**
 * Ranking semanal de XP dentro del grupo (cohorte) del usuario. Muestra solo el nombre de pila
 * y excluye a los administradores para que las cuentas de prueba no distorsionen.
 */
export const getWeeklyRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { data: myProfile } = await supabaseAdmin.from("profiles").select("cohort").eq("id", me).maybeSingle();
    const cohort = myProfile?.cohort ?? null;

    let membersQ = supabaseAdmin.from("profiles").select("id, full_name").limit(5000);
    membersQ = cohort ? membersQ.eq("cohort", cohort) : membersQ.is("cohort", null);
    const [{ data: members }, { data: admins }] = await Promise.all([
      membersQ,
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    const adminSet = new Set((admins ?? []).map((a) => a.user_id));
    const people = (members ?? []).filter((m) => !adminSet.has(m.id) || m.id === me);
    const names = new Map(people.map((p) => [p.id, firstName(p.full_name)]));
    const ids = people.map((p) => p.id);

    const start = weekStartUtc();
    const totals = new Map<string, number>();
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { data: tx } = await supabaseAdmin
        .from("xp_transactions")
        .select("user_id, amount")
        .gte("created_at", start.toISOString())
        .in("user_id", chunk)
        .limit(20000);
      for (const t of tx ?? []) totals.set(t.user_id, (totals.get(t.user_id) ?? 0) + (t.amount ?? 0));
    }

    const sorted = [...totals.entries()]
      .filter(([id, xp]) => xp > 0 && (!adminSet.has(id) || id === me))
      .sort((a, b) => b[1] - a[1]);
    const rows: RankingRow[] = sorted.map(([id, xp], i) => ({ rank: i + 1, name: names.get(id) ?? "Estudiante", xp, isMe: id === me }));
    const mine = rows.find((r) => r.isMe) ?? null;
    return {
      group: cohort ?? "Comunidad Jaikuaa",
      weekStart: start.toISOString(),
      top: rows.slice(0, 10),
      me: mine && mine.rank > 10 ? mine : null,
      myXp: totals.get(me) ?? 0,
      participants: rows.length,
    };
  });

/** Estado del certificado: lecciones publicadas del curso de guaraní vs. lecciones completadas. */
export const getCertificateStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const status = await computeCertificateStatus(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cert } = await supabaseAdmin.from("certificates").select("code").eq("user_id", context.userId).maybeSingle();
    return { ...status, code: cert?.code ?? null };
  });

export async function computeCertificateStatus(me: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: lessons }, { data: done }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name").eq("id", me).maybeSingle(),
      supabaseAdmin
        .from("lessons")
        .select("id, sort_order, lesson_words(corpus_words!inner(status))")
        .eq("status", "published")
        .eq("lesson_words.corpus_words.status", "published"),
      supabaseAdmin
        .from("xp_transactions")
        .select("source_ref, created_at")
        .eq("user_id", me)
        .eq("source", "lesson")
        .like("source_ref", "guarani:%")
        .limit(5000),
    ]);
    const required = (lessons ?? [])
      .filter((l) => Array.isArray(l.lesson_words) && l.lesson_words.length > 0)
      .map((l) => l.sort_order)
      .sort((a, b) => a - b);
    const lastByLesson = new Map<number, string>();
    for (const d of done ?? []) {
      const n = Number(String(d.source_ref ?? "").split(":")[1]);
      if (!Number.isFinite(n)) continue;
      const prev = lastByLesson.get(n);
      if (!prev || d.created_at > prev) lastByLesson.set(n, d.created_at);
    }
    const completed = required.filter((n) => lastByLesson.has(n));
    const eligible = required.length > 0 && completed.length === required.length;
    const issuedAt = eligible
      ? completed.map((n) => lastByLesson.get(n)!).sort().at(-1) ?? null
      : null;
    return {
      name: (profile?.full_name ?? "").trim(),
      required: required.length,
      completed: completed.length,
      eligible,
      issuedAt,
    };
}
