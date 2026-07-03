import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ gn: z.string().min(1) });

function slugifyAudio(gn: string): string {
  let x = gn.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  x = x.toLowerCase();
  x = x.replace(/ñ/g, "n");
  x = x.replace(/['\u2019\u02BC\u02B9\u2018]/g, "");
  x = x.replace(/[^a-z0-9]+/g, "-");
  x = x.replace(/^-+|-+$/g, "");
  return x;
}

function encodeStoragePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export const getAudioSignedUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
      return { signedUrl: null as string | null };
    }

    const file = `${slugifyAudio(data.gn)}.mp3`;
    const endpoint = `${supabaseUrl}/storage/v1/object/sign/guarani-audio/${encodeStoragePath(file)}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 60 * 60 * 24 }),
      });

      if (!response.ok) {
        return { signedUrl: null as string | null };
      }

      const signed = (await response.json()) as { signedURL?: string; signedUrl?: string };
      const signedPath = signed.signedURL ?? signed.signedUrl;

      if (!signedPath) {
        return { signedUrl: null as string | null };
      }

      const signedUrl = signedPath.startsWith("http")
        ? signedPath
        : `${supabaseUrl}/storage/v1${signedPath}`;

      return { signedUrl };
    } catch {
      // Missing object / storage unavailable → client falls back to TTS.
      return { signedUrl: null as string | null };
    }
  });
