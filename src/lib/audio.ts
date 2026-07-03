// Guaraní audio playback. Generates a deterministic slug from each Guaraní
// word and requests a signed URL for the matching .mp3 from the `guarani-audio`
// storage bucket. Only human-recorded audio is played; missing files stay silent.

import { getAudioSignedUrl } from "./audio.functions";

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

export async function playGuarani(gn: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { signedUrl } = await getAudioSignedUrl({ data: { gn } });
    if (!signedUrl) return;
    const audio = new Audio(signedUrl);
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
    // No TTS: Jaikuaa only plays the original human recordings.
  }
}
