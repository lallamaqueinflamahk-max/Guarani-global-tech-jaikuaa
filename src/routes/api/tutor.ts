import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { AI_LIMIT_MESSAGE, consumeAiQuota, verifyBearer } from "@/lib/server-guards.server";

import { AI_GUARANI_TOOLS_ENABLED } from "@/lib/features";

const SYSTEM_PROMPT =
  "Sos un tutor experto en guaraní paraguayo, cálido y motivador. Ayudás a los estudiantes a aprender guaraní explicando con claridad en español paraguayo (voseo). Conocés la gramática, el vocabulario y la cultura guaraní. Usá ejemplos cortos, emojis ocasionales y un tono amigable. Cuando enseñes una palabra o frase en guaraní, mostrala en **negrita** y luego su traducción.";

export const Route = createFileRoute("/api/tutor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!AI_GUARANI_TOOLS_ENABLED) return new Response("Not available", { status: 404 });
        const user = await verifyBearer(request.headers);
        if (!user) return new Response("Unauthorized", { status: 401 });

        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages) || messages.length > 100) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        if (!(await consumeAiQuota(user, "tutor"))) {
          return new Response(AI_LIMIT_MESSAGE, { status: 429 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
