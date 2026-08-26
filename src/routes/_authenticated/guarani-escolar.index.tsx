import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/guarani-escolar/")({
  head: () => ({ meta: [{ title: "Jaikuaa — Guaraní Escolar" }] }),
  component: GuaraniEscolarEntry,
});

const GRADES = ["3° grado", "6° grado", "9° grado", "Bachillerato"] as const;

type Grade = (typeof GRADES)[number];

const PATHS = [
  {
    to: "/guarani-escolar/rescate",
    emoji: "🚨",
    title: "Modo Rescate",
    description: "Tenés prueba pronto y necesitás aprobar.",
    style: "border-accent/40 hover:border-accent hover:bg-accent/5",
  },
  {
    to: "/guarani-escolar/semanal",
    emoji: "📅",
    title: "Plan Semanal",
    description: "Estudiá organizado durante la semana.",
    style: "border-primary/30 hover:border-primary hover:bg-primary/5",
  },
  {
    to: "/guarani-escolar/tema",
    emoji: "📚",
    title: "Práctica por Tema",
    description: "Reforzá un tema específico.",
    style: "border-primary/30 hover:border-primary hover:bg-primary/5",
  },
];

function GuaraniEscolarEntry() {
  const [grade, setGrade] = useState<Grade>("6° grado");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
          Guaraní Escolar <span aria-hidden className="ml-2">🎒</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
          ¿Qué necesitás hoy?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
          Todo lo que necesitás para entender y aprobar Guaraní en la escuela, paso a paso.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <label className="block text-center text-sm font-medium text-muted-foreground">
          Elegí tu año
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          {GRADES.map((g) => (
            <Button
              key={g}
              variant={g === grade ? "cta" : "outline"}
              size="sm"
              onClick={() => setGrade(g)}
              aria-pressed={g === grade}
            >
              {g}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Contenido adaptado para <span className="font-semibold text-foreground">{grade}</span>.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PATHS.map((path) => (
          <Link
            key={path.to}
            to={path.to}
            
            className={`group flex flex-col rounded-2xl border bg-card p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${path.style}`}
          >
            <div className="text-4xl" aria-hidden>
              {path.emoji}
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              {path.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              {path.description}
            </p>
            <span className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground shadow transition group-hover:bg-accent/90 group-active:scale-95">
              Entrar →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
