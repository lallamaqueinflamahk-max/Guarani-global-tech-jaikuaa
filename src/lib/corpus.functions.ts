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

const ImportSchema = z.object({ rows: z.array(RowSchema).max(5000) });

async function assertAdmin<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { rpc: (fn: any, args: any) => any },
>(supabase: T, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

/** ¿El usuario actual es administrador del corpus? */
export const checkCorpusAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true };
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
    await assertAdmin(context.supabase, context.userId);
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
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [existingRes, audioSlugs] = await Promise.all([
      supabaseAdmin.from("corpus_words").select("id, gn, es, has_audio"),
      listAudioSlugs(),
    ]);
    const existing = new Map((existingRes.data ?? []).map((w) => [w.gn.trim(), w]));

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
    };
  });

/** Guarda la importación: crea lo nuevo, reusa lo existente, vincula al nivel. */
export const commitCorpusImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    ImportSchema.extend({ overwriteTranslations: z.boolean().default(false) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
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
        limit: z.number().min(1).max(500).default(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
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
      .select("id, gn, es, audio_slug, has_audio, status, notes")
      .order("gn")
      .limit(data.limit);
    if (ids) q = q.in("id", ids);
    if (data.search.trim())
      q = q.or(`gn.ilike.%${data.search.trim()}%,es.ilike.%${data.search.trim()}%`);
    if (data.onlyMissingAudio) q = q.eq("has_audio", false);

    const { data: words, error } = await q;
    if (error) throw new Error(error.message);
    return { words: words ?? [] };
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
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("corpus_words").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCorpusWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
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
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: links } = await supabaseAdmin
      .from("corpus_word_levels")
      .select("word_id")
      .eq("level_id", data.levelId);
    const ids = (links ?? []).map((l) => l.word_id);
    if (ids.length === 0) return { published: 0 };
    const { data: updated, error } = await supabaseAdmin
      .from("corpus_words")
      .update({ status: "published" })
      .in("id", ids)
      .eq("has_audio", true)
      .select("id");
    if (error) throw new Error(error.message);
    return { published: updated?.length ?? 0 };
  });

/** Re-escanea el bucket de audio y actualiza qué palabras ya tienen grabación. */
export const refreshAudioCoverage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
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
