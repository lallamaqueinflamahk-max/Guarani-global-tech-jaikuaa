import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { GameShell, LessonFilter, NotEnough, XpNote, shuffle, useGameWords, useIsWide } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ACHEGETY, displayLetter, splitAchegety } from "@/lib/achegety";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/juegos/sopa-de-letras")({
  head: () => ({
    meta: [
      { title: "Sopa de letras | Jaikuaa" },
      { name: "description", content: "Encontrá las palabras guaraníes escondidas en la grilla." },
      { property: "og:title", content: "Sopa de letras | Jaikuaa" },
      { property: "og:description", content: "Sopa de letras con el alfabeto guaraní y audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WordSearch,
});

const COUNT = 6;
const XP = 20;
// Relleno solo con letras simples (sin el puso) para que la grilla se lea mejor.
const FILLER = ACHEGETY.filter((t) => t !== "'");

type Placed = { word: GameWord; cells: number[] };
type Puzzle = { size: number; grid: string[]; placed: Placed[] };

function build(pool: { word: GameWord; tokens: string[] }[], size: number): Puzzle | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const grid: (string | null)[] = Array(size * size).fill(null);
    const placed: Placed[] = [];
    const used = new Set<string>();
    for (const item of shuffle(pool)) {
      if (placed.length === COUNT) break;
      const key = item.word.gn.trim().toLowerCase();
      if (used.has(key) || item.tokens.length > size || item.tokens.length < 2) continue;
      let ok = false;
      for (let tries = 0; tries < 60 && !ok; tries++) {
        const horiz = Math.random() < 0.5;
        const r = Math.floor(Math.random() * (horiz ? size : size - item.tokens.length + 1));
        const c = Math.floor(Math.random() * (horiz ? size - item.tokens.length + 1 : size));
        const cells = item.tokens.map((_, i) => (horiz ? r * size + c + i : (r + i) * size + c));
        if (cells.every((cell, i) => grid[cell] === null || grid[cell] === item.tokens[i])) {
          cells.forEach((cell, i) => (grid[cell] = item.tokens[i]!));
          placed.push({ word: item.word, cells });
          used.add(key);
          ok = true;
        }
      }
    }
    if (placed.length === COUNT) {
      return {
        size,
        grid: grid.map((g) => g ?? FILLER[Math.floor(Math.random() * FILLER.length)]!),
        placed,
      };
    }
  }
  return null;
}

function WordSearch() {
  const [lesson, setLesson] = useState<number | null>(null);
  const q = useGameWords(lesson);
  const wide = useIsWide();
  const size = wide ? 10 : 8;
  const [round, setRound] = useState(0);
  const puzzle = useMemo(() => {
    const pool = (q.data?.words ?? [])
      .filter((w) => !/\s/.test(w.gn.trim()))
      .map((w) => ({ word: w, tokens: splitAchegety(w.gn.trim()) }))
      .filter((x): x is { word: GameWord; tokens: string[] } => !!x.tokens);
    return build(pool, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, size, round]);

  return (
    <GameShell title="Sopa de letras" emoji="🔤" sponsorSlot="sopa-de-letras">
      <LessonFilter value={lesson} onChange={setLesson} />
      <div className="mt-6">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !puzzle ? (
          <NotEnough min={COUNT} />
        ) : (
          <Board key={`${round}-${size}`} puzzle={puzzle} onNext={() => setRound((r) => r + 1)} />
        )}
      </div>
    </GameShell>
  );
}

function Board({ puzzle, onNext }: { puzzle: Puzzle; onNext: () => void }) {
  const feedback = useGameFeedback();
  const { size, grid, placed } = puzzle;
  const [start, setStart] = useState<number | null>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [miss, setMiss] = useState<number[]>([]);
  const done = found.size === placed.length;
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    recordCompletion({ source: "game", sourceRef: "sopa-de-letras", xp: XP });
  }, [done]);

  const foundCells = new Set(placed.flatMap((p, i) => (found.has(i) ? p.cells : [])));

  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);

  function lineOf(a: number, b: number): number[] {
    const [r1, c1, r2, c2] = [Math.floor(a / size), a % size, Math.floor(b / size), b % size];
    const line: number[] = [];
    if (r1 === r2) for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) line.push(r1 * size + c);
    else if (c1 === c2) for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) line.push(r * size + c1);
    return line;
  }

  function check(from: number, cell: number) {
    const line = lineOf(from, cell);
    setStart(null);
    const idx = placed.findIndex(
      (p, i) => !found.has(i) && p.cells.length === line.length && p.cells.every((x, j) => x === line[j]),
    );
    if (idx >= 0) {
      feedback("success");
      setFound((f) => new Set(f).add(idx));
      if (placed[idx]!.word.hasAudio) void playGuarani(placed[idx]!.word.gn);
    } else {
      feedback("error");
      setMiss(line.length ? line : [from, cell]);
      window.setTimeout(() => setMiss([]), 600);
    }
  }

  function cellAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest("[data-cell]");
    return el ? Number(el.getAttribute("data-cell")) : null;
  }

  function down(e: PointerEvent, cell: number) {
    if (done) return;
    e.preventDefault();
    if (start !== null && start !== cell) { check(start, cell); return; }
    setDrag({ from: cell, to: cell });
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    const c = cellAt(e.clientX, e.clientY);
    if (c !== null && c !== drag.to) setDrag({ ...drag, to: c });
  }
  function up() {
    if (!drag) return;
    const { from, to } = drag;
    setDrag(null);
    if (from !== to) check(from, to);
    else setStart((s) => (s === from ? null : from));
  }

  const trail = new Set(drag ? lineOf(drag.from, drag.to) : []);

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">
        Deslizá el dedo sobre cada palabra, o tocá su primera y última letra (horizontal o vertical).
      </p>
      <div
        className="sopa-grid mx-auto grid max-w-md touch-none select-none gap-1 lg:max-w-xl"
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        onPointerLeave={up}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((t, i) => (
          <Button variant="ghost"
            key={i}
            type="button"
            data-cell={i}
            onPointerDown={(e) => { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); down(e, i); }}
            className={`flex h-auto aspect-square p-0 items-center justify-center rounded-md border text-sm font-bold transition-colors sm:text-base ${
              trail.has(i)
                ? "sopa-trail"
                : foundCells.has(i)
                ? "sopa-found border-primary text-primary-foreground"
                : start === i
                  ? "border-accent bg-accent text-accent-foreground"
                  : miss.includes(i)
                    ? "border-accent bg-accent/20 text-foreground"
                    : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            {displayLetter(t)}
          </Button>
        ))}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {placed.map((p, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
              found.has(i) ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}
          >
            {found.has(i) ? <Check className="h-4 w-4 text-primary" /> : <span className="h-4 w-4" />}
            <span className="text-muted-foreground">{p.word.es}</span>
            {found.has(i) && (
              <>
                <span className="ml-auto font-semibold text-primary">{p.word.gn}</span>
                {p.word.hasAudio && <SpeakerButton gn={p.word.gn} />}
              </>
            )}
          </li>
        ))}
      </ul>

      {done && (
        <div className="space-y-2 text-center">
          <p className="font-display text-xl font-bold text-foreground">¡Encontraste todas!</p>
          <XpNote xp={XP} />
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onNext}>Otra sopa</Button>
            <ShareResult text="¡Encontré todas las palabras en guaraní de la Sopa de letras de Jaikuaa! ¿Te animás?" />
          </div>
        </div>
      )}
    </div>
  );
}
