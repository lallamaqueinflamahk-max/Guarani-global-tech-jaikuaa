import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameFeedback } from "@/components/games/game-kit";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { GameShell, XpNote } from "@/components/games/game-shell";
import { answerWordOfDay, getWordOfDay } from "@/lib/games.functions";
import { syncStats } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/juegos/palabra-del-dia")({
  head: () => ({
    meta: [
      { title: "Palabra del día | Jaikuaa" },
      { name: "description", content: "Escuchá la palabra guaraní del día y elegí su significado." },
      { property: "og:title", content: "Palabra del día | Jaikuaa" },
      { property: "og:description", content: "Una palabra guaraní por día, con audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WordOfDay,
});

function WordOfDay() { return <GameShell title="Palabra del día" emoji="📅"><WordOfDayContent/></GameShell>; }

function WordOfDayContent() {
  const feedback = useGameFeedback();
  const getFn = useServerFn(getWordOfDay);
  const answerFn = useServerFn(answerWordOfDay);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["word-of-day"], queryFn: () => getFn() });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ choice: string; correct: boolean; answer: string } | null>(null);

  const d = q.data;
  const played = result ?? d?.played ?? null;

  async function choose(choice: string) {
    if (played || busy) return;
    setBusy(true);
    try {
      const r = await answerFn({ data: { choice } });
      setResult({ choice, correct: r.correct, answer: r.answer });
      feedback(r.correct ? "victory" : "error");
      void syncStats();
      void qc.invalidateQueries({ queryKey: ["word-of-day"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {q.isLoading || !d ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !d.word ? (
        <p className="text-center text-sm text-muted-foreground">Todavía no hay palabras con audio publicadas.</p>
      ) : (
        <div className="space-y-6">
          <p className="text-center text-xs text-muted-foreground">{d.day} · la misma palabra para todos hoy</p>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-card p-6 shadow-elegant">
            <p className="text-sm text-muted-foreground">Escuchala y elegí qué significa</p>
            <SpeakerButton gn={d.word.gn} size="md" className="h-14 w-14" />
            {played && <div className="font-display text-2xl font-bold text-primary">{d.word.gn}</div>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {d.word.options.map((o) => {
              const isAnswer = played && o === played.answer;
              const isWrongChoice = played && o === played.choice && !played.correct;
              return (
                <Button variant="ghost"
                  key={o}
                  type="button"
                  disabled={!!played || busy}
                  onClick={() => void choose(o)}
                  className={`h-auto whitespace-normal break-words justify-start rounded-lg border-2 p-4 text-left font-semibold transition ${
                    isAnswer
                      ? "border-primary bg-primary/10 text-primary"
                      : isWrongChoice
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-foreground hover:border-primary"
                  }`}
                >
                  {o}
                </Button>
              );
            })}
          </div>
          {played && (
            <div className="space-y-1 text-center">
              <p className="font-display text-lg font-bold text-foreground">
                {played.correct ? "¡Correcto!" : `Era: ${played.answer}`}
              </p>
              {played.correct && <XpNote xp={5} />}
              <p className="text-sm text-muted-foreground">Volvé mañana para una palabra nueva.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
