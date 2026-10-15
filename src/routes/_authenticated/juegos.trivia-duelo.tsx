import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameShell, XpNote, shuffle } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { ROULETTE, TRIVIA, type TriviaQuestion } from "@/lib/trivia";

export const Route = createFileRoute("/_authenticated/juegos/trivia-duelo")({
  head: () => ({
    meta: [
      { title: "Duelo de Trivia Paraguaya | Jaikuaa" },
      { name: "description", content: "Dos jugadores, un celular: el primero que acierta la pregunta sobre cultura paraguaya gana el punto." },
      { property: "og:title", content: "Duelo de Trivia Paraguaya | Jaikuaa" },
      { property: "og:description", content: "Trivia de gastronomía, mitos, deportes, música, historia y naturaleza para dos personas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TriviaDuel,
});

const TARGET = 5;
const NEXT_MS = 1800;
type Q = TriviaQuestion & { cat: string; emoji: string };

function buildDeck(): Q[] {
  return shuffle(ROULETTE.flatMap((id) => TRIVIA[id].questions.map((q) => ({ ...q, cat: TRIVIA[id].title, emoji: TRIVIA[id].emoji }))));
}

function TriviaDuel() {
  const [match, setMatch] = useState(0);
  return (
    <>
      <ValidationNotice />
      <GameShell title="Duelo de Trivia" emoji="🧠" sponsorSlot="trivia-duelo">
        <Board key={match} onRematch={() => setMatch((m) => m + 1)} />
      </GameShell>
    </>
  );
}

function Board({ onRematch }: { onRematch: () => void }) {
  const feedback = useGameFeedback();
  const [deck] = useState(buildDeck);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  // Respuesta de cada jugador en esta pregunta (índice o null)
  const [picks, setPicks] = useState<[number | null, number | null]>([null, null]);
  const [winner, setWinner] = useState<0 | 1 | "none" | null>(null);
  const [started, setStarted] = useState(false);
  const recorded = useRef(false);
  const q = deck[idx % deck.length]!;
  const finished = score[0] >= TARGET || score[1] >= TARGET;
  const xp = Math.min(20, score[0] * 3 + (score[0] >= TARGET ? 5 : 0));

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "trivia-duelo", xp });
  }, [finished, xp, feedback]);

  function next(sc: [number, number]) {
    if (sc[0] >= TARGET || sc[1] >= TARGET) return;
    window.setTimeout(() => { setPicks([null, null]); setWinner(null); setIdx((i) => i + 1); }, NEXT_MS);
  }

  function pick(p: 0 | 1, option: number) {
    if (!started || finished || winner !== null || picks[p] !== null) return;
    const np: [number | null, number | null] = p === 0 ? [option, picks[1]] : [picks[0], option];
    setPicks(np);
    if (option === q.answer) {
      // Acierto: punto para quien respondió primero bien
      feedback("success");
      setWinner(p);
      const sc: [number, number] = [...score] as [number, number];
      sc[p] += 1;
      setScore(sc);
      next(sc);
    } else {
      feedback("error");
      const other = p === 0 ? 1 : 0;
      // Error: si el rival ya falló también, nadie suma
      if (np[other] !== null) { setWinner("none"); next(score); }
    }
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-elegant">
        <p className="font-display text-xl font-bold text-foreground">Apoyen el celular sobre la mesa</p>
        <p className="text-sm text-muted-foreground">
          Gastronomía, mitos, deportes, música, historia y naturaleza del Paraguay. Cada uno tiene una sola chance por pregunta:
          el primero que acierta gana el punto. Si fallás, tu rival puede responder tranquilo. Gana quien llega a {TARGET}.
        </p>
        <Button size="lg" className="h-14 w-full text-lg" onClick={() => setStarted(true)}>¡Empezar duelo!</Button>
      </div>
    );
  }

  if (finished) {
    const champ = score[0] > score[1] ? "Jugador 1" : "Jugador 2";
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-elegant">
        <div className="text-5xl" aria-hidden>🏆</div>
        <p className="font-display text-2xl font-bold text-foreground">¡{champ} ganó la trivia!</p>
        <p className="font-display text-4xl font-bold text-primary tabular-nums">{score[0]} — {score[1]}</p>
        {xp > 0 && <XpNote xp={xp} />}
        <p className="text-xs text-muted-foreground">El XP se suma a la cuenta con sesión iniciada (Jugador 1).</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={onRematch}><RotateCcw /> Revancha ya</Button>
          <ShareResult text={`¡Jugamos un Duelo de Trivia Paraguaya en Jaikuaa y terminó ${score[0]} a ${score[1]}! ¿Cuánto sabés del Paraguay?`} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
      <Half p={1} q={q} pick={picks[1]} winner={winner} onPick={pick} rotated />
      <div className="flex items-center justify-between gap-3 border-y border-border bg-primary px-4 py-3 text-primary-foreground">
        <span className="font-display text-sm font-semibold">J1</span>
        <span className="font-display text-3xl font-bold tabular-nums" aria-live="polite">{score[0]} — {score[1]}</span>
        <span className="font-display text-sm font-semibold">J2</span>
      </div>
      <Half p={0} q={q} pick={picks[0]} winner={winner} onPick={pick} />
      {winner !== null && <p className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">{q.explanation}</p>}
    </div>
  );
}

function Half({ p, q, pick, winner, onPick, rotated }: {
  p: 0 | 1; q: Q; pick: number | null; winner: 0 | 1 | "none" | null;
  onPick: (p: 0 | 1, o: number) => void; rotated?: boolean;
}) {
  const won = winner === p;
  const status = won ? "¡Punto!" : winner === "none" ? "Nadie acertó" : winner !== null ? "Punto rival" : pick !== null ? "Fallaste, espera…" : "¡Rápido!";
  return (
    <section aria-label={`Jugador ${p + 1}`} className={`space-y-3 p-4 transition-colors ${rotated ? "rotate-180" : ""} ${won ? "bg-primary/10" : pick !== null && winner === null ? "bg-accent/10" : ""}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{q.emoji} {q.cat}</span>
        <span>{status}</span>
      </div>
      <div className="text-center font-display text-lg font-bold leading-snug text-foreground">{q.q}</div>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((o, i) => {
          const reveal = winner !== null && i === q.answer;
          const wrong = pick === i && i !== q.answer;
          return (
            <Button
              key={o}
              type="button"
              variant="outline"
              disabled={pick !== null || winner !== null}
              onPointerDown={(e) => { e.preventDefault(); onPick(p, i); }}
              className={`h-auto min-h-14 whitespace-normal break-words py-2 text-sm font-semibold ${reveal ? "border-primary bg-primary/15 text-primary disabled:opacity-100" : wrong ? "border-accent bg-accent/15 text-accent disabled:opacity-100" : ""}`}
            >
              {o}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
