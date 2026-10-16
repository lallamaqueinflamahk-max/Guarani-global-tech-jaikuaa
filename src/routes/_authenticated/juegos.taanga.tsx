import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameShell, XpNote, shuffle } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/juegos/taanga")({
  head: () => ({
    meta: [
      { title: "Ta'anga · Claqueta de Jai | Jaikuaa" },
      { name: "description", content: "Sé guionista por un día: completá los diálogos de cada escena en guaraní." },
      { property: "og:title", content: "Ta'anga · Claqueta de Jai | Jaikuaa" },
      { property: "og:description", content: "Juego de cine en guaraní: Jai dirige, vos escribís el diálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Taanga,
});

// Frases básicas PENDIENTES de validación docente (se muestra ValidationNotice).
type Scene = { place: string; who: string; es: string; before: string; after: string; ok: string; wrong: string[] };
const SCENES: Scene[] = [
  { place: "Mercado 4 · Día", who: "Doña Rosa", es: "Saluda a su clienta de siempre.", before: "¡", after: ", che amiga!", ok: "Mba'éichapa", wrong: ["Jajotopata", "Ndaipóri", "Aguyje"] },
  { place: "Parada de colectivo · Noche", who: "Juan", es: "Agradece al chofer que lo esperó.", before: "¡", after: " ndéve, che ra'a!", ok: "Aguyje", wrong: ["Mba'éichapa", "Jaha", "Ajepa"] },
  { place: "Chacra · Amanecer", who: "Abuelo", es: "Llama a su nieto para tomar tereré.", before: "Ejúna, ", after: ", ja'u tereré.", ok: "che memby", wrong: ["kesu", "y", "pira"] },
  { place: "Cancha del barrio · Tarde", who: "Hinchada", es: "Invita al equipo a irse juntos.", before: "¡", after: ", ñande róga gotyo!", ok: "Jaha", wrong: ["Aguyje", "Mba'e", "Kesu"] },
  { place: "Cocina · Mediodía", who: "Mamá", es: "Pregunta si quieren chipa.", before: "¿Pereipota ", after: "?", ok: "chipa", wrong: ["y", "kuarahy", "jagua"] },
  { place: "Despedida · Puerto", who: "Ana", es: "Se despide hasta el próximo encuentro.", before: "¡", after: " ambuéve!", ok: "Jajotopata", wrong: ["Mba'éichapa", "Aguyje", "Jaha"] },
  { place: "Escuela · Mañana", who: "Profe", es: "Responde que está bien.", before: "Iporã, ", after: ".", ok: "aguyje", wrong: ["kesu", "pira", "jaha"] },
];
const ROUNDS = 5;

function Taanga() {
  const [game, setGame] = useState(0);
  return (
    <GameShell title="Ta'anga · Claqueta" emoji="🎬" sponsorSlot="taanga">
      <ValidationNotice />
      <p className="mt-4 text-center text-sm text-muted-foreground">Jai dirige. Vos completás el diálogo. ¡5 escenas por rodaje!</p>
      <div className="mt-6"><Set key={game} onAgain={() => setGame((g) => g + 1)} /></div>
    </GameShell>
  );
}

function Set({ onAgain }: { onAgain: () => void }) {
  const feedback = useGameFeedback();
  const scenes = useMemo(() => shuffle(SCENES).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const scene = scenes[i];
  const options = useMemo(() => (scene ? shuffle([scene.ok, ...scene.wrong]) : []), [scene]);
  const done = i >= ROUNDS;
  const xp = Math.min(20, score * 4);
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "taanga", xp });
  }, [done, xp]);

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <div className="text-5xl">🏆</div>
        <p className="font-display text-xl font-bold text-foreground">¡Rodaste {score} de {ROUNDS} escenas perfectas!</p>
        <XpNote xp={xp} />
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onAgain}>Nuevo rodaje</Button>
          <ShareResult text={`¡Fui guionista en Ta'anga de Jaikuaa y rodé ${score} de ${ROUNDS} escenas en guaraní! 🎬`} />
        </div>
      </div>
    );
  }

  const right = pick === scene.ok;
  function choose(o: string) {
    if (pick) return;
    setPick(o);
    if (o === scene.ok) { setScore((s) => s + 1); feedback("success"); } else feedback("error");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground"><span>Escena {i + 1}/{ROUNDS}</span><span>Tomas buenas: <b className="text-foreground">{score}</b></span></div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-elegant">
        <div className="flex items-center justify-between bg-foreground px-4 py-2 font-mono text-xs uppercase tracking-wider text-background">
          <span>🎬 {scene.place}</span><span>Toma {i + 1}</span>
        </div>
        <div className="p-5 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{scene.who}</p>
          <p className="mt-1 text-xs italic text-muted-foreground">({scene.es})</p>
          <p className="mt-3 font-display text-2xl font-bold text-foreground">
            {scene.before}
            <span className={`mx-1 inline-block min-w-20 border-b-2 px-1 ${pick ? (right ? "border-primary text-primary" : "border-destructive text-destructive") : "border-accent"}`}>{pick ?? "____"}</span>
            {scene.after}
          </p>
          {pick && <p className="mt-3 text-sm font-semibold">{right ? "🎥 ¡Corte! ¡Quedó perfecta!" : `💡 ¡Se nos fue la luz! Era «${scene.ok}». Repetimos.`}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => choose(o)} disabled={!!pick}
            className={`min-h-14 rounded-lg border-2 bg-card px-3 py-2 font-semibold transition active:scale-95 ${pick ? (o === scene.ok ? "border-primary bg-primary/10 text-primary" : o === pick ? "border-destructive bg-destructive/10 text-destructive" : "border-border opacity-60") : "border-border hover:border-accent"}`}>
            {o}
          </button>
        ))}
      </div>
      {pick && <Button size="lg" className="h-12 w-full" onClick={() => { setI((n) => n + 1); setPick(null); }}>{i + 1 === ROUNDS ? "Ver resultado" : "Siguiente escena →"}</Button>}
    </div>
  );
}
