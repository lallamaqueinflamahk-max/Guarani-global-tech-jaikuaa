import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  text: z.string().min(1).max(1000),
  direction: z.enum(["es-gn", "gn-es"]),
});

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Falta LOVABLE_API_KEY");
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
    return { translation: text.trim() };
  });
