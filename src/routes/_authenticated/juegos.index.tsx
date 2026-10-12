import { createFileRoute, Link } from "@tanstack/react-router";
import { GameShell } from "@/components/games/game-shell";
import { useRecordVisit } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/juegos/")({
  head: () => ({
    meta: [
      { title: "Juegos | Jaikuaa" },
      { name: "description", content: "Jugá con las palabras guaraníes validadas: ahorcado, sopa de letras, memoria y palabra del día." },
      { property: "og:title", content: "Juegos | Jaikuaa" },
      { property: "og:description", content: "Juegos de palabras en guaraní con audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesHome,
});

const GAMES = [
  { to: "/juegos/ahorcado", emoji: "🥯", title: "Ahorcado con chipas", desc: "Adiviná la palabra antes de que se acaben las 6 chipas.", xp: "hasta 15 XP" },
  { to: "/juegos/sopa-de-letras", emoji: "🔤", title: "Sopa de letras", desc: "Encontrá 6 palabras escondidas en la grilla.", xp: "20 XP" },
  { to: "/juegos/memoria", emoji: "🃏", title: "Memoria", desc: "Uní cada palabra en guaraní con su traducción.", xp: "hasta 20 XP" },
  { to: "/juegos/penales", emoji: "⚽", title: "Penales", desc: "Acertá el significado y pateá al arco. Tanda de 5 penales.", xp: "hasta 20 XP" },
  { to: "/juegos/palabra-del-dia", emoji: "📅", title: "Palabra del día", desc: "Escuchala y elegí su significado. Una vez por día.", xp: "5 XP" },
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
            className="flex flex-col gap-2 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant card-hover hover:border-accent hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl" aria-hidden>{g.emoji}</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">{g.xp}</span>
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
