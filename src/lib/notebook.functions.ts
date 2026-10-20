import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function pyDay(ts: string | Date): string {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

/**
 * Cuaderno digital del docente: avance de los alumnos de su grupo.
 * Docente validador ve solo su propio grupo; admin puede elegir cualquiera.
 */
export const getTeacherNotebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ cohort: z.string().trim().max(60).nullable().default(null) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const [a, e] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
    ]);
    const isAdmin = a.data === true;
    const isEditor = e.data === true;
    if (!isAdmin && !isEditor) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let cohorts: string[] = [];
    let cohort: string | null = null;
    if (isAdmin) {
      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select("cohort")
        .not("cohort", "is", null);
      cohorts = [...new Set((rows ?? []).map((r) => r.cohort as string))].sort();
      cohort = data.cohort && cohorts.includes(data.cohort) ? data.cohort : (cohorts[0] ?? null);
    } else {
      const { data: me } = await supabaseAdmin
        .from("profiles")
        .select("cohort")
        .eq("id", context.userId)
        .maybeSingle();
      cohort = me?.cohort ?? null;
      cohorts = cohort ? [cohort] : [];
    }
    if (!cohort) return { isAdmin, cohorts, cohort: null, students: [], totalLessons: 0 };

    const { data: staff } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "editor"]);
    const staffIds = new Set((staff ?? []).map((r) => r.user_id));

    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("cohort", cohort)
      .order("full_name");
    const students = (profs ?? []).filter((p) => !staffIds.has(p.id));
    const ids = students.map((s) => s.id);

    const { count: totalLessons } = await supabaseAdmin
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");

    if (ids.length === 0) return { isAdmin, cohorts, cohort, students: [], totalLessons: totalLessons ?? 0 };

    const [txRes, statsRes] = await Promise.all([
      supabaseAdmin
        .from("xp_transactions")
        .select("user_id, amount, source, source_ref, created_at")
        .in("user_id", ids)
        .neq("source", "local-migration")
        .limit(20000),
      supabaseAdmin.from("user_stats").select("user_id, xp, current_streak").in("user_id", ids),
    ]);
    const txs = txRes.data ?? [];
    const today = pyDay(new Date());
    const d7 = new Date(`${today}T12:00:00Z`);
    d7.setUTCDate(d7.getUTCDate() - 6);
    const since7 = d7.toISOString().slice(0, 10);

    return {
      isAdmin,
      cohorts,
      cohort,
      totalLessons: totalLessons ?? 0,
      students: students.map((s) => {
        const mine = txs.filter((t) => t.user_id === s.id);
        const week = mine.filter((t) => pyDay(t.created_at) >= since7);
        const lessonsDone = new Set(
          mine.filter((t) => t.source === "lesson" && t.source_ref).map((t) => t.source_ref),
        ).size;
        const last = mine.reduce<string | null>(
          (m, t) => (!m || t.created_at > m ? t.created_at : m),
          null,
        );
        const st = statsRes.data?.find((x) => x.user_id === s.id);
        const status: "verde" | "amarillo" | "gris" =
          week.some((t) => t.source === "lesson") ? "verde" : week.length > 0 ? "amarillo" : "gris";
        return {
          id: s.id,
          name: s.full_name || (s.email ?? "").split("@")[0] || "Alumno",
          lessonsDone,
          weekXp: week.reduce((acc, t) => acc + t.amount, 0),
          weekActivities: week.length,
          totalXp: st?.xp ?? 0,
          streak: st?.current_streak ?? 0,
          lastActive: last ? pyDay(last) : null,
          status,
        };
      }),
    };
  });
