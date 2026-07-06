import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
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
              />
              <FreeCard
                to="/nhe-mbytepe"
                emoji="🗣️"
                title="Ñe'ẽ Mbytépe"
                desc="El guaraní que se habla en la calle."
                accent="primary"
              />
              <FreeCard
                to="/trivia"
                emoji="🧠"
                title="Jaikuaápa"
                desc="Trivia: poné a prueba lo que sabés."
                accent="primary"
              />
              <FreeCard
                to="/traductor"
                emoji="🌐"
                title="Traductor"
                desc="Español ⇄ Guaraní al instante con IA."
                accent="primary"
              />
            </div>
          </section>

          {/* 3. PREMIUM */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              Premium
            </h2>
            <div className="mt-4">
              <Link
                to="/tutor"
                className="group relative flex flex-col gap-2 rounded-2xl border border-accent/30 bg-card p-5 shadow-elegant card-hover hover:border-accent hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>✨</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                    Premium ⭐
                  </span>
                </div>
                <div className="font-display text-lg font-bold text-foreground">Tutor IA</div>
                <p className="text-sm text-muted-foreground">Chateá con tu profe de guaraní 24/7.</p>
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
                  <span className="text-2xl" aria-hidden>📖</span>
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
                <span className="absolute -right-4 -bottom-4 text-7xl opacity-15" aria-hidden>🎵</span>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" aria-hidden>🎤</span>
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
                <span className="absolute -right-4 -bottom-4 text-7xl opacity-15" aria-hidden>📡</span>
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" aria-hidden>🔴</span>
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
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-gradient-to-br from-[#1E3A5F] to-[#C8102E] p-0 text-white">
          <div className="relative p-6 sm:p-8">
            <span className="absolute -right-6 -bottom-6 text-9xl opacity-15" aria-hidden>🎵</span>
            <DialogHeader className="relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl" aria-hidden>🎤🔥</span>
                <DialogTitle className="font-display text-3xl font-bold text-white sm:text-4xl">
                  KARAOKE ÑE'Ẽ
                </DialogTitle>
                <span className="text-3xl" aria-hidden>🔥🎵</span>
              </div>
              <DialogDescription className="text-white/90">
                El guaraní no tiene un solo género. Tiene ALMA.
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 mt-4 space-y-3 text-white/90">
              <p>Cantá guaranías, rap, trap, reggae, cachaca, rock y más.</p>
              <p>En guaraní puro o en jopara. Tu voz, tu ritmo, tu lengua.</p>
              <p>
                ¿Querés competir con amigos? Adentro. ¿Preferís cantar a tu ritmo, solo? También.
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-sm font-medium sm:grid-cols-3">
                <li>🎤 Guaranía clásica</li>
                <li>🎤 Rap ñe'ẽ</li>
                <li>🎤 Trap jopara</li>
                <li>🎤 Reggae guaraní</li>
                <li>🎤 Cachaca/Chamamé</li>
                <li>🎤 Rock paraguayo</li>
              </ul>
              <p className="pt-3 text-sm font-bold uppercase tracking-wide">
                Próximamente. Prepará tu voz.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTeaser === "vivo"} onOpenChange={(o) => !o && setOpenTeaser(null)}>
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-gradient-to-br from-[#C8102E] to-[#1E3A5F] p-0 text-white">
          <div className="relative p-6 sm:p-8">
            <span className="absolute -right-6 -bottom-6 text-9xl opacity-15" aria-hidden>📡</span>
            <DialogHeader className="relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl" aria-hidden>🔴</span>
                <DialogTitle className="font-display text-3xl font-bold text-white sm:text-4xl">
                  GUARANÍ EN VIVO
                </DialogTitle>
              </div>
              <DialogDescription className="text-white/90">
                El guaraní no se guarda en libros. Se habla. Se comparte. Se VIVE.
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 mt-4 space-y-3 text-white/90">
              <p>
                Transmisiones en vivo con hablantes nativos, artistas, maestros y sabios de todo Paraguay.
              </p>
              <ul className="space-y-3 pt-2 text-sm font-medium">
                <li className="flex flex-col gap-0.5">
                  <span className="font-semibold">🎙️ Referentes de la Secretaría de Políticas Lingüísticas</span>
                  <span className="pl-6 text-white/80">Debates sobre el uso, la historia y el futuro del guaraní</span>
                </li>
                <li className="flex flex-col gap-0.5">
                  <span className="font-semibold">🎙️ Hablantes nativos de distintas regiones</span>
                  <span className="pl-6 text-white/80">Conversaciones en guaraní puro y jopara</span>
                </li>
                <li className="flex flex-col gap-0.5">
                  <span className="font-semibold">🎙️ Artistas del rap y la música urbana en guaraní</span>
                  <span className="pl-6 text-white/80">Letras, ritmo y cultura en ñe'ẽ</span>
                </li>
                <li className="flex flex-col gap-0.5">
                  <span className="font-semibold">🎙️ Talleres familiares</span>
                  <span className="pl-6 text-white/80">Aprendé guaraní junto a tus hijos</span>
                </li>
              </ul>
              <p>Chat en vivo. Preguntá en tiempo real. La comunidad del ñe'ẽ, conectada.</p>
              <p className="pt-3 text-sm font-bold uppercase tracking-wide">
                Próximamente. Prepará tus preguntas.
              </p>
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
}: {
  to: string;
  emoji: string;
  title: string;
  desc: string;
  accent: "primary" | "accent";
}) {
  const border = accent === "accent" ? "border-accent/40 hover:border-accent" : "border-primary/30 hover:border-primary";
  const link = accent === "accent" ? "text-accent" : "text-primary";
  return (
    <Link
      to={to}
      className={`group relative flex flex-col gap-2 rounded-2xl border ${border} bg-card p-5 shadow-elegant card-hover hover:shadow-lift`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl" aria-hidden>{emoji}</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Gratis
        </span>
      </div>
      <div className="font-display text-lg font-bold text-foreground">{title}</div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <span className={`mt-1 text-sm font-medium ${link}`}>Abrir →</span>
    </Link>
  );
}
