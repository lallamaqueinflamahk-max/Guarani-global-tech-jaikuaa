import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify, tokenizeSentence } from "@/lib/slug";

export type CorpusStatus = "draft" | "published";

const RowSchema = z.object({
  gn: z.string().min(1),
  es: z.string().min(1),
  levelId: z.string().min(1),
  unit: z.string().default(""),
  type: z.enum(["palabra", "oracion"]).default("palabra"),
  notes: z.string().default(""),
});

/** Cronograma oficial del MEC: capacidades por grado, con léxico asociado. */
export const getMecCapacities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [capsRes, levelsRes, linksRes] = await Promise.all([
      supabaseAdmin
        .from("mec_capacities")
        .select("code, level_id, axis, capacity_gn, contents_es, sort_order")
        .order("sort_order"),
      supabaseAdmin.from("mec_levels").select("id, label, stage, sort_order").order("sort_order"),
      supabaseAdmin.from("corpus_word_levels").select("word_id, level_id, unit"),
    ]);

    const links = linksRes.data ?? [];
    const caps = (capsRes.data ?? []).map((c) => ({
      ...c,
      words: links.filter((l) => l.unit === c.code).length,
    }));

    return {
      levels: levelsRes.data ?? [],
      capacities: caps,
      freeUnits: [
        ...new Set(links.filter((l) => l.unit && !caps.some((c) => c.code === l.unit)).map((l) => `${l.level_id} · ${l.unit}`)),
      ].sort(),
      unassigned: links.filter((l) => !l.unit).length,
    };
  });

const ImportSchema = z.object({ rows: z.array(RowSchema).max(5000) });

type Role = "admin" | "editor";

async function getRoles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
) {
  const [a, e] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
  ]);
  return { isAdmin: a.data === true, isEditor: e.data === true };
}

/** Chequeo de rol según la acción: "admin" solo admin; "editor" admin o docente validador. */
async function assertRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
  min: Role,
) {
  const r = await getRoles(supabase, userId);
  if (r.isAdmin) return r;
  if (min === "editor" && r.isEditor) return r;
  throw new Error("Forbidden");
}

/** Roles del usuario actual en el panel de validación. */
export const checkCorpusAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await getRoles(context.supabase, context.userId);
    return { ...r, canAccess: r.isAdmin || r.isEditor };
  });

/** Lista de slugs de audio realmente presentes en el bucket. */
async function listAudioSlugs(): Promise<Set<string>> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const slugs = new Set<string>();
  let offset = 0;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabaseAdmin.storage
      .from("guarani-audio")
      .list("", { limit: 1000, offset });
    if (error || !data || data.length === 0) break;
    for (const f of data) {
      if (f.name.endsWith(".mp3")) slugs.add(f.name.replace(/\.mp3$/, ""));
    }
    if (data.length < 1000) break;
    offset += data.length;
  }
  return slugs;
}

/** Panorama general: niveles, totales y cobertura de audio por nivel. */
export const getCorpusOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [levelsRes, wordsRes, linksRes, sentencesRes] = await Promise.all([
      supabaseAdmin.from("mec_levels").select("id, label, stage, sort_order").order("sort_order"),
      supabaseAdmin.from("corpus_words").select("id, gn, audio_slug, has_audio, status"),
      supabaseAdmin.from("corpus_word_levels").select("word_id, level_id"),
      supabaseAdmin.from("corpus_sentences").select("id, level_id, status"),
    ]);

    const levels = levelsRes.data ?? [];
    const words = wordsRes.data ?? [];
    const links = linksRes.data ?? [];
    const sentences = sentencesRes.data ?? [];

    const byId = new Map(words.map((w) => [w.id, w]));
    const perLevel = levels.map((lv) => {
      const ids = new Set(links.filter((l) => l.level_id === lv.id).map((l) => l.word_id));
      const lvWords = [...ids].map((id) => byId.get(id)).filter(Boolean) as typeof words;
      return {
        ...lv,
        words: lvWords.length,
        withAudio: lvWords.filter((w) => w.has_audio).length,
        published: lvWords.filter((w) => w.status === "published").length,
        sentences: sentences.filter((s) => s.level_id === lv.id).length,
      };
    });

    return {
      levels: perLevel,
      totals: {
        words: words.length,
        withAudio: words.filter((w) => w.has_audio).length,
        published: words.filter((w) => w.status === "published").length,
        sentences: sentences.length,
        unassigned: words.filter((w) => !links.some((l) => l.word_id === w.id)).length,
      },
    };
  });

/** Compara las filas del Excel contra el corpus: reusadas / nuevas / conflictos. */
export const previewCorpusImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [existingRes, capsRes, audioSlugs] = await Promise.all([
      supabaseAdmin.from("corpus_words").select("id, gn, es, has_audio"),
      supabaseAdmin.from("mec_capacities").select("code, level_id"),
      listAudioSlugs(),
    ]);
    const existing = new Map((existingRes.data ?? []).map((w) => [w.gn.trim(), w]));
    const caps = capsRes.data ?? [];
    const unknownCapacities = [
      ...new Set(
        data.rows
          .map((r) => r.unit.trim())
          .filter((u) => /^MEC-/i.test(u) && !caps.some((c) => c.code === u.toUpperCase())),
      ),
    ];

    const reused: { gn: string; es: string; hasAudio: boolean }[] = [];
    const created: { gn: string; es: string; slug: string; hasAudio: boolean }[] = [];
    const conflicts: { gn: string; nuevo: string; actual: string }[] = [];
    const sentences: { gn: string; es: string; missingWords: string[] }[] = [];
    const seen = new Set<string>();

    for (const row of data.rows) {
      const gn = row.gn.trim();
      if (row.type === "oracion") {
        const tokens = tokenizeSentence(gn);
        const missing = tokens.filter(
          (t) =>
            !existing.has(t) && !data.rows.some((r) => r.type === "palabra" && r.gn.trim() === t),
        );
        sentences.push({ gn, es: row.es.trim(), missingWords: missing });
        continue;
      }
      if (seen.has(gn)) continue;
      seen.add(gn);
      const prev = existing.get(gn);
      if (prev) {
        reused.push({ gn, es: prev.es, hasAudio: prev.has_audio });
        if (prev.es.trim().toLowerCase() !== row.es.trim().toLowerCase()) {
          conflicts.push({ gn, nuevo: row.es.trim(), actual: prev.es });
        }
      } else {
        const slug = slugify(gn);
        created.push({ gn, es: row.es.trim(), slug, hasAudio: audioSlugs.has(slug) });
      }
    }

    return {
      reused,
      created,
      conflicts,
      sentences,
      audioToRecord: created.filter((c) => !c.hasAudio).map((c) => `${c.slug}.mp3`),
      unknownCapacities,
    };
  });

/** Guarda la importación: crea lo nuevo, reusa lo existente, vincula al nivel. */
export const commitCorpusImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    ImportSchema.extend({ overwriteTranslations: z.boolean().default(false) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const audioSlugs = await listAudioSlugs();

    const wordRows = data.rows.filter((r) => r.type === "palabra");
    const sentenceRows = data.rows.filter((r) => r.type === "oracion");

    const { data: existingWords } = await supabaseAdmin.from("corpus_words").select("id, gn, es");
    const existing = new Map((existingWords ?? []).map((w) => [w.gn.trim(), w]));

    let createdCount = 0;
    let reusedCount = 0;
    const newRows: {
      gn: string;
      es: string;
      audio_slug: string;
      has_audio: boolean;
      notes: string;
    }[] = [];
    const seen = new Set<string>();

    for (const r of wordRows) {
      const gn = r.gn.trim();
      if (seen.has(gn)) continue;
      seen.add(gn);
      if (existing.has(gn)) {
        reusedCount++;
        if (data.overwriteTranslations) {
          await supabaseAdmin.from("corpus_words").update({ es: r.es.trim() }).eq("gn", gn);
        }
        continue;
      }
      const slug = slugify(gn);
      newRows.push({
        gn,
        es: r.es.trim(),
        audio_slug: slug,
        has_audio: audioSlugs.has(slug),
        notes: r.notes ?? "",
      });
    }

    if (newRows.length > 0) {
      const { error } = await supabaseAdmin.from("corpus_words").insert(newRows);
      if (error) throw new Error(error.message);
      createdCount = newRows.length;
    }

    // Re-leer para tener todos los ids y vincular a niveles.
    const { data: allWords } = await supabaseAdmin.from("corpus_words").select("id, gn");
    const idByGn = new Map((allWords ?? []).map((w) => [w.gn.trim(), w.id]));

    const links = wordRows
      .map((r) => ({
        word_id: idByGn.get(r.gn.trim()),
        level_id: r.levelId,
        unit: r.unit ?? "",
      }))
      .filter((l) => Boolean(l.word_id));
    if (links.length > 0) {
      await supabaseAdmin
        .from("corpus_word_levels")
        .upsert(links as never, { onConflict: "word_id,level_id,unit", ignoreDuplicates: true });
    }

    // Oraciones
    let sentenceCount = 0;
    for (const s of sentenceRows) {
      const gn = s.gn.trim();
      const { data: inserted, error } = await supabaseAdmin
        .from("corpus_sentences")
        .upsert(
          { gn, es: s.es.trim(), level_id: s.levelId, unit: s.unit ?? "", notes: s.notes ?? "" },
          { onConflict: "gn" },
        )
        .select("id")
        .maybeSingle();
      if (error || !inserted) continue;
      sentenceCount++;
      await supabaseAdmin.from("corpus_sentence_words").delete().eq("sentence_id", inserted.id);
      const tokens = tokenizeSentence(gn).map((token, position) => ({
        sentence_id: inserted.id,
        word_id: idByGn.get(token) ?? null,
        token,
        position,
      }));
      if (tokens.length > 0) await supabaseAdmin.from("corpus_sentence_words").insert(tokens);
    }

    return { created: createdCount, reused: reusedCount, sentences: sentenceCount };
  });

/** Listado de palabras con filtros para el panel. */
export const listCorpusWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        levelId: z.string().optional(),
        search: z.string().default(""),
        onlyMissingAudio: z.boolean().default(false),
        onlyPendingValidation: z.boolean().default(false),
        limit: z.number().min(1).max(500).default(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let ids: string[] | null = null;
    if (data.levelId) {
      const { data: links } = await supabaseAdmin
        .from("corpus_word_levels")
        .select("word_id")
        .eq("level_id", data.levelId);
      ids = (links ?? []).map((l) => l.word_id);
      if (ids.length === 0) return { words: [] };
    }

    let q = supabaseAdmin
      .from("corpus_words")
      .select("id, gn, es, audio_slug, has_audio, status, notes, validated_by, validated_at")
      .order("gn")
      .limit(data.limit);
    if (ids) q = q.in("id", ids);
    if (data.search.trim())
      q = q.or(`gn.ilike.%${data.search.trim()}%,es.ilike.%${data.search.trim()}%`);
    if (data.onlyMissingAudio) q = q.eq("has_audio", false);
    if (data.onlyPendingValidation) q = q.or("status.eq.draft,validated_by.is.null");

    const { data: words, error } = await q;
    if (error) throw new Error(error.message);
    const vIds = [...new Set((words ?? []).map((w) => w.validated_by).filter(Boolean))] as string[];
    const names = new Map<string, string>();
    if (vIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", vIds);
      for (const p of profs ?? []) names.set(p.id, p.full_name || p.email || "Docente");
    }
    return {
      words: (words ?? []).map((w) => ({
        ...w,
        validatorName: w.validated_by ? (names.get(w.validated_by) ?? "Docente") : null,
      })),
    };
  });

/** Editar, publicar o borrar una palabra. */
export const updateCorpusWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        es: z.string().min(1).optional(),
        notes: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = { ...rest };
    if (rest.status === "published") {
      patch.validated_by = context.userId;
      patch.validated_at = new Date().toISOString();
    } else if (rest.status === "draft") {
      patch.validated_by = null;
      patch.validated_at = null;
    }
    const { error } = await supabaseAdmin.from("corpus_words").update(patch as never).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCorpusWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("corpus_words").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Publica todas las palabras de un nivel que ya tengan audio. */
export const publishLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ levelId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: links } = await supabaseAdmin
      .from("corpus_word_levels")
      .select("word_id")
      .eq("level_id", data.levelId);
    const ids = (links ?? []).map((l) => l.word_id);
    if (ids.length === 0) return { published: 0 };
    const { data: updated, error } = await supabaseAdmin
      .from("corpus_words")
      .update({
        status: "published",
        validated_by: context.userId,
        validated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("has_audio", true)
      .eq("status", "draft")
      .select("id");
    if (error) throw new Error(error.message);
    return { published: updated?.length ?? 0 };
  });

/** Re-escanea el bucket de audio y actualiza qué palabras ya tienen grabación. */
export const refreshAudioCoverage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slugs = await listAudioSlugs();
    const { data: words } = await supabaseAdmin
      .from("corpus_words")
      .select("id, audio_slug, has_audio");
    let changed = 0;
    for (const w of words ?? []) {
      const now = slugs.has(w.audio_slug);
      if (now !== w.has_audio) {
        await supabaseAdmin.from("corpus_words").update({ has_audio: now }).eq("id", w.id);
        changed++;
      }
    }
    return { changed, audioFiles: slugs.size };
  });

/* --------------------------- DOCENTES VALIDADORES --------------------------- */

export const listValidators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "editor");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return { validators: [] };
    const [profs, words] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids),
      supabaseAdmin.from("corpus_words").select("validated_by").in("validated_by", ids),
    ]);
    return {
      validators: ids.map((id) => {
        const p = profs.data?.find((x) => x.id === id);
        return {
          userId: id,
          name: p?.full_name || "",
          email: p?.email || "",
          validated: (words.data ?? []).filter((w) => w.validated_by === id).length,
        };
      }),
    };
  });

export const addValidator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (!prof) return { ok: false as const, error: "Primero tiene que crear su cuenta en Jaikuaa" };
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", prof.id)
      .eq("role", "editor")
      .maybeSingle();
    if (!existing) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: prof.id, role: "editor" });
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const removeValidator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "editor");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
