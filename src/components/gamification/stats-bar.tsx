import { Link } from "@tanstack/react-router";
import { Flame, Trophy, Sparkles } from "lucide-react";
import { useStats } from "@/lib/gamification";

export function StatsBar() {
  const stats = useStats();
  return (
    <section
      aria-label="Tu progreso"
      className="grid grid-cols-3 gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm sm:p-4"
    >
      <Stat
        icon={<Sparkles className="h-4 w-4" />}
        label="XP total"
        value={stats.xp.toLocaleString("es-PY")}
        tone="primary"
      />
      <Stat
        icon={<Flame className="h-4 w-4" />}
        label="Racha"
        value={
          <span>
            {stats.streak}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              {stats.streak === 1 ? "día" : "días"}
            </span>{" "}
            🔥
          </span>
        }
        tone="accent"
      />
      <Link
        to="/logros"
        className="group flex flex-col items-start gap-1 rounded-xl border border-transparent p-2 transition hover:border-primary/30 hover:bg-primary/5 sm:p-3"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Trophy className="h-4 w-4 text-primary" /> Logros
        </div>
        <div className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {stats.badges.length}
          <span className="ml-1 text-sm font-medium text-muted-foreground">/ 4</span>
        </div>
        <span className="text-xs font-medium text-primary group-hover:underline">
          Ver todos →
        </span>
      </Link>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone: "primary" | "accent";
}) {
  const toneCls =
    tone === "accent" ? "text-accent" : "text-primary";
  return (
    <div className="flex flex-col items-start gap-1 p-2 sm:p-3">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground`}
      >
        <span className={toneCls}>{icon}</span> {label}
      </div>
      <div className="font-display text-xl font-bold text-foreground sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

export function StreakBanner() {
  const stats = useStats();
  if (stats.streak < 1) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-3 text-center text-sm text-muted-foreground">
        Empezá una lección hoy para arrancar tu racha 🔥
      </div>
    );
  }
  const msg =
    stats.streak >= 7
      ? "¡Estás en llamas! Seguí así 🔥"
      : stats.streak >= 3
        ? "¡Buena racha! No la cortes 💪"
        : "¡Arrancaste! Volvé mañana para sumar otro día.";
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-center text-sm font-medium text-accent">
      Racha: {stats.streak} {stats.streak === 1 ? "día" : "días"} 🔥 · {msg}
    </div>
  );
}
