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
    const file = `${slugifyAudio(data.gn)}.mp3`;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed, error } = await supabaseAdmin.storage
        .from("guarani-audio")
        .createSignedUrl(file, 60 * 60 * 24);

      if (error || !signed?.signedUrl) return { signedUrl: null as string | null };
      return { signedUrl: signed.signedUrl as string | null };
    } catch {
      // Missing object / storage unavailable: keep the app stable, no robotic fallback.
      return { signedUrl: null as string | null };
    }
  });
