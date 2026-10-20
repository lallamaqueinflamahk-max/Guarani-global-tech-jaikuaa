import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeCertificateStatus } from "@/lib/community.functions";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(year: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const s = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `JK-${year}-${s.slice(0, 3)}${s.slice(3)}`;
}

/** Emite (o devuelve) el código único del certificado. Solo si el alumno completó el curso. */
export const issueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: z.string().trim().min(2).max(80) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const status = await computeCertificateStatus(me);
    if (!status.eligible || !status.issuedAt) throw new Error("Curso incompleto");
    const { data: existing } = await supabaseAdmin.from("certificates").select("code").eq("user_id", me).maybeSingle();
    if (existing) return { code: existing.code };
    const year = new Date(status.issuedAt).getUTCFullYear();
    for (let i = 0; i < 5; i++) {
      const code = randomCode(year);
      const { error } = await supabaseAdmin.from("certificates").insert({
        user_id: me,
        code,
        full_name: status.name || data.name,
        lessons: status.required,
        issued_at: status.issuedAt,
      });
      if (!error) return { code };
    }
    throw new Error("No se pudo emitir el certificado");
  });

/** Verificación pública por código: devuelve solo lo impreso en el certificado. */
export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => z.object({ code: z.string().trim().toUpperCase().max(20) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("certificates")
      .select("code, full_name, lessons, issued_at")
      .eq("code", data.code)
      .maybeSingle();
    return row ?? null;
  });
