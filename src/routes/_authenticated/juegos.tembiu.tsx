import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameShell, XpNote, shuffle } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/juegos/tembiu")({
  head: () => ({
    meta: [
      { title: "Tembi'u Paraguái | Jaikuaa" },
      { name: "description", content: "Armá los platos típicos del Paraguay eligiendo sus ingredientes." },
      { property: "og:title", content: "Tembi'u Paraguái | Jaikuaa" },
      { property: "og:description", content: "Juego de cocina tradicional paraguaya: chipa guasu, mbeju, vori vori y más." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tembiu,
});

// Contenido cultural en revisión docente (se muestra ValidationNotice). Ingredientes en castellano.
type Dish = { name: string; emoji: string; info: string; ok: string[] };
const DISHES: Dish[] = [
  { name: "Sopa paraguaya", emoji: "🥮", info: "La única sopa sólida del mundo.", ok: ["Harina de maíz", "Queso", "Cebolla", "Leche", "Huevo"] },
  { name: "Chipa guasu", emoji: "🌽", info: "Se hace con choclo fresco.", ok: ["Choclo", "Queso", "Cebolla", "Leche", "Huevo"] },
  { name: "Mbeju", emoji: "🫓", info: "Torta de almidón dorada en la sartén.", ok: ["Almidón de mandioca", "Queso", "Grasa", "Leche", "Sal"] },
  { name: "Vori vori", emoji: "🍲", info: "Caldo con bolitas de maíz y queso.", ok: ["Gallina", "Harina de maíz", "Queso", "Cebolla", "Zanahoria"] },
  { name: "Chipa", emoji: "🥯", info: "Infaltable en Semana Santa.", ok: ["Almidón de mandioca", "Queso", "Huevo", "Grasa", "Anís"] },
  { name: "Pastel mandi'o", emoji: "🥟", info: "Empanada de masa de mandioca.", ok: ["Mandioca", "Carne", "Cebolla", "Huevo", "Harina de maíz"] },
  { name: "Kiveve", emoji: "🎃", info: "Crema dulce y salada de andai (zapallo).", ok: ["Zapallo", "Harina de maíz", "Queso", "Leche", "Azúcar"] },
];
const ALL = Array.from(new Set(DISHES.flatMap((d) => d.ok).concat(["Arroz", "Chocolate", "Fideo", "Pescado", "Tomate", "Banana", "Lechuga"])));
const ROUNDS = 5;

function Tembiu() {
  const [game, setGame] = useState(0);
  return (
    <GameShell title="Tembi'u Paraguái" emoji="🍲" sponsorSlot="tembiu">
      <ValidationNotice />
      <p className="mt-4 text-center text-sm text-muted-foreground">Elegí los 5 ingredientes de cada plato típico. ¡5 platos por partida!</p>
      <div className="mt-6"><Kitchen key={game} onAgain={() => setGame((g) => g + 1)} /></div>
    </GameShell>
  );
}

function Kitchen({ onAgain }: { onAgain: () => void }) {
  const feedback = useGameFeedback();
  const dishes = useMemo(() => shuffle(DISHES).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const dish = dishes[i];
  const options = useMemo(() => {
    if (!dish) return [];
    const wrong = shuffle(ALL.filter((x) => !dish.ok.includes(x))).slice(0, 4);
    return shuffle([...dish.ok, ...wrong]);
  }, [dish]);
  const done = i >= ROUNDS;
  const xp = Math.min(20, score * 4);
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "tembiu", xp });
  }, [done, xp]);

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <div className="text-5xl">👩‍🍳</div>
        <p className="font-display text-xl font-bold text-foreground">¡Cocinaste {score} de {ROUNDS} platos perfectos!</p>
        <XpNote xp={xp} />
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onAgain}>Cocinar de nuevo</Button>
          <ShareResult text={`¡Preparé ${score} de ${ROUNDS} platos típicos en Tembi'u Paraguái de Jaikuaa! ¿Sabés cocinar paraguayo?`} />
        </div>
      </div>
    );
  }

  function toggle(x: string) {
    if (checked) return;
    setPicked((p) => (p.includes(x) ? p.filter((y) => y !== x) : p.length < 5 ? [...p, x] : p));
  }
  function check() {
    const good = picked.every((x) => dish.ok.includes(x));
    setChecked(true);
    if (good) { setScore((s) => s + 1); feedback("success"); } else feedback("error");
  }
  function next() { setI((n) => n + 1); setPicked([]); setChecked(false); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground"><span>Plato {i + 1}/{ROUNDS}</span><span>Aciertos: <b className="text-foreground">{score}</b></span></div>
      <div className="rounded-xl border border-border bg-card p-5 text-center shadow-elegant">
        <div className="text-5xl" aria-hidden>{dish.emoji}</div>
        <h2 className="mt-2 font-display text-2xl font-bold text-foreground">{dish.name}</h2>
        <p className="text-sm text-muted-foreground">{dish.info}</p>
        <p className="mt-2 text-xs font-medium text-primary">Ingredientes en la olla: {picked.length}/5</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((x) => {
          const on = picked.includes(x);
          const right = dish.ok.includes(x);
          const state = checked ? (right ? "border-primary bg-primary/10 text-primary" : on ? "border-destructive bg-destructive/10 text-destructive" : "border-border opacity-60") : on ? "border-accent bg-accent/10 text-accent" : "border-border";
          return (
            <button key={x} type="button" onClick={() => toggle(x)} aria-pressed={on}
              className={`min-h-12 rounded-lg border-2 bg-card px-3 py-2 text-sm font-semibold transition ${state}`}>{x}</button>
          );
        })}
      </div>
      {checked ? (
        <Button size="lg" className="h-12 w-full" onClick={next}>{i + 1 === ROUNDS ? "Ver resultado" : "Siguiente plato →"}</Button>
      ) : (
        <Button size="lg" className="h-12 w-full" disabled={picked.length !== 5} onClick={check}>¡A cocinar!</Button>
      )}
    </div>
  );
}
