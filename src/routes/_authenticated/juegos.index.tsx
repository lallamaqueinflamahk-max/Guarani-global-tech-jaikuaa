import { createFileRoute, Link } from "@tanstack/react-router";
import { GameShell } from "@/components/games/game-shell";
import { useRecordVisit } from "@/lib/gamification";
import { CircleDashed, Grid2X2, Layers, CalendarDays, Goal, Swords, Brain, Wifi } from 'lucide-react';

export const Route = createFileRoute("/_authenticated/juegos/")({
  head: () => ({
    meta: [
      { title: "Juegos | Jaikuaa" },
      { name: "description", content: "Jugá con las palabras guaraníes validadas: duelo, penales, ahorcado, sopa de letras, memoria y palabra del día." },
      { property: "og:title", content: "Juegos | Jaikuaa" },
      { property: "og:description", content: "Juegos de palabras en guaraní con audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesHome,
});

const GAMES = [
  { to: "/juegos/nee-rape", tone: "search", icon: Wifi, title: "Ñe'ẽ Rape · A distancia", desc: "Desafiá por WhatsApp: cada uno desde su celular. 4 senderos. Nuevo · Multijugador a distancia", xp: "hasta 20 XP" },
  { to: "/juegos/duelo", tone: "football", icon: Swords, title: "Duelo Cara a Cara", desc: "2 jugadores, 1 celular. El más rápido en traducir gana. Nuevo · Multijugador", xp: "hasta 20 XP" },
  { to: "/juegos/trivia-duelo", tone: "daily", icon: Brain, title: "Duelo de Trivia", desc: "2 jugadores, 1 celular. ¿Quién sabe más del Paraguay? Nuevo · Multijugador", xp: "hasta 20 XP" },
  { to: "/juegos/ahorcado", tone: "chipa", icon: CircleDashed, title: "Ahorcado con chipas", desc: "Adiviná la palabra antes de que se acaben las 6 chipas.", xp: "hasta 15 XP" },
  { to: "/juegos/sopa-de-letras", tone: "search", icon: Grid2X2, title: "Sopa de letras", desc: "Encontrá 6 palabras escondidas en la grilla.", xp: "20 XP" },
  { to: "/juegos/memoria", tone: "memory", icon: Layers, title: "Memoria", desc: "Uní cada palabra en guaraní con su traducción.", xp: "hasta 20 XP" },
  { to: "/juegos/penales", tone: "football", icon: Goal, title: "Penales", desc: "Respondé la palabra y pateá al arco. Solo o Duelo.", xp: "hasta 20 XP" },
  { to: "/juegos/palabra-del-dia", tone: "daily", icon: CalendarDays, title: "Palabra del día", desc: "Escuchala y elegí su significado. Una vez por día.", xp: "5 XP" },
] as const;

function GamesHome() {
  useRecordVisit("juegos");
  return (
    <GameShell title="Juegos" emoji="🎮">
      <p className="text-center text-sm text-muted-foreground">
        Todas las palabras salen del vocabulario publicado y validado.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className={`game-card game-card-${g.tone} flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-elegant card-hover hover:shadow-lift`}
          >
            <div className="flex items-center justify-between">
              <span className="game-card-icon flex h-16 w-16 items-center justify-center rounded-lg" aria-hidden><g.icon size={34} strokeWidth={1.7}/></span>
              <span className="game-card-xp rounded-md px-2 py-1 text-xs font-semibold">{g.xp}</span>
            </div>
            <div className="font-display text-lg font-bold text-foreground">{g.title}</div>
            <p className="text-sm text-muted-foreground">{g.desc}</p>
            <span className="mt-1 text-sm font-medium text-primary">Jugar →</span>
          </Link>
        ))}
      </div>
    </GameShell>
  );
}
