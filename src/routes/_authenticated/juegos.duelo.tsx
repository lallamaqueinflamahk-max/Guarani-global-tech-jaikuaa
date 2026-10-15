import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameShell, LessonFilter, NotEnough, XpNote, pickDistinct, shuffle, useGameWords } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/juegos/duelo")({
  head: () => ({
    meta: [
      { title: "Duelo Cara a Cara | Jaikuaa" },
      { name: "description", content: "Dos jugadores, un celular: el primero que toca la traducción correcta de la palabra guaraní gana el punto." },
      { property: "og:title", content: "Duelo Cara a Cara | Jaikuaa" },
      { property: "og:description", content: "Duelo de reflejos en guaraní para dos personas en el mismo celular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Duel,
});

const TARGET = 5;
const MIN_WORDS = 8;
const LOCK_MS = 1000;
const NEXT_MS = 1300;

type Round = { word: GameWord; options: string[] };

function Duel() {
  const [lesson, setLesson] = useState<number | null>(null);
  const q = useGameWords(lesson);
  const [match, setMatch] = useState(0);
  const pool = useMemo(() => {
    const seen = new Set<string>();
    return pickDistinct(q.data?.words ?? [], 500).filter((w) => {
      const k = w.es.trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [q.data]);

  return (
    <GameShell title="Duelo Cara a Cara" emoji="🤜" sponsorSlot="duelo">
      <LessonFilter value={lesson} onChange={setLesson} />
      <div className="mt-6">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : pool.length < MIN_WORDS ? (
          <NotEnough min={MIN_WORDS} />
        ) : (
          <Board key={`${lesson}-${match}`} pool={pool} onRematch={() => setMatch((m) => m + 1)} />
        )}
      </div>
    </GameShell>
  );
}

function makeRound(pool: GameWord[], used: Set<string>): Round {
  const fresh = pool.filter((w) => !used.has(w.gn));
  const word = shuffle(fresh.length ? fresh : pool)[0]!;
  const distractors = shuffle(pool.filter((w) => w.es !== word.es)).slice(0, 2).map((w) => w.es);
  return { word, options: shuffle([word.es, ...distractors]) };
}

function Board({ pool, onRematch }: { pool: GameWord[]; onRematch: () => void }) {
  const feedback = useGameFeedback();
  const used = useRef(new Set<string>());
  const [round, setRound] = useState<Round>(() => makeRound(pool, used.current));
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [locked, setLocked] = useState<[boolean, boolean]>([false, false]);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [wrongPick, setWrongPick] = useState<[string | null, string | null]>([null, null]);
  const [started, setStarted] = useState(false);
  const recorded = useRef(false);
  const finished = score[0] >= TARGET || score[1] >= TARGET;
  // XP solo para el dueño de la sesión (Jugador 1): 3 por punto + 5 si gana, máx. 20.
  const xp = Math.min(20, score[0] * 3 + (score[0] >= TARGET ? 5 : 0));

  const say = useCallback((w: GameWord) => { if (w.hasAudio) void playGuarani(w.gn); }, []);

  useEffect(() => { if (started) say(round.word); }, [round, started, say]);

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "duelo", xp });
  }, [finished, xp, feedback]);

  function pick(p: 0 | 1, option: string) {
    if (!started || finished || winner !== null || locked[p]) return;
    if (option === round.word.es) {
      feedback("success");
      setWinner(p);
      const next: [number, number] = [...score] as [number, number];
      next[p] += 1;
      setScore(next);
      used.current.add(round.word.gn);
      if (next[p] < TARGET) {
        window.setTimeout(() => {
          setWinner(null);
          setLocked([false, false]);
          setWrongPick([null, null]);
          setRound(makeRound(pool, used.current));
        }, NEXT_MS);
      }
    } else {
      feedback("error");
      setLocked((l) => (p === 0 ? [true, l[1]] : [l[0], true]));
      setWrongPick((w) => (p === 0 ? [option, w[1]] : [w[0], option]));
      window.setTimeout(() => {
        setLocked((l) => (p === 0 ? [false, l[1]] : [l[0], false]));
        setWrongPick((w) => (p === 0 ? [null, w[1]] : [w[0], null]));
      }, LOCK_MS);
    }
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-elegant">
        <p className="font-display text-xl font-bold text-foreground">Apoyen el celular sobre la mesa</p>
        <p className="text-sm text-muted-foreground">
          Cada uno se sienta de un lado. Suena una palabra en guaraní: el primero que toca su traducción gana el punto.
          Si te equivocás, quedás bloqueado un segundo. Gana quien llega a {TARGET}.
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
        <p className="font-display text-2xl font-bold text-foreground">¡{champ} ganó el duelo!</p>
        <p className="font-display text-4xl font-bold text-primary tabular-nums">{score[0]} — {score[1]}</p>
        {xp > 0 && <XpNote xp={xp} />}
        <p className="text-xs text-muted-foreground">El XP se suma a la cuenta con sesión iniciada (Jugador 1).</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={onRematch}><RotateCcw /> Revancha ya</Button>
          <ShareResult text={`¡Jugamos un Duelo Cara a Cara en guaraní en Jaikuaa y terminó ${score[0]} a ${score[1]}! ¿Te animás a desafiarme?`} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
      <PlayerHalf p={1} round={round} winner={winner} locked={locked[1]} wrong={wrongPick[1]} onPick={pick} rotated />
      <div className="flex items-center justify-between gap-3 border-y border-border bg-primary px-4 py-3 text-primary-foreground">
        <span className="font-display text-sm font-semibold">J1</span>
        <span className="font-display text-3xl font-bold tabular-nums" aria-live="polite">{score[0]} — {score[1]}</span>
        <span className="font-display text-sm font-semibold">J2</span>
      </div>
      <PlayerHalf p={0} round={round} winner={winner} locked={locked[0]} wrong={wrongPick[0]} onPick={pick} />
      <Button variant="ghost" className="rounded-none border-t border-border" onClick={() => say(round.word)} disabled={!round.word.hasAudio}>
        <Volume2 /> Escuchar otra vez
      </Button>
    </div>
  );
}

function PlayerHalf({ p, round, winner, locked, wrong, onPick, rotated }: {
  p: 0 | 1; round: Round; winner: 0 | 1 | null; locked: boolean; wrong: string | null;
  onPick: (p: 0 | 1, o: string) => void; rotated?: boolean;
}) {
  const won = winner === p;
  const lost = winner !== null && winner !== p;
  return (
    <section
      aria-label={`Jugador ${p + 1}`}
      className={`space-y-3 p-4 transition-colors ${rotated ? "rotate-180" : ""} ${won ? "bg-primary/10" : locked ? "bg-accent/10" : ""}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Jugador {p + 1}</span>
        <span>{won ? "¡Punto!" : lost ? "Punto rival" : locked ? "Bloqueado…" : "¿Qué significa?"}</span>
      </div>
      <div className="text-center font-display text-3xl font-bold text-foreground">{round.word.gn}</div>
      <div className="grid gap-2">
        {round.options.map((o) => {
          const correct = winner !== null && o === round.word.es;
          const isWrong = wrong === o;
          return (
            <Button
              key={o}
              type="button"
              variant="outline"
              disabled={locked || winner !== null}
              onPointerDown={(e) => { e.preventDefault(); onPick(p, o); }}
              className={`h-14 whitespace-normal break-words text-base font-semibold ${
                correct ? "border-primary bg-primary/15 text-primary disabled:opacity-100" : isWrong ? "border-accent bg-accent/15 text-accent disabled:opacity-100" : ""
              }`}
            >
              {o}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
