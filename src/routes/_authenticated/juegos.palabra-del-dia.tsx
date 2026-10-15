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
import { ShareResult } from "@/components/games/share-result";
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

function WordOfDay() { return <GameShell title="Palabra del día" emoji="📅" sponsorSlot="palabra-del-dia"><WordOfDayContent/></GameShell>; }

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
          <p className="text-center text-xs text-muted-foreground">La misma palabra para todos hoy</p>
          <div className="daily-card relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl p-7 text-center">
            <svg viewBox="0 0 100 100" className="daily-lace pointer-events-none absolute -right-10 -top-10 h-48 w-48" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
              {Array.from({ length: 16 }, (_, k) => <line key={k} x1="50" y1="50" x2={50 + 48 * Math.cos((k * Math.PI) / 8)} y2={50 + 48 * Math.sin((k * Math.PI) / 8)} />)}
              {[10, 22, 34, 46].map((r) => <circle key={r} cx="50" cy="50" r={r} strokeDasharray={r > 20 ? "3 3" : undefined} />)}
            </svg>
            <span className="daily-chip rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest">Carta del día · {d.day}</span>
            <p className="text-sm opacity-85">Escuchala y elegí qué significa</p>
            <div className="daily-play flex h-24 w-24 items-center justify-center rounded-full">
              <SpeakerButton gn={d.word.gn} size="md" className="h-20 w-20 [&_svg]:h-9 [&_svg]:w-9" />
            </div>
            {played ? (
              <div className="font-display text-4xl font-bold">{d.word.gn}</div>
            ) : (
              <div className="font-display text-4xl font-bold tracking-[0.3em] opacity-40" aria-hidden>? ? ?</div>
            )}
            {played?.correct && <span className="daily-chip rounded-full px-3 py-1 text-xs font-bold">★ Coleccionada</span>}
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
              {played.correct && <div className="pt-1"><ShareResult text="¡Acerté la Palabra del día en guaraní de Jaikuaa! ¿Vos la sabés?" /></div>}
              <p className="text-sm text-muted-foreground">Volvé mañana para una palabra nueva.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
