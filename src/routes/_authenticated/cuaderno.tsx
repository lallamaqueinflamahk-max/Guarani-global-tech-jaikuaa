import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeacherNotebook } from "@/lib/notebook.functions";

export const Route = createFileRoute("/_authenticated/cuaderno")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Cuaderno digital del docente" },
      { name: "description", content: "Seguimiento semanal del avance de cada alumno del grupo." },
      { property: "og:title", content: "Jaikuaa — Cuaderno digital del docente" },
      { property: "og:description", content: "Avance de alumnos por grupo para docentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotebookPage,
});

const STATUS = {
  verde: { label: "Hizo lecciones esta semana", cls: "bg-primary" },
  amarillo: { label: "Entró, sin lecciones", cls: "bg-accent" },
  gris: { label: "Sin actividad en 7 días", cls: "bg-muted-foreground/40" },
} as const;

function NotebookPage() {
  const fn = useServerFn(getTeacherNotebook);
  const [cohort, setCohort] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["notebook", cohort],
    queryFn: () => fn({ data: { cohort } }),
  });

  if (q.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Acceso restringido</h1>
        <p className="mt-2 text-muted-foreground">El cuaderno es solo para docentes de Jaikuaa.</p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }
  const d = q.data!;
  const s = d.students;
  const counts = {
    verde: s.filter((x) => x.status === "verde").length,
    amarillo: s.filter((x) => x.status === "amarillo").length,
    gris: s.filter((x) => x.status === "gris").length,
  };

  const exportCsv = () => {
    const rows = [
      ["Alumno", "Estado", "Lecciones completadas", "XP semana", "Actividades semana", "XP total", "Racha", "Última actividad"],
      ...s.map((x) => [x.name, STATUS[x.status].label, x.lessonsDone, x.weekXp, x.weekActivities, x.totalXp, x.streak, x.lastActive ?? ""]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = `cuaderno-${d.cohort ?? "grupo"}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-6">
      <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Cuaderno digital</h1>
      <p className="mt-1 text-muted-foreground">
        Mirá de un vistazo cómo avanza cada alumno de tu grupo, sin corregir a mano.
      </p>

      {d.cohorts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Todavía no tenés un grupo asignado. Pedile al administrador de Jaikuaa que te asigne uno.
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {d.isAdmin && d.cohorts.length > 1 ? (
              <Select value={d.cohort ?? undefined} onValueChange={setCohort}>
                <SelectTrigger className="h-11 sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {d.cohorts.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-display text-lg font-semibold text-foreground">Grupo: {d.cohort}</p>
            )}
            <Button variant="outline" className="h-11" onClick={exportCsv} disabled={s.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Descargar planilla
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => (
              <div key={k} className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <span className={`mx-auto mb-1 block h-3 w-3 rounded-full ${STATUS[k].cls}`} />
                <div className="font-display text-2xl font-bold text-foreground">{counts[k]}</div>
                <div className="text-xs text-muted-foreground">{STATUS[k].label}</div>
              </div>
            ))}
          </div>

          {s.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Este grupo todavía no tiene alumnos. Se suman al canjear el código de invitación.
            </div>
          ) : (
            <ul className="mt-6 space-y-2">
              {s.map((x) => (
                <li key={x.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${STATUS[x.status].cls}`} aria-label={STATUS[x.status].label} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground">{x.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {x.lessonsDone}/{d.totalLessons} lecciones · {x.weekXp} XP esta semana · racha {x.streak}
                      {x.lastActive ? ` · última vez ${x.lastActive}` : " · sin actividad"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
