import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_LIMIT_MESSAGE, consumeAiQuota } from "./server-guards.server";

const Input = z.object({
  text: z.string().min(1).max(1000),
  direction: z.enum(["es-gn", "gn-es"]),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Falta LOVABLE_API_KEY");
    const { data: admin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const allowed = await consumeAiQuota(
      { userId: context.userId, isAdmin: admin === true },
      "traductor",
    );
    if (!allowed) return { translation: "", limited: true as const, message: AI_LIMIT_MESSAGE };
    const gateway = createLovableAiGatewayProvider(key);
    const [from, to] =
      data.direction === "es-gn"
        ? ["español paraguayo", "guaraní paraguayo"]
        : ["guaraní paraguayo", "español paraguayo"];
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `Sos un traductor experto entre español paraguayo y guaraní paraguayo. Traducí el texto del usuario de ${from} a ${to}. Respondé SOLO con la traducción, sin comillas, sin explicaciones, sin notas. Mantené el sentido natural y cotidiano.`,
      prompt: data.text,
    });
    return { translation: text.trim(), limited: false as const, message: "" };
  });
