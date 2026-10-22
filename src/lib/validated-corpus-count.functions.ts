import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAGE_SIZE = 1000;
const ROLE_BATCH_SIZE = 100;

/** Exact count of published corpus words validated by a current editor. No row or user data leaves the server. */
export const getValidatedPublishedWordCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [adminRole, editorRole] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" }),
    ]);
    if (adminRole.data !== true && editorRole.data !== true) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const editorIds: string[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "editor")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      editorIds.push(...(data ?? []).map(({ user_id }) => user_id));
      if (!data || data.length < PAGE_SIZE) break;
    }

    const uniqueEditorIds = [...new Set(editorIds)];
    let count = 0;
    for (let from = 0; from < uniqueEditorIds.length; from += ROLE_BATCH_SIZE) {
      const { count: batchCount, error } = await supabaseAdmin
        .from("corpus_words")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .in("validated_by", uniqueEditorIds.slice(from, from + ROLE_BATCH_SIZE));
      if (error) throw new Error(error.message);
      count += batchCount ?? 0;
    }

    return { count };
  });