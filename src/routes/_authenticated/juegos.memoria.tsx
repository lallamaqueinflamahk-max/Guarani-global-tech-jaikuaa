import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameShell, LessonFilter, NotEnough, XpNote, pickDistinct, shuffle, useGameWords } from "@/components/games/game-shell";
import { useGameFeedback } from "@/components/games/game-kit";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/juegos/memoria")({
  head: () => ({
    meta: [
      { title: "Memoria | Jaikuaa" },
      { name: "description", content: "Uní cada palabra en guaraní con su traducción al español." },
      { property: "og:title", content: "Memoria | Jaikuaa" },
      { property: "og:description", content: "Juego de memoria con palabras guaraníes y audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Memory,
});

const PAIRS = 6;

function Memory() {
  const [lesson, setLesson] = useState<number | null>(null);
  const q = useGameWords(lesson);
  const [round, setRound] = useState(0);
  const words = useMemo(() => {
    // Traducciones distintas para que cada par sea inequívoco.
    const seenEs = new Set<string>();
    return pickDistinct(q.data?.words ?? [], 500).filter((w) => {
      const k = w.es.trim().toLowerCase();
      if (seenEs.has(k)) return false;
      seenEs.add(k);
      return true;
    }).slice(0, PAIRS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, round]);

  return (
    <GameShell title="Memoria" emoji="🃏">
      <LessonFilter value={lesson} onChange={setLesson} />
      <div className="mt-6">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : words.length < PAIRS ? (
          <NotEnough min={PAIRS} />
        ) : (
          <Board key={round} words={words} onNext={() => setRound((r) => r + 1)} />
        )}
      </div>
    </GameShell>
  );
}

type Card = { id: number; pair: number; kind: "gn" | "es"; text: string; word: GameWord };

function Board({ words, onNext }: { words: GameWord[]; onNext: () => void }) {
  const feedback = useGameFeedback();
  const cards = useMemo<Card[]>(
    () =>
      shuffle(
        words.flatMap((w, i) => [
          { id: i * 2, pair: i, kind: "gn" as const, text: w.gn, word: w },
          { id: i * 2 + 1, pair: i, kind: "es" as const, text: w.es, word: w },
        ]),
      ),
    [words],
  );
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const done = matched.size === PAIRS;
  const xp = Math.max(10, 20 - Math.max(0, attempts - PAIRS));
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    recordCompletion({ source: "game", sourceRef: "memoria", xp });
  }, [done, xp]);

  function flip(c: Card) {
    if (open.length === 2 || open.includes(c.id) || matched.has(c.pair)) return;
    if (c.kind === "gn" && c.word.hasAudio) void playGuarani(c.word.gn);
    const next = [...open, c.id];
    setOpen(next);
    if (next.length === 2) {
      setAttempts((a) => a + 1);
      const [a, b] = next.map((id) => cards.find((x) => x.id === id)!);
      if (a!.pair === b!.pair) {
        feedback("success");
        setMatched((m) => new Set(m).add(a!.pair));
        setOpen([]);
      } else {
        feedback("error");
        window.setTimeout(() => setOpen([]), 900);
      }
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Intentos: <span className="font-semibold text-foreground">{attempts}</span>
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const shown = open.includes(c.id) || matched.has(c.pair);
          return (
            <Button variant="ghost"
              key={c.id}
              type="button"
              onClick={() => flip(c)}
              className={`flex h-auto whitespace-normal break-words aspect-[3/4] items-center justify-center rounded-xl border-2 p-2 text-center text-sm font-semibold transition sm:text-base ${
                matched.has(c.pair)
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : shown
                    ? c.kind === "gn"
                      ? "border-accent bg-card text-accent"
                      : "border-primary bg-card text-foreground"
                    : "border-primary bg-primary text-primary-foreground"
              }`}
            >
              {shown ? c.text : <span className="text-2xl" aria-hidden>?</span>}
            </Button>
          );
        })}
      </div>
      {done && (
        <div className="space-y-2 text-center">
          <p className="font-display text-xl font-bold text-foreground">¡Completaste la memoria en {attempts} intentos!</p>
          <XpNote xp={xp} />
          <Button onClick={onNext}>Jugar de nuevo</Button>
        </div>
      )}
    </div>
  );
}
