import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ValidationBadge } from "@/components/validation-notice";
import { BrandLogo } from "@/components/brand-logo";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatsBar, StreakBanner } from "@/components/gamification/stats-bar";
import { SiteFooter } from "@/components/site-footer";
import { NhandeMarandu } from "@/components/nhande-marandu";
import { AdminCorpusLink } from "@/components/admin-corpus-link";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Jaikuaa — Tu panel" }] }),
  component: Dashboard,
});

function greetingFor(hour: number): { subtitle: string; emoji: string } {
  if (hour >= 6 && hour < 12)
    return {
      emoji: "🌅",
      subtitle: "¿Listo para despertar el guaraní que llevás dentro?",
    };
  if (hour >= 12 && hour < 18)
    return {
      emoji: "☀️",
      subtitle: "El sol está alto y tu ñe'ẽ también puede brillar.",
    };
  if (hour >= 18 && hour < 24)
    return {
      emoji: "🌙",
      subtitle: "Unos minutos de guaraní antes de dormir.",
    };
  return {
    emoji: "🌙",
    subtitle: "El jaguaréte también caza de noche. ¡Practicá un poco!",
  };
}

const NAME_CACHE_KEY = "aranduka:profile-name";

function firstName(fullName: string): string {
  if (!fullName) return "";
  const first = fullName.split(" ")[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
}

function readCachedName(): string {
  if (typeof window === "undefined") return "";
  try {
    return firstName(window.localStorage.getItem(NAME_CACHE_KEY) || "");
  } catch {
    return "";
  }
}

function writeCachedName(name: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAME_CACHE_KEY, firstName(name));
  } catch {}
}

type TeaserKey = "karaoke" | "vivo" | null;

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>(() => readCachedName());
  const [openTeaser, setOpenTeaser] = useState<TeaserKey>(null);
  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;
      const fromMeta =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined);
      if (!readCachedName() && fromMeta) {
        setName(firstName(fromMeta));
        writeCachedName(fromMeta);
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const resolved = profile?.full_name || fromMeta || user.email?.split("@")[0] || "";
      if (resolved) {
        setName(firstName(resolved));
        writeCachedName(resolved);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    try {
      window.localStorage.removeItem(NAME_CACHE_KEY);
    } catch {}
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-primary"
          >
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            <AdminCorpusLink />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          {/* 1. SALUDO + STATS */}
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {name ? (
                <>
                  ¡Che, <span className="text-accent">{name}</span>! {greeting.emoji}
                </>
              ) : (
                <>¡Che! {greeting.emoji}</>
              )}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {greeting.subtitle}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <StatsBar />
            <StreakBanner />
          </div>

          {/* 2. SECCIONES PRINCIPALES (Gratis) */}
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              Aprendé guaraní
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FreeCard
                to="/curso/guarani"
                emoji="📚"
                title="Curso de Guaraní"
                desc="10 lecciones con audio humano real. Empezá desde cero y sumá XP."
                accent="accent"
              />
              <FreeCard
                to="/guarani-escolar"
                emoji="🎒"
                title="Guaraní Escolar"
                desc="Todo lo que necesitás para aprobar Guaraní en la escuela."
                accent="accent"
                inValidation
              />
              <FreeCard
                to="/nhe-mbytepe"
                emoji="🗣️"
                title="Ñe'ẽ Mbytépe"
                desc="El guaraní que se habla en la calle."
                accent="primary"
                inValidation
              />
              <FreeCard
                to="/trivia"
                emoji="🧠"
                title="Jaikuaápa"
                desc="Trivia: poné a prueba lo que sabés."
                accent="primary"
                inValidation
              />
              <FreeCard
                to="/traductor"
                emoji="🌐"
                title="Traductor"
                desc="Prueba con inteligencia artificial. No validado por especialistas."
                accent="primary"
                experimental
              />
            </div>
          </section>

          {/* 2b. JUEGOS (Gratis) */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">Juegos</h2>
            <div className="mt-4">
              <Link
                to="/juegos"
                className="group relative flex flex-col gap-2 rounded-2xl border border-accent/40 bg-card p-5 shadow-elegant card-hover hover:border-accent hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>
                    🎮
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Gratis
                  </span>
                </div>
                <div className="font-display text-lg font-bold text-foreground">Juegos</div>
                <p className="text-sm text-muted-foreground">
                  Ahorcado con chipas, sopa de letras, memoria y la palabra del día.
                </p>
                <span className="mt-1 text-sm font-medium text-accent">Jugar →</span>
              </Link>
            </div>
          </section>

          {/* 3. PREMIUM */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">Premium</h2>
            <div className="mt-4">
              <Link
                to="/tutor"
                className="group relative flex flex-col gap-2 rounded-2xl border border-accent/30 bg-card p-5 shadow-elegant card-hover hover:border-accent hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>
                    ✨
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    Experimental
                  </span>
                </div>
                <div className="font-display text-lg font-bold text-foreground">Tutor IA</div>
                <p className="text-sm text-muted-foreground">
                  Conversá con un asistente de IA. Contenido no validado por especialistas.
                </p>
                <span className="mt-1 text-sm font-medium text-accent">Abrir →</span>
              </Link>
            </div>
          </section>

          {/* 4. CULTURAL */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              Cultura y homenajes
            </h2>
            <div className="mt-4">
              <Link
                to="/nhe-rape"
                className="group relative flex flex-col gap-2 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant card-hover hover:border-primary hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>
                    📖
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Gratis
                  </span>
                </div>
                <div className="font-display text-lg font-bold text-foreground">Ñe'ẽ Rape</div>
                <p className="text-sm text-muted-foreground">
                  El camino de la palabra. Tributo al Prof. Ramón Silva.
                </p>
                <span className="mt-1 text-sm font-medium text-primary">Abrir →</span>
              </Link>
            </div>
          </section>

          {/* 5. FUTURO DE JAIKUAA */}
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              El futuro de Jaikuaa
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lo que se viene. Prepará tu voz y tus preguntas.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Karaoke teaser */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-[#C8102E] p-5 shadow-elegant sm:p-6">
                <span className="absolute -right-4 -bottom-4 text-7xl opacity-15" aria-hidden>
                  🎵
                </span>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" aria-hidden>
                      🎤
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm animate-pulse">
                      Próximamente
                    </span>
                  </div>
                  <div className="font-display text-xl font-bold text-white">Karaoke Ñe'ẽ</div>
                  <p className="text-sm text-white/90">
                    Cantá guaranías, rap, trap y más.
                    <br />
                    En guaraní puro o jopara.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenTeaser("karaoke")}
                    className="mt-1 self-start text-sm font-semibold text-white underline-offset-4 hover:underline"
                  >
                    Ver más →
                  </button>
                </div>
              </div>

              {/* Vivo teaser */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#C8102E] to-[#1E3A5F] p-5 shadow-elegant sm:p-6">
                <span className="absolute -right-4 -bottom-4 text-7xl opacity-15" aria-hidden>
                  📡
                </span>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" aria-hidden>
                      🔴
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm animate-pulse">
                      Próximamente
                    </span>
                  </div>
                  <div className="font-display text-xl font-bold text-white">Guaraní en Vivo</div>
                  <p className="text-sm text-white/90">
                    Transmisiones en vivo con hablantes nativos.
                    <br />
                    La comunidad del ñe'ẽ, conectada.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenTeaser("vivo")}
                    className="mt-1 self-start text-sm font-semibold text-white underline-offset-4 hover:underline"
                  >
                    Ver más →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 6. NOTICIAS */}
          <NhandeMarandu />
        </div>
      </main>
      <SiteFooter />

      {/* Teaser modals */}
      <Dialog open={openTeaser === "karaoke"} onOpenChange={(o) => !o && setOpenTeaser(null)}>
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-gradient-to-br from-[#1E3A5F] via-[#2A4A73] to-[#C8102E] p-0 text-white">
          <div className="relative flex flex-col p-7 sm:p-10">
            <span className="absolute -right-6 -bottom-6 text-9xl opacity-10" aria-hidden>
              🎵
            </span>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.10),transparent_40%)] pointer-events-none" />
            <DialogHeader className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  🎤
                </span>
                <DialogTitle className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  KARAOKE ÑE'Ẽ
                </DialogTitle>
              </div>
              <DialogDescription className="text-base leading-relaxed text-white/90 sm:text-lg">
                El guaraní no tiene un solo género. Tiene ALMA.
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 mt-8 space-y-6 text-sm leading-relaxed text-white/90 sm:text-base">
              <div className="space-y-3">
                <p>Cantá guaranías, rap, trap, reggae, cachaca, rock y más.</p>
                <p>En guaraní puro o en jopara. Tu voz, tu ritmo, tu lengua.</p>
                <p>
                  ¿Querés competir con amigos? Adentro. ¿Preferís cantar a tu ritmo, solo? También.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Guaranía clásica</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Rap ñe'ẽ</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Trap jopara</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Reggae guaraní</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Cachaca/Chamamé</span>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
                  <span className="text-lg" aria-hidden>
                    🎤
                  </span>
                  <span className="text-sm font-medium text-white">Rock paraguayo</span>
                </li>
              </ul>
              <div className="flex flex-col items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  Próximamente
                </span>
                <p className="text-sm text-white/80">Prepará tu voz.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTeaser === "vivo"} onOpenChange={(o) => !o && setOpenTeaser(null)}>
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-gradient-to-br from-[#C8102E] via-[#A01024] to-[#1E3A5F] p-0 text-white">
          <div className="relative flex flex-col p-7 sm:p-10">
            <span className="absolute -right-6 -bottom-6 text-9xl opacity-10" aria-hidden>
              📡
            </span>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.10),transparent_40%)] pointer-events-none" />
            <DialogHeader className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  🔴
                </span>
                <DialogTitle className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  GUARANÍ EN VIVO
                </DialogTitle>
              </div>
              <DialogDescription className="text-base leading-relaxed text-white/90 sm:text-lg">
                El guaraní no se guarda en libros. Se habla. Se comparte. Se VIVE.
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 mt-8 space-y-6 text-sm leading-relaxed text-white/90 sm:text-base">
              <p>
                Transmisiones en vivo con hablantes nativos, artistas, maestros y sabios de todo
                Paraguay.
              </p>
              <ul className="space-y-3">
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Referentes y especialistas del guaraní
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Debates sobre el uso, la historia y el futuro del guaraní
                      </p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Hablantes nativos de distintas regiones
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Conversaciones en guaraní puro y jopara
                      </p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Artistas del rap y la música urbana en guaraní
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Letras, ritmo y cultura en ñe'ẽ
                      </p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden>
                      🎙️
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-sm font-semibold text-white">
                        Talleres familiares
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/80">
                        Aprendé guaraní junto a tus hijos
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
              <p>Chat en vivo. Preguntá en tiempo real. La comunidad del ñe'ẽ, conectada.</p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  Próximamente
                </span>
                <p className="text-sm text-white/80">Prepará tus preguntas.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FreeCard({
  to,
  emoji,
  title,
  desc,
  accent,
  experimental,
  inValidation,
}: {
  to: string;
  emoji: string;
  title: string;
  desc: string;
  accent: "primary" | "accent";
  experimental?: boolean;
  inValidation?: boolean;
}) {
  const border =
    accent === "accent"
      ? "border-accent/40 hover:border-accent"
      : "border-primary/30 hover:border-primary";
  const link = accent === "accent" ? "text-accent" : "text-primary";
  return (
    <Link
      to={to}
      className={`group relative flex flex-col gap-2 rounded-2xl border ${border} bg-card p-5 shadow-elegant card-hover hover:shadow-lift`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
        {inValidation ? (
          <ValidationBadge />
        ) : experimental ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Experimental
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Gratis
          </span>
        )}
      </div>
      <div className="font-display text-lg font-bold text-foreground">{title}</div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <span className={`mt-1 text-sm font-medium ${link}`}>Abrir →</span>
    </Link>
  );
}
