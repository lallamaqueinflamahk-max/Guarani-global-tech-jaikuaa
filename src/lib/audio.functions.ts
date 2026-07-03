import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { slugify } from "./audio";

const Input = z.object({ gn: z.string().min(1) });

export const getAudioSignedUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const file = `${slugify(data.gn)}.mp3`;
    try {
      const { data: signed, error } = await supabase.storage
        .from("guarani-audio")
        .createSignedUrl(file, 60 * 60 * 24); // 24 horas

      if (error || !signed?.signedUrl) {
        return { signedUrl: null as string | null };
      }
      return { signedUrl: signed.signedUrl as string | null };
    } catch {
      // Missing object / storage unavailable → client falls back to TTS.
      return { signedUrl: null as string | null };
    }
  });
