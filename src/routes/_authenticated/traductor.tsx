import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftRight, Languages, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { translateText } from "@/lib/translate.functions";

export const Route = createFileRoute("/_authenticated/traductor")({
  head: () => ({ meta: [{ title: "Jaikuaa — Traductor" }] }),
  component: TraductorPage,
});

function TraductorPage() {
  const translateFn = useServerFn(translateText);
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<"es-gn" | "gn-es">("es-gn");
  const [result, setResult] = useState("");

  const mutation = useMutation({
    mutationFn: async (input: { text: string; direction: "es-gn" | "gn-es" }) =>
      translateFn({ data: input }),
    onSuccess: (data) => setResult(data.translation),
    onError: (err) => setResult(`Error: ${err instanceof Error ? err.message : "intentá de nuevo"}`),
  });

  const [from, to] = direction === "es-gn" ? ["Español", "Guaraní"] : ["Guaraní", "Español"];

  function swap() {
    setDirection((d) => (d === "es-gn" ? "gn-es" : "es-gn"));
    if (result) {
      setText(result);
      setResult("");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    mutation.mutate({ text: text.trim(), direction });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Gratuito
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Languages className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Traductor gratuito</h1>
            <p className="text-sm text-muted-foreground">Traducí entre español paraguayo y guaraní al instante.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="flex items-center justify-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
            <span className="flex-1 text-center font-display text-lg font-semibold text-foreground">{from}</span>
            <Button type="button" variant="outline" size="icon" onClick={swap} aria-label="Cambiar dirección">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center font-display text-lg font-semibold text-foreground">{to}</span>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={direction === "es-gn" ? "Escribí en español..." : "Ehai guaraníme..."}
            className="min-h-[140px] resize-none text-base"
            maxLength={1000}
          />

          <Button type="submit" variant="cta" size="lg" className="w-full" disabled={mutation.isPending || !text.trim()}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Traduciendo...
              </>
            ) : (
              "Traducir"
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">{to}</div>
            <p className="mt-2 whitespace-pre-wrap text-lg text-foreground">{result}</p>
          </div>
        )}
      </main>
    </div>
  );
}
