import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameShell, XpNote, shuffle } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/juegos/tekojoja")({
  head: () => ({
    meta: [
      { title: "Tekojoja · Juzgado de Paz | Jaikuaa" },
      { name: "description", content: "Resolvé casos de un Juzgado de Paz y aprendé el vocabulario jurídico, con contenido para validar por especialistas." },
      { property: "og:title", content: "Tekojoja · Juzgado de Paz | Jaikuaa" },
      { property: "og:description", content: "Juego de casos jurídicos cotidianos para aprender términos legales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tekojoja,
});

// Casos redactados en castellano como borrador. Los términos en guaraní NO se inventan:
// quedan vacíos hasta que la Facultad de Derecho (UNA) / ISL los carguen y validen en el corpus.
type Case = { emoji: string; story: string; answer: string; wrong: string[]; why: string };
const CASES: Case[] = [
  { emoji: "🐄", story: "Las vacas de Don Ramón entran cada semana a la chacra de su vecina y le comen el maíz.", answer: "Daños y perjuicios", wrong: ["Divorcio", "Herencia"], why: "Quien es dueño de los animales responde por el daño que causan." },
  { emoji: "🧱", story: "Dos vecinos discuten porque uno corrió el alambrado dos metros dentro del terreno del otro.", answer: "Conflicto de linderos", wrong: ["Contrato de alquiler", "Pensión alimentaria"], why: "Los límites se prueban con título, plano y mensura." },
  { emoji: "👶", story: "Una madre pide que el padre de su hijo aporte dinero cada mes para su crianza.", answer: "Asistencia alimentaria", wrong: ["Desalojo", "Usucapión"], why: "Los padres deben asistir a sus hijos según sus posibilidades." },
  { emoji: "🏠", story: "El inquilino no paga hace seis meses y el dueño quiere recuperar su casa.", answer: "Desalojo", wrong: ["Adopción", "Linderos"], why: "Se tramita ante el juez; nadie puede sacar a otro por la fuerza." },
  { emoji: "🤝", story: "Dos vecinas peleadas se sientan con el juez de paz y firman un acuerdo para convivir en paz.", answer: "Conciliación", wrong: ["Condena", "Embargo"], why: "La conciliación evita un juicio largo." },
  { emoji: "📜", story: "Un abuelo falleció y sus hijos deben repartir la casa y el terreno.", answer: "Sucesión", wrong: ["Desalojo", "Amparo"], why: "La sucesión define quiénes heredan y qué le toca a cada uno." },
  { emoji: "🗣️", story: "Una persona que solo habla guaraní debe declarar ante un tribunal.", answer: "Derecho a intérprete", wrong: ["Embargo", "Fianza"], why: "Nadie puede ser juzgado en un idioma que no entiende." },
  { emoji: "💰", story: "Juan prestó dinero con un pagaré firmado y el deudor no le devuelve.", answer: "Cobro de guaraníes", wrong: ["Adopción", "Linderos"], why: "El pagaré firmado sirve como prueba de la deuda." },
];
const ROUNDS = 5;

function Tekojoja() {
  const [game, setGame] = useState(0);
  return (
    <GameShell title="Tekojoja · Juzgado de Paz" emoji="⚖️" sponsorSlot="tekojoja">
      <ValidationNotice />
      <p className="mt-4 text-center text-sm text-muted-foreground">Sos juez o jueza de paz. Leé el caso y elegí de qué se trata. 5 casos por partida.</p>
      <div className="mt-6"><Court key={game} onAgain={() => setGame((g) => g + 1)} /></div>
    </GameShell>
  );
}

function Court({ onAgain }: { onAgain: () => void }) {
  const feedback = useGameFeedback();
  const cases = useMemo(() => shuffle(CASES).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const c = cases[i];
  const options = useMemo(() => (c ? shuffle([c.answer, ...c.wrong]) : []), [c]);
  const done = i >= ROUNDS;
  const xp = Math.min(20, score * 4);
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "tekojoja", xp });
  }, [done, xp]);

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <div className="text-5xl">⚖️</div>
        <p className="font-display text-xl font-bold text-foreground">Resolviste bien {score} de {ROUNDS} casos</p>
        <XpNote xp={xp} />
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onAgain}>Nuevos casos</Button>
          <ShareResult text={`¡Resolví ${score} de ${ROUNDS} casos en el Juzgado de Paz de Jaikuaa! ¿Te animás?`} />
        </div>
      </div>
    );
  }

  function choose(o: string) {
    if (pick) return;
    setPick(o);
    if (o === c.answer) { setScore((s) => s + 1); feedback("success"); } else feedback("error");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground"><span>Caso {i + 1}/{ROUNDS}</span><span>Aciertos: <b className="text-foreground">{score}</b></span></div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-elegant">
        <div className="text-center text-5xl" aria-hidden>{c.emoji}</div>
        <p className="mt-3 text-center text-lg text-foreground">{c.story}</p>
      </div>
      <div className="grid gap-2">
        {options.map((o) => {
          const state = pick ? (o === c.answer ? "border-primary bg-primary/10 text-primary" : o === pick ? "border-destructive bg-destructive/10 text-destructive" : "border-border opacity-60") : "border-border";
          return (
            <button key={o} type="button" onClick={() => choose(o)} className={`min-h-14 rounded-lg border-2 bg-card px-4 py-3 text-left text-base font-semibold transition active:scale-95 ${state}`}>{o}</button>
          );
        })}
      </div>
      {pick && (
        <div className="space-y-3">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="text-foreground">{c.why}</p>
            <p className="mt-2 text-xs text-muted-foreground">Término en guaraní: pendiente de carga y validación por especialistas en derecho.</p>
          </div>
          <Button size="lg" className="h-12 w-full" onClick={() => { setI((n) => n + 1); setPick(null); }}>{i + 1 === ROUNDS ? "Ver resultado" : "Siguiente caso →"}</Button>
        </div>
      )}
    </div>
  );
}
