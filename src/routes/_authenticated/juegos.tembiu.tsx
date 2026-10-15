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

// Términos en guaraní PENDIENTES de validación docente (se muestra ValidationNotice).
const ING: Record<string, { gn: string; es: string; emoji: string }> = {
  avatiKui: { gn: "Avati ku'i", es: "Harina de maíz", emoji: "🌾" },
  avatiKy: { gn: "Avati ky", es: "Choclo", emoji: "🌽" },
  kesu: { gn: "Kesu", es: "Queso", emoji: "🧀" },
  sevoi: { gn: "Sevói", es: "Cebolla", emoji: "🧅" },
  kamby: { gn: "Kamby", es: "Leche", emoji: "🥛" },
  rupia: { gn: "Ryguasu rupi'a", es: "Huevo", emoji: "🥚" },
  aramiro: { gn: "Aramirõ", es: "Almidón", emoji: "🥣" },
  nandy: { gn: "Ñandy", es: "Grasa", emoji: "🫙" },
  juky: { gn: "Juky", es: "Sal", emoji: "🧂" },
  ryguasu: { gn: "Ryguasu ro'o", es: "Gallina", emoji: "🐔" },
  mandio: { gn: "Mandi'o", es: "Mandioca", emoji: "🍠" },
  soo: { gn: "So'o", es: "Carne", emoji: "🥩" },
  andai: { gn: "Andai", es: "Zapallo", emoji: "🎃" },
  asuka: { gn: "Asuka", es: "Azúcar", emoji: "🍬" },
  pira: { gn: "Pira", es: "Pescado", emoji: "🐟" },
  kumanda: { gn: "Kumanda", es: "Poroto", emoji: "🫘" },
  pakova: { gn: "Pakova", es: "Banana", emoji: "🍌" },
  eira: { gn: "Eíra", es: "Miel", emoji: "🍯" },
  y: { gn: "Y", es: "Agua", emoji: "💧" },
  narã: { gn: "Narã", es: "Naranja", emoji: "🍊" },
};
type Dish = { name: string; emoji: string; info: string; ok: string[] };
const DISHES: Dish[] = [
  { name: "Sopa paraguaya", emoji: "🥮", info: "La única sopa sólida del mundo.", ok: ["avatiKui", "kesu", "sevoi", "kamby", "rupia"] },
  { name: "Chipa guasu", emoji: "🌽", info: "Se hace con avati ky (choclo fresco).", ok: ["avatiKy", "kesu", "sevoi", "kamby", "rupia"] },
  { name: "Mbeju", emoji: "🫓", info: "Torta de aramirõ dorada en la sartén.", ok: ["aramiro", "kesu", "nandy", "kamby", "juky"] },
  { name: "Vori vori", emoji: "🍲", info: "Caldo con bolitas de avati ku'i y kesu.", ok: ["ryguasu", "avatiKui", "kesu", "sevoi", "juky"] },
  { name: "Chipa", emoji: "🥯", info: "Infaltable en Semana Santa.", ok: ["aramiro", "kesu", "rupia", "nandy", "kamby"] },
  { name: "Pastel mandi'o", emoji: "🥟", info: "Empanada de masa de mandi'o.", ok: ["mandio", "soo", "sevoi", "rupia", "avatiKui"] },
  { name: "Kiveve", emoji: "🎃", info: "Crema dulce y salada de andai.", ok: ["andai", "avatiKui", "kesu", "kamby", "asuka"] },
];
const ALL = Object.keys(ING);
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
        <div className="relative mx-auto mt-4 flex h-24 w-40 items-end justify-center rounded-b-[3rem] rounded-t-lg border-4 border-foreground/70 bg-muted">
          {!checked && picked.length > 0 && <span className="absolute -top-6 animate-pulse text-xl" aria-hidden>♨️</span>}
          <div className="flex flex-wrap justify-center gap-0.5 pb-3 text-2xl">
            {picked.map((k) => <span key={k} className="animate-in zoom-in slide-in-from-top-4 duration-300">{ING[k].emoji}</span>)}
          </div>
        </div>
        <p className="mt-2 text-xs font-medium text-primary">Mba'e oĩ ollápe: {picked.length}/5</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((x) => {
          const on = picked.includes(x);
          const right = dish.ok.includes(x);
          const state = checked ? (right ? "border-primary bg-primary/10 text-primary" : on ? "border-destructive bg-destructive/10 text-destructive" : "border-border opacity-60") : on ? "border-accent bg-accent/10 text-accent scale-95" : "border-border";
          return (
            <button key={x} type="button" onClick={() => toggle(x)} aria-pressed={on}
              className={`flex min-h-16 items-center gap-2 rounded-lg border-2 bg-card px-3 py-2 text-left transition active:scale-95 ${state}`}>
              <span className="text-2xl" aria-hidden>{ING[x].emoji}</span>
              <span className="leading-tight"><b className="block text-base">{ING[x].gn}</b><span className="text-xs opacity-70">{ING[x].es}</span></span>
            </button>
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
