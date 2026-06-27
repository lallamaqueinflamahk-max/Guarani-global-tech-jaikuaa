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
    const { data: signed, error } = await supabase.storage
      .from("guarani-audio")
      .createSignedUrl(file, 60 * 60 * 24); // 24 horas

    if (error) throw error;
    return { signedUrl: signed.signedUrl };
  });
