import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GameWord = { gn: string; es: string; hasAudio: boolean };

/** Palabras publicadas del corpus para los juegos; opcionalmente solo las de una lección publicada. */
export const getGameWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ lesson: z.number().int().min(1).max(10000).nullable().default(null) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    if (data.lesson !== null) {
      const { data: lesson } = await sb
        .from("lessons")
        .select("id")
        .eq("status", "published")
        .eq("sort_order", data.lesson)
        .maybeSingle();
      if (!lesson) return { words: [] as GameWord[] };
      const { data: links, error } = await sb
        .from("lesson_words")
        .select("corpus_words!inner(gn, es, has_audio, status)")
        .eq("lesson_id", lesson.id)
        .eq("corpus_words.status", "published");
      if (error) throw new Error(error.message);
      const words = (links ?? []).map((x) => {
        const w = x.corpus_words as unknown as { gn: string; es: string; has_audio: boolean };
        return { gn: w.gn, es: w.es, hasAudio: w.has_audio };
      });
      return { words };
    }
    const { data: rows, error } = await sb
      .from("corpus_words")
      .select("gn, es, has_audio")
      .eq("status", "published")
      .limit(2000);
    if (error) throw new Error(error.message);
    return { words: (rows ?? []).map((w) => ({ gn: w.gn, es: w.es, hasAudio: w.has_audio })) };
  });

/* --------------------------- PALABRA DEL DÍA --------------------------- */

function asuncionToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

function seeded(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  let x = h >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/** Elección determinística por fecha de Paraguay: misma palabra y opciones para todos. */
async function wordOfDay(day: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("corpus_words")
    .select("id, gn, es, has_audio")
    .eq("status", "published")
    .order("id")
    .limit(2000);
  if (error) throw new Error(error.message);
  const all = data ?? [];
  const withAudio = all.filter((w) => w.has_audio);
  if (withAudio.length === 0) return null;
  const rnd = seeded(`jaikuaa:${day}`);
  const word = withAudio[Math.floor(rnd() * withAudio.length)]!;
  const others = [...new Set(all.map((w) => w.es.trim()).filter((es) => es && es !== word.es.trim()))];
  const wrong: string[] = [];
  while (wrong.length < 3 && others.length) {
    wrong.push(others.splice(Math.floor(rnd() * others.length), 1)[0]!);
  }
  const options = [word.es.trim(), ...wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  return { gn: word.gn, es: word.es.trim(), options };
}

const syncIdFor = (day: string) => `game:palabra-del-dia:${day}`;

export const getWordOfDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const day = asuncionToday();
    const w = await wordOfDay(day);
    if (!w) return { day, word: null };
    const { data: tx } = await context.supabase
      .from("xp_transactions")
      .select("metadata")
      .eq("user_id", context.userId)
      .eq("sync_id", syncIdFor(day))
      .maybeSingle();
    const prev = tx?.metadata as { choice?: string; correct?: boolean } | undefined;
    return {
      day,
      word: { gn: w.gn, options: w.options },
      played: tx
        ? { choice: prev?.choice ?? "", correct: !!prev?.correct, answer: w.es }
        : null,
    };
  });

export const answerWordOfDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ choice: z.string().trim().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const day = asuncionToday();
    const w = await wordOfDay(day);
    if (!w) throw new Error("No hay palabra del día");
    const correct = data.choice === w.es;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.rpc("record_activity", {
      _user_id: context.userId,
      _amount: correct ? 5 : 0,
      _source: "game",
      _source_ref: "palabra-del-dia",
      _sync_id: syncIdFor(day),
      _metadata: { choice: data.choice, correct },
      _perfect: false,
    } as never);
    if (error) throw new Error("No se pudo guardar la partida");
    const duplicate = !!(res as { duplicate?: boolean } | null)?.duplicate;
    return { correct, answer: w.es, duplicate };
  });
