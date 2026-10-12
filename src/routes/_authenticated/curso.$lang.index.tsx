import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCourseLessons } from "@/lib/lessons.functions";
import { getLanguage } from "@/lib/languages";

export const Route = createFileRoute("/_authenticated/curso/$lang/")({
  component: CourseIndex,
});

function CourseIndex() {
  const { lang: langSlug } = useParams({ from: "/_authenticated/curso/$lang/" });
  const lang = getLanguage(langSlug)!;
  const isGuarani = lang.slug === "guarani";
  const listFn = useServerFn(listCourseLessons);
  const lessonsQ = useQuery({
    queryKey: ["course-lessons"],
    queryFn: () => listFn(),
    enabled: isGuarani,
  });
  const dbLessons = lessonsQ.data?.lessons ?? [];
  const byN = new Map(dbLessons.map((l) => [l.n, l]));
  const firstN = dbLessons[0]?.n ?? 1;
  const lessons = isGuarani
    ? dbLessons.map((l) => l.n)
    : Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="text-5xl" aria-hidden>
              {lang.flag}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  Curso de {lang.name}
                </h1>
                {lang.featured && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                    Destacado
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isGuarani ? `${lessons.length} lecciones` : "10 lecciones"} · Empezá por la Lección {isGuarani ? firstN : 1}
              </p>
            </div>
          </div>

          <ol className="mt-10 space-y-3">
            {lessons.map((n) => {
              const info = isGuarani ? byN.get(n) : undefined;
              const inValidation = !!info && info.publishedWords === 0;
              const unlocked = n === firstN && !inValidation;
              const title = info?.title;
              const inner = (
                <>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                        unlocked
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {n}
                    </div>
                    <div>
                      <div className="font-display text-base font-semibold text-foreground">
                        Lección {n}
                        {title && <span className="text-muted-foreground"> · {title}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inValidation
                          ? "En validación"
                          : unlocked
                            ? "Disponible"
                            : "Se desbloquea al avanzar"}
                      </div>
                    </div>
                  </div>
                  {unlocked ? (
                    <span className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground shadow transition group-hover:bg-accent/90 group-active:scale-95">
                      Empezar →
                    </span>
                  ) : (
                    <span className="text-xl" aria-label="Bloqueada" title="Bloqueada">
                      🔒
                    </span>
                  )}
                </>
              );

              return (
                <li key={n}>
                  {unlocked && isGuarani ? (
                    <Link
                      to="/curso/$lang/leccion/$n"
                      params={{ lang: lang.slug, n: String(n) }}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm transition hover:border-accent hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 sm:p-5"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      className={`flex items-center justify-between rounded-xl border p-4 sm:p-5 ${
                        unlocked
                          ? "border-border/60 bg-card shadow-sm"
                          : "border-border/40 bg-muted/40 opacity-70"
                      }`}
                    >
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </main>
    </div>
  );
}
