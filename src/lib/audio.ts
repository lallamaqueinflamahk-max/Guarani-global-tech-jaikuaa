// Guaraní audio playback. Only human recordings from the `guarani-audio`
// bucket are ever played. If a word has no recording we stay silent —
// NEVER fall back to window.speechSynthesis or any TTS engine.

import { getAudioSignedUrl } from "./audio.functions";

export function slugify(gn: string): string {
  let x = gn.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  x = x.toLowerCase();
  x = x.replace(/ñ/g, "n");
  x = x.replace(/['\u2019\u02BC\u02B9\u2018]/g, "");
  x = x.replace(/[^a-z0-9]+/g, "-");
  x = x.replace(/^-+|-+$/g, "");
  return x;
}

const urlCache = new Map<string, string | null>();

export async function getHumanAudioUrl(gn: string): Promise<string | null> {
  const slug = slugify(gn);
  if (urlCache.has(slug)) return urlCache.get(slug) ?? null;
  try {
    const { signedUrl } = await getAudioSignedUrl({ data: { gn } });
    const url = signedUrl ?? null;
    urlCache.set(slug, url);
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log(
        `[audio] Buscando audio para: ${gn} → slug: ${slug} → URL: ${url ?? "—"} → encontrado: ${Boolean(url)}`,
      );
    }
    return url;
  } catch {
    urlCache.set(slug, null);
    return null;
  }
}

export async function playGuarani(gn: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const url = await getHumanAudioUrl(gn);
  if (!url) return false; // silencio intencional — nunca TTS
  try {
    const audio = new Audio(url);
    audio.preload = "auto";
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("audio error"));
      const p = audio.play();
      if (p && typeof p.then === "function") p.catch((err) => reject(err));
    });
    return true;
  } catch {
    return false;
  }
}
