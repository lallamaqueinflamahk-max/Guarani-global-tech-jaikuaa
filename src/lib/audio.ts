// Guaraní audio playback. Only human recordings from the `guarani-audio`
// bucket are ever played. If a word has no recording we stay silent —
// NEVER fall back to window.speechSynthesis or any TTS engine.

import { useEffect } from "react";
import { getAudioSignedUrl } from "./audio.functions";
import { slugify } from "./slug";

export { slugify };


// In-memory signed-URL cache + preloaded <audio> element cache (LRU, cap 50).
const urlCache = new Map<string, string | null>();
const audioCache = new Map<string, HTMLAudioElement>();
const MAX_AUDIO_CACHE = 50;

// Persist signed URLs in sessionStorage so repeat visits within the tab
// skip the round-trip to the server function.
const SS_KEY = "aranduka:audio-urls";
function loadPersistedUrls() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(SS_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, string | null>;
    for (const [k, v] of Object.entries(obj)) urlCache.set(k, v);
  } catch {}
}
let loaded = false;
function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  loadPersistedUrls();
}
function persistUrls() {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, string | null> = {};
    urlCache.forEach((v, k) => (obj[k] = v));
    window.sessionStorage.setItem(SS_KEY, JSON.stringify(obj));
  } catch {}
}

function touchAudio(slug: string, audio: HTMLAudioElement) {
  // LRU: delete + re-insert to move to end.
  audioCache.delete(slug);
  audioCache.set(slug, audio);
  while (audioCache.size > MAX_AUDIO_CACHE) {
    const oldest = audioCache.keys().next().value;
    if (oldest === undefined) break;
    audioCache.delete(oldest);
  }
}

export async function getHumanAudioUrl(gn: string): Promise<string | null> {
  ensureLoaded();
  const slug = slugify(gn);
  if (urlCache.has(slug)) return urlCache.get(slug) ?? null;
  try {
    const { signedUrl } = await getAudioSignedUrl({ data: { gn } });
    const url = signedUrl ?? null;
    urlCache.set(slug, url);
    persistUrls();
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

/** Prefetch: resolve the signed URL and warm the browser's HTTP cache with
 *  a preloaded <audio> element. Safe to call many times; cheap after the
 *  first call for a given word. Returns the URL if available. */
export async function prefetchAudio(gn: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const slug = slugify(gn);
  const url = await getHumanAudioUrl(gn);
  if (!url) return null;
  if (!audioCache.has(slug)) {
    try {
      const el = new Audio();
      el.preload = "auto";
      el.src = url;
      // Kick the network fetch.
      el.load();
      touchAudio(slug, el);
    } catch {}
  } else {
    touchAudio(slug, audioCache.get(slug)!);
  }
  return url;
}

/** React hook: prefetch a list of words when a screen mounts. Caps at
 *  `max` so we never fire 109 requests at once on mobile. */
export function usePrefetchAudios(gns: string[], max = 10) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const list = gns.slice(0, max);
    let cancelled = false;
    (async () => {
      for (const gn of list) {
        if (cancelled) break;
        void prefetchAudio(gn);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gns.join("|"), max]);
}

export async function playGuarani(gn: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const slug = slugify(gn);
  const url = await getHumanAudioUrl(gn);
  if (!url) return false; // silencio intencional — nunca TTS
  try {
    let audio = audioCache.get(slug);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "auto";
    }
    touchAudio(slug, audio);
    // Fresh playback: rewind and play a clone so overlapping clicks work.
    const player = audio.cloneNode(true) as HTMLAudioElement;
    await new Promise<void>((resolve, reject) => {
      player.onended = () => resolve();
      player.onerror = () => reject(new Error("audio error"));
      const p = player.play();
      if (p && typeof p.then === "function") p.catch((err) => reject(err));
    });
    return true;
  } catch {
    return false;
  }
}
