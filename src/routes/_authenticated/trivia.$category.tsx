import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import {
  TRIVIA,
  TRIVIA_ORDER,
  QUESTION_SECONDS,
  XP_PER_CORRECT,
  XP_STREAK_BONUS,
  type TriviaCategoryId,
} from "@/lib/trivia";
import { recordCompletion } from "@/lib/gamification";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trivia/$category")({
  head: () => ({ meta: [{ title: "Jaikuaápa — Trivia | Jaikuaa" }] }),
  loader: ({ params }) => {
    if (!TRIVIA_ORDER.includes(params.category as TriviaCategoryId)) throw notFound();
    return { category: params.category as TriviaCategoryId };
  },
  component: TriviaQuiz,
});

type Phase = "playing" | "done";

function TriviaQuiz() {
  const { category } = Route.useLoaderData();
  const cat = TRIVIA[category];
  const navigate = useNavigate();

  const [runKey, setRunKey] = useState(0);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [selected, setSelected] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showStreakBadge, setShowStreakBadge] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const total = cat.questions.length;
  const question = cat.questions[idx];
  const answered = selected !== null || timedOut;

  // Timer
  useEffect(() => {
    if (phase !== "playing" || answered) return;
    setTimeLeft(QUESTION_SECONDS);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, QUESTION_SECONDS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 100);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase, runKey]);

  function handleTimeout() {
    setTimedOut(true);
    setStreak(0);
  }

  function handleSelect(i: number) {
    if (answered) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setSelected(i);
    if (i === question.answer) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
      let gained = XP_PER_CORRECT;
      if (newStreak >= 3) {
        gained += XP_STREAK_BONUS;
        setShowStreakBadge(newStreak);
        window.setTimeout(() => setShowStreakBadge(null), 1400);
      }
      setXpEarned((x) => x + gained);
    } else {
      setStreak(0);
    }
  }

  function handleNext() {
    if (idx + 1 >= total) {
      setPhase("done");
      // Award XP through existing gamification system
      recordCompletion({ xp: xpEarned });
      if (correctCount === total) celebrate("big");
      else if (correctCount >= 3) celebrate("small");
      return;
    }
    setIdx((n) => n + 1);
    setSelected(null);
    setTimedOut(false);
  }

  function reset() {
    setRunKey((k) => k + 1);
    setIdx(0);
    setPhase("playing");
    setSelected(null);
    setTimedOut(false);
    setTimeLeft(QUESTION_SECONDS);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setXpEarned(0);
  }

  const pct = ((idx + (answered ? 1 : 0)) / total) * 100;
  const timePct = (timeLeft / QUESTION_SECONDS) * 100;
  const timerColor =
    timePct > 60 ? "bg-primary" : timePct > 30 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Link to="/trivia" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Salir
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          {phase === "playing" ? (
            <>
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg" aria-hidden>{cat.emoji}</span>
                  <span className="font-semibold text-foreground">{cat.title}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Pregunta {idx + 1} de {total}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Timer bar */}
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn("h-full rounded-full transition-colors duration-300", timerColor)}
                  style={{ width: `${timePct}%`, transitionProperty: "width, background-color" }}
                />
              </div>

              {/* Streak badge floating */}
              {showStreakBadge && (
                <div className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 animate-fade-in">
                  <div className="rounded-full bg-accent px-4 py-2 font-display text-lg font-bold text-accent-foreground shadow-lg">
                    ¡Racha x{showStreakBadge}! 🔥
                  </div>
                </div>
              )}

              {/* Question card */}
              <div key={idx} className="rounded-2xl border border-border/60 bg-card p-5 shadow-elegant animate-fade-in sm:p-7">
                <h2 className="font-display text-xl font-bold leading-snug text-foreground sm:text-2xl">
                  {question.q}
                </h2>

                <div className="mt-5 grid gap-2.5">
                  {question.options.map((opt, i) => {
                    const isCorrect = i === question.answer;
                    const isPicked = selected === i;
                    let cls =
                      "w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-left text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 sm:text-base";
                    if (answered) {
                      if (isCorrect) {
                        cls =
                          "w-full rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-left text-sm font-medium text-emerald-900 sm:text-base";
                      } else if (isPicked) {
                        cls =
                          "w-full rounded-xl border-2 border-destructive bg-destructive/10 px-4 py-3 text-left text-sm font-medium text-destructive sm:text-base";
                      } else {
                        cls =
                          "w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-left text-sm font-medium text-muted-foreground opacity-70 sm:text-base";
                      }
                    }
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelect(i)}
                        disabled={answered}
                        className={cn(cls, "disabled:cursor-default")}
                      >
                        <span className="mr-2 font-bold text-primary/70">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                        {answered && isCorrect && <span className="ml-2">✓</span>}
                        {answered && isPicked && !isCorrect && <span className="ml-2">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className="mt-5 animate-fade-in">
                    <div
                      className={cn(
                        "rounded-xl px-4 py-3 text-sm",
                        selected === question.answer
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {timedOut && selected === null ? (
                        <>⏱️ Se acabó el tiempo. </>
                      ) : selected === question.answer ? (
                        <>✅ ¡Correcto! </>
                      ) : (
                        <>❌ Incorrecto. </>
                      )}
                      {question.explanation}
                    </div>
                    <Button onClick={handleNext} className="mt-4 w-full" size="lg">
                      {idx + 1 >= total ? "Ver resultado" : "Siguiente →"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Live streak */}
              {streak >= 2 && !answered && (
                <div className="mt-3 text-center text-xs font-semibold text-accent">
                  🔥 Racha actual: {streak}
                </div>
              )}
            </>
          ) : (
            <ResultsScreen
              category={cat.title}
              correct={correctCount}
              total={total}
              xp={xpEarned}
              bestStreak={bestStreak}
              onReplay={reset}
              onChoose={() => navigate({ to: "/trivia" })}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ResultsScreen({
  category,
  correct,
  total,
  xp,
  bestStreak,
  onReplay,
  onChoose,
}: {
  category: string;
  correct: number;
  total: number;
  xp: number;
  bestStreak: number;
  onReplay: () => void;
  onChoose: () => void;
}) {
  const verdict = useMemo(() => {
    if (correct === total) return "¡Iporãite!";
    if (correct >= 3) return "¡Iporã!";
    return "¡Seguí practicando!";
  }, [correct, total]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant animate-fade-in">
      <div className="text-5xl" aria-hidden>🏆</div>
      <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
        {correct} de {total} {verdict}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{category}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">XP ganado</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">+{xp}</div>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Mejor racha</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">
            {bestStreak} 🔥
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onReplay} className="flex-1" size="lg">
          Jugar de nuevo
        </Button>
        <Button onClick={onChoose} variant="outline" className="flex-1" size="lg">
          Elegir otra categoría
        </Button>
      </div>
    </div>
  );
}
