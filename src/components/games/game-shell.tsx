import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { listCourseLessons } from "@/lib/lessons.functions";
import { getGameWords, type GameWord } from "@/lib/games.functions";
import { GameKit, GameCompanion, GameSoundButton, LaceBackground } from './game-kit';
import { GameHelp } from './game-help';

export function GameShell({ title, emoji, children }: { title: string; emoji: string; children: ReactNode }) {
  return (
    <GameKit><div className="game-shell relative isolate flex min-h-screen flex-col bg-background">
      {title !== 'Penales' && <LaceBackground/>}
      <header className="relative border-b border-border/50 bg-background/90">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Link to="/juegos" className="text-sm font-medium text-muted-foreground hover:text-primary">
            ← Juegos
          </Link>
        </div>
      </header>
      <main className="relative flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex justify-end gap-2"><GameHelp title={title}/><GameSoundButton/></div>
          <h1 className="text-center font-display text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
            <span aria-hidden>{emoji}</span> {title}
          </h1>
          {title !== 'Penales' && <div className="mx-auto mt-4 max-w-lg"><GameCompanion/></div>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div></GameKit>
  );
}

/** Selector "Todas las palabras" o una lección publicada. */
export function LessonFilter({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const fn = useServerFn(listCourseLessons);
  const q = useQuery({ queryKey: ["course-lessons"], queryFn: () => fn() });
  const lessons = (q.data?.lessons ?? []).filter((l) => l.publishedWords > 0);
  return (
    <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      Palabras:
      <select
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Todas las palabras</option>
        {lessons.map((l) => (
          <option key={l.n} value={l.n}>
            Lección {l.n}: {l.title}
          </option>
        ))}
      </select>
    </label>
  );
}

export function useGameWords(lesson: number | null) {
  const fn = useServerFn(getGameWords);
  return useQuery({
    queryKey: ["game-words", lesson],
    queryFn: () => fn({ data: { lesson } }),
    staleTime: 5 * 60_000,
  });
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickDistinct(words: GameWord[], n: number, filter: (w: GameWord) => boolean = () => true) {
  const seen = new Set<string>();
  const out: GameWord[] = [];
  for (const w of shuffle(words.filter(filter))) {
    const k = w.gn.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(w);
    if (out.length === n) break;
  }
  return out;
}

export function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const h = () => setWide(m.matches);
    h();
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return wide;
}

export function NotEnough({ min }: { min: number }) {
  return (
    <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
      No hay suficientes palabras publicadas para este juego (se necesitan {min}). Probá con "Todas las
      palabras".
    </p>
  );
}

export function XpNote({ xp }: { xp: number }) {
  return <p className="text-center text-sm font-semibold text-accent">+{xp} XP</p>;
}
