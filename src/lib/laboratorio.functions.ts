import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Vocabulario para el Laboratorio Morfológico (solo admin).
 * Devuelve las palabras PUBLICADAS y marca como validadas solo las que validó un docente
 * validador (rol "editor"). No devuelve nombres ni datos de personas.
 */
export const getLabCorpus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: words, error } = await supabaseAdmin
      .from("corpus_words")
      .select("gn, validated_by")
      .eq("status", "published")
      .limit(5000);
    if (error) throw new Error(error.message);

    const validatorIds = [...new Set((words ?? []).map((w) => w.validated_by).filter(Boolean))] as string[];
    const editors = new Set<string>();
    if (validatorIds.length > 0) {
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "editor")
        .in("user_id", validatorIds);
      if (rolesError) throw new Error(rolesError.message);
      for (const r of roles ?? []) editors.add(r.user_id);
    }

    return {
      entries: (words ?? []).map((w) => ({ gn: w.gn, validated: !!w.validated_by && editors.has(w.validated_by) })),
    };
  });
