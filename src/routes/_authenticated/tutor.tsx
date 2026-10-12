import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "Jaikuaa — Tutor IA" }] }),
  component: TutorPage,
});

const SUGGESTIONS = [
  "¿Cómo se conjugan los verbos en guaraní?",
  "Enseñame saludos básicos en guaraní",
  "¿Qué significa 'che rohayhu'?",
  "Practiquemos una conversación corta",
];

function TutorPage() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/tutor" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || isLoading) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div role="note" className="sticky top-0 z-20 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-900 sm:text-sm">
        ⚠️ Función experimental. Este contenido lo genera una inteligencia artificial y no está validado por especialistas en lengua guaraní. Puede contener errores: no lo uses como referencia oficial.
      </div>
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              Experimental
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 sm:px-6">
        <div className="flex items-center gap-3 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Tutor IA</h1>
            <p className="text-sm text-muted-foreground">Tu profe de guaraní, disponible 24/7.</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card p-6">
              <p className="text-foreground">
                ¡Mba'éichapa! 👋 Soy tu tutor de guaraní. Preguntame lo que quieras: gramática, vocabulario,
                cultura, o practiquemos una conversación.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-lg border border-border/60 bg-background p-3 text-left text-sm text-foreground transition hover:border-accent hover:bg-accent/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/60 bg-card text-foreground"
                  }`}
                >
                  {text || (isUser ? "" : <Loader2 className="h-4 w-4 animate-spin" />)}
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="inline h-4 w-4 animate-spin" /> Pensando...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Error: {error.message}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="border-t border-border/50 py-4"
        >
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              placeholder="Escribí tu pregunta..."
              className="min-h-[52px] resize-none"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" variant="cta" disabled={isLoading || !input.trim()} aria-label="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
