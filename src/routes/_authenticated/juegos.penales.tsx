import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { GameShell, LessonFilter, NotEnough, XpNote, pickDistinct, shuffle, useGameWords } from "@/components/games/game-shell";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/juegos/penales")({
  head: () => ({
    meta: [
      { title: "Penales | Jaikuaa" },
      { name: "description", content: "Acertá el significado de la palabra guaraní y pateá el penal." },
      { property: "og:title", content: "Penales | Jaikuaa" },
      { property: "og:description", content: "Tanda de 5 penales con palabras guaraníes y audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Penalties,
});

const SHOTS = 5;
const XP_PER_GOAL = 4;

type Shot = { word: GameWord; options: string[] };

function Penalties() {
  const [lesson, setLesson] = useState<number | null>(null);
  const q = useGameWords(lesson);
  const [round, setRound] = useState(0);
  const shots = useMemo<Shot[] | null>(() => {
    const words = q.data?.words ?? [];
    const seenEs = new Set<string>();
    const pool = pickDistinct(words, 500).filter((w) => {
      const k = w.es.trim().toLowerCase();
      if (!k || seenEs.has(k)) return false;
      seenEs.add(k);
      return true;
    });
    if (pool.length < SHOTS) return null;
    return pool.slice(0, SHOTS).map((w) => {
      const wrong = shuffle(pool.filter((o) => o !== w)).slice(0, 2).map((o) => o.es.trim());
      return { word: w, options: shuffle([w.es.trim(), ...wrong]) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, round]);

  return (
    <GameShell title="Penales" emoji="⚽">
      <LessonFilter value={lesson} onChange={setLesson} />
      <div className="mt-6">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !shots ? (
          <NotEnough min={SHOTS} />
        ) : (
          <Match key={round} shots={shots} onNext={() => setRound((r) => r + 1)} />
        )}
      </div>
    </GameShell>
  );
}

type Side = "left" | "center" | "right";
type Phase = "question" | "aim" | "goal" | "saved";

const SIDE_X: Record<Side, number> = { left: -70, center: 0, right: 70 };

function Match({ shots, onNext }: { shots: Shot[]; onNext: () => void }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [results, setResults] = useState<boolean[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [ball, setBall] = useState<Side | null>(null);
  const [keeper, setKeeper] = useState<Side>("center");
  const done = results.length === SHOTS && phase !== "goal" && phase !== "saved";
  const goals = results.filter(Boolean).length;
  const shot = shots[idx]!;
  const recorded = useRef(false);

  useEffect(() => {
    if (phase === "question" && shot.word.hasAudio) void playGuarani(shot.word.gn);
  }, [idx, phase, shot]);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    recordCompletion({ source: "game", sourceRef: "penales", xp: Math.min(20, goals * XP_PER_GOAL) });
  }, [done, goals]);

  function answer(o: string) {
    if (phase !== "question") return;
    setChoice(o);
    if (o === shot.word.es.trim()) {
      setPhase("aim");
    } else {
      // El arquero ataja: la pelota va al centro y él también.
      setKeeper("center");
      setBall("center");
      setResults((r) => [...r, false]);
      setPhase("saved");
    }
  }

  function kick(side: Side) {
    if (phase !== "aim") return;
    const others = (["left", "center", "right"] as Side[]).filter((s) => s !== side);
    setKeeper(others[Math.floor(Math.random() * others.length)]!);
    setBall(side);
    setResults((r) => [...r, true]);
    setPhase("goal");
  }

  function next() {
    setChoice(null);
    setBall(null);
    setKeeper("center");
    if (idx + 1 < SHOTS) setIdx(idx + 1);
    setPhase("question");
  }

  if (done) {
    const xp = Math.min(20, goals * XP_PER_GOAL);
    return (
      <div className="space-y-5">
        <Scoreboard results={results} />
        <p className="text-center font-display text-2xl font-bold text-foreground">
          {goals} de {SHOTS} goles
        </p>
        <XpNote xp={xp} />
        <ul className="space-y-2">
          {shots.map((s, i) => (
            <li key={i} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
              <span aria-hidden>{results[i] ? "⚽" : "🧤"}</span>
              <span className="font-semibold text-primary">{s.word.gn}</span>
              <span className="text-muted-foreground">— {s.word.es}</span>
              {s.word.hasAudio && <SpeakerButton gn={s.word.gn} className="ml-auto" />}
            </li>
          ))}
        </ul>
        <div className="text-center">
          <Button onClick={onNext}>Otra tanda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Scoreboard results={results} current={idx} />
      <Pitch ball={ball} keeper={keeper} phase={phase} onKick={kick} />

      <div className="flex items-center justify-center gap-2">
        <span className="font-display text-2xl font-bold text-primary">{shot.word.gn}</span>
        {shot.word.hasAudio && <SpeakerButton gn={shot.word.gn} size="md" />}
      </div>

      {phase === "aim" ? (
        <p className="text-center text-sm font-semibold text-foreground">¡Bien! Elegí dónde patear.</p>
      ) : (
        <div className="grid gap-2">
          {shot.options.map((o) => {
            const isAnswer = phase !== "question" && o === shot.word.es.trim();
            const isWrong = phase === "saved" && o === choice;
            return (
              <button
                key={o}
                type="button"
                disabled={phase !== "question"}
                onClick={() => answer(o)}
                className={`rounded-xl border-2 p-3 text-left font-semibold transition ${
                  isAnswer
                    ? "border-primary bg-primary/10 text-primary"
                    : isWrong
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-card text-foreground hover:border-primary"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}

      {(phase === "goal" || phase === "saved") && (
        <div className="space-y-2 text-center">
          <p className="font-display text-xl font-bold text-foreground">
            {phase === "goal" ? "¡GOOOL!" : `¡Atajó! Era: ${shot.word.es}`}
          </p>
          <Button onClick={next}>{idx + 1 < SHOTS ? "Siguiente penal" : "Ver resultado"}</Button>
        </div>
      )}
    </div>
  );
}

function Scoreboard({ results, current }: { results: boolean[]; current?: number }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
      <span className="font-display text-lg font-bold">
        Goles {results.filter(Boolean).length}/{SHOTS}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: SHOTS }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 border-primary-foreground ${
              results[i] === true ? "bg-primary-foreground" : results[i] === false ? "bg-accent" : ""
            } ${current === i ? "ring-2 ring-accent ring-offset-1 ring-offset-primary" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Cancha vista desde atrás del pateador, con SVG simple. */
function Pitch({
  ball,
  keeper,
  phase,
  onKick,
}: {
  ball: Side | null;
  keeper: Side;
  phase: Phase;
  onKick: (s: Side) => void;
}) {
  const kicked = ball !== null;
  const ballX = ball ? SIDE_X[ball] : 0;
  const ballY = kicked ? -150 : 0;
  const keeperX = phase === "goal" || phase === "saved" ? SIDE_X[keeper] * 0.8 : 0;
  const dur = "transform 450ms cubic-bezier(.2,.8,.3,1)";
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl shadow-elegant">
      <svg viewBox="-160 -230 320 260" className="block w-full" role="img" aria-label="Cancha y arco">
        <defs>
          <pattern id="stripes" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="4" height="8" fill="var(--accent)" />
            <rect x="4" width="4" height="8" fill="var(--background)" />
          </pattern>
        </defs>
        {/* Césped con franjas */}
        <rect x="-160" y="-230" width="320" height="260" fill="#2f8f3a" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="-160" y={-230 + i * 52} width="320" height="26" fill="#2a8034" />
        ))}
        {/* Área */}
        <path d="M-130 -110 L130 -110 L150 30 L-150 30 Z" fill="none" stroke="#ffffff" strokeOpacity=".7" strokeWidth="2" />
        <circle cx="0" cy="-20" r="2.5" fill="#ffffff" />
        {/* Arco y red */}
        <g>
          <rect x="-110" y="-205" width="220" height="95" fill="#ffffff" fillOpacity=".12" />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={-110 + i * 22} y1="-205" x2={-110 + i * 22} y2="-110" stroke="#ffffff" strokeOpacity=".3" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="-110" y1={-205 + i * 19} x2="110" y2={-205 + i * 19} stroke="#ffffff" strokeOpacity=".3" />
          ))}
          <path d="M-110 -110 L-110 -205 L110 -205 L110 -110" fill="none" stroke="#ffffff" strokeWidth="5" />
        </g>
        {/* Arquero */}
        <g style={{ transform: `translateX(${keeperX}px)`, transition: dur }}>
          <rect x="-12" y="-150" width="24" height="28" rx="5" fill="var(--primary)" />
          <circle cx="0" cy="-158" r="8" fill="#d9a77a" />
          <rect x="-26" y="-148" width="14" height="6" rx="3" fill="var(--primary)" />
          <rect x="12" y="-148" width="14" height="6" rx="3" fill="var(--primary)" />
          <circle cx="-28" cy="-145" r="4" fill="#f2c94c" />
          <circle cx="28" cy="-145" r="4" fill="#f2c94c" />
          <rect x="-10" y="-122" width="7" height="14" fill="#1b1b1b" />
          <rect x="3" y="-122" width="7" height="14" fill="#1b1b1b" />
        </g>
        {/* Pelota */}
        <g
          style={{
            transform: `translate(${ballX}px, ${ballY}px) scale(${kicked ? 0.55 : 1})`,
            transformOrigin: "0px -20px",
            transformBox: "view-box",
            transition: dur,
          }}
        >
          <circle cx="0" cy="-20" r="11" fill="#ffffff" stroke="#1b1b1b" strokeWidth="1.5" />
          <path d="M0 -26 L5 -22 L3 -16 L-3 -16 L-5 -22 Z" fill="#1b1b1b" />
        </g>
        {/* Pateador de espaldas, camiseta a rayas */}
        <g style={{ transform: kicked ? "translateY(-6px)" : "none", transition: dur }}>
          <rect x="-20" y="-2" width="40" height="32" rx="8" fill="url(#stripes)" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx="0" cy="-10" r="10" fill="#4a3426" />
        </g>
      </svg>

      {phase === "goal" && (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-6">
          <span className="animate-bounce rounded-xl bg-accent px-4 py-1 font-display text-3xl font-black text-accent-foreground shadow-lift">
            ¡GOOOL!
          </span>
        </div>
      )}

      {phase === "aim" && (
        <div className="absolute inset-x-0 top-[12%] grid h-[38%] grid-cols-3 gap-1 px-[16%]">
          {(["left", "center", "right"] as Side[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onKick(s)}
              aria-label={s === "left" ? "Patear a la izquierda" : s === "center" ? "Patear al centro" : "Patear a la derecha"}
              className="flex items-center justify-center rounded-lg border-2 border-dashed border-primary-foreground/80 bg-primary-foreground/10 text-xs font-bold uppercase text-primary-foreground hover:bg-primary-foreground/25"
            >
              {s === "left" ? "Izquierda" : s === "center" ? "Centro" : "Derecha"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
