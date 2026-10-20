import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { GameShell, LessonFilter, NotEnough, XpNote, pickDistinct, useGameWords } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ACHEGETY, displayLetter, splitAchegety } from "@/lib/achegety";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/juegos/ahorcado")({
  head: () => ({
    meta: [
      { title: "Ahorcado con chipas | Jaikuaa" },
      { name: "description", content: "Adiviná la palabra guaraní letra por letra antes de quedarte sin chipas." },
      { property: "og:title", content: "Ahorcado con chipas | Jaikuaa" },
      { property: "og:description", content: "Juego de palabras guaraníes con el alfabeto Achegety." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hangman,
});

const LIVES = 6;
const XP_WIN = 15;
const XP_LOSS = 5;

function Hangman() {
  const [lesson, setLesson] = useState<number | null>(null);
  const q = useGameWords(lesson);
  const pool = useMemo(
    () => (q.data?.words ?? []).filter((w) => !/\s/.test(w.gn.trim()) && splitAchegety(w.gn.trim())),
    [q.data],
  );
  const [round, setRound] = useState(0);
  const word = useMemo<GameWord | null>(() => pickDistinct(pool, 1)[0] ?? null, [pool, round]);

  return (
    <GameShell title="Ahorcado con chipas" emoji="🥯" sponsorSlot="ahorcado">
      <LessonFilter value={lesson} onChange={setLesson} />
      <div className="mt-6">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !word ? (
          <NotEnough min={1} />
        ) : (
          <Board key={`${word.gn}-${round}`} word={word} onNext={() => setRound((r) => r + 1)} />
        )}
      </div>
    </GameShell>
  );
}

function Board({ word, onNext }: { word: GameWord; onNext: () => void }) {
  const feedback = useGameFeedback();
  const tokens = useMemo(() => splitAchegety(word.gn.trim()) ?? [], [word]);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const wrong = [...guessed].filter((g) => !tokens.includes(g)).length;
  const won = tokens.every((t) => guessed.has(t));
  const lost = wrong >= LIVES;
  const done = won || lost;
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback(won ? "victory" : "error");
    recordCompletion({ source: "game", sourceRef: "ahorcado", xp: won ? XP_WIN : XP_LOSS });
    if (word.hasAudio) void playGuarani(word.gn);
  }, [done, won, word]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pista en español</div>
        <div className="mt-1 font-display text-xl font-bold text-foreground">{word.es}</div>
      </div>

      <div className="flex justify-center gap-1.5" aria-label={`Chipas restantes: ${LIVES - wrong}`}>
        {Array.from({ length: LIVES }, (_, i) => (
          <Chipa key={i} eaten={i >= LIVES - wrong} />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {tokens.map((t, i) => (
          <span
            key={i}
            className={`flex h-11 min-w-9 items-center justify-center rounded-lg border-b-4 px-1 font-display text-xl font-bold ${
              guessed.has(t) ? "border-primary text-primary" : lost ? "border-accent text-accent" : "border-border text-transparent"
            }`}
          >
            {guessed.has(t) || lost ? displayLetter(t) : "·"}
          </span>
        ))}
      </div>

      {done ? (
        <div className="space-y-3 text-center">
          <p className="font-display text-xl font-bold text-foreground">
            {won ? "¡Muy bien!" : "Se acabaron las chipas"}
          </p>
          <div className="flex items-center justify-center gap-2 text-lg">
            <span className="font-semibold text-primary">{word.gn}</span>
            {word.hasAudio && <SpeakerButton gn={word.gn} size="md" />}
            <span className="text-muted-foreground">— {word.es}</span>
          </div>
          <XpNote xp={won ? XP_WIN : XP_LOSS} />
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onNext}>Otra palabra</Button>
            {won && <ShareResult text="¡Adiviné una palabra en guaraní en el Ahorcado con chipas de Jaikuaa! ¿Te animás?" />}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
          {ACHEGETY.map((k) => {
            const used = guessed.has(k);
            const hit = used && tokens.includes(k);
            return (
              <Button variant="ghost"
                key={k}
                type="button"
                disabled={used}
                onClick={() => { feedback(tokens.includes(k) ? "success" : "error"); setGuessed((s) => new Set(s).add(k)); }}
                className={`h-11 rounded-lg border font-display text-base font-bold transition ${
                  !used
                    ? "border-primary/30 bg-card text-foreground hover:border-primary hover:bg-primary/5"
                    : hit
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground opacity-50"
                }`}
              >
                {displayLetter(k)}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chipa({ eaten }: { eaten: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="chipa h-11 w-11" data-eaten={eaten} aria-hidden>
      <defs>
        <radialGradient id="chipa-g" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="var(--stadium-shell-light)" />
          <stop offset="70%" stopColor="var(--stadium-shell)" />
          <stop offset="100%" stopColor="var(--stadium-shell-dark)" />
        </radialGradient>
      </defs>
      <path
        d={eaten ? "M24 6a18 18 0 1 0 18 18c-4 1-7-2-6-6-4 1-7-2-6-6-4 0-6-3-6-6z" : "M24 6a18 18 0 1 0 0.01 0z"}
        fill="url(#chipa-g)"
        fillRule="evenodd"
      />
      <circle cx="24" cy="24" r="6.5" fill="var(--background)" />
      {[[15, 15], [32, 13], [36, 30], [14, 33], [26, 38]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="var(--stadium-shell-dark)" opacity=".6" />
      ))}
    </svg>
  );
}
