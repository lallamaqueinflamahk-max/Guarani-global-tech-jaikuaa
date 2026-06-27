// Guaraní audio playback. Generates a deterministic slug from each Guaraní
// word and plays the matching .mp3 from the `guarani-audio` storage bucket.
// Falls back to browser speechSynthesis (TTS) when the file is missing.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const BUCKET = "guarani-audio";

export function slugify(gn: string): string {
  let x = gn.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  x = x.toLowerCase();
  x = x.replace(/ñ/g, "n");
  // strip puso (apostrophe variants)
  x = x.replace(/['\u2019\u02BC\u02B9\u2018]/g, "");
  // anything that isn't [a-z0-9] becomes a single hyphen
  x = x.replace(/[^a-z0-9]+/g, "-");
  x = x.replace(/^-+|-+$/g, "");
  return x;
}

export function audioUrlFor(gn: string): string {
  const file = `${slugify(gn)}.mp3`;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${file}`;
}

function ttsFallback(text: string) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-PY";
  u.rate = 0.85;
  synth.speak(u);
}

export async function playGuarani(gn: string): Promise<void> {
  if (typeof window === "undefined") return;
  const url = audioUrlFor(gn);
  try {
    const audio = new Audio(url);
    audio.preload = "auto";
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("audio error"));
      const p = audio.play();
      if (p && typeof p.then === "function") {
        p.catch((err) => reject(err));
      }
    });
  } catch {
    ttsFallback(gn);
  }
}
