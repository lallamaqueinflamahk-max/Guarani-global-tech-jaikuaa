import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";

const MSG = "Hola, me interesa sumar mi marca como auspiciante de Jaikuaa.";

export const Route = createFileRoute("/auspiciantes")({
  head: () => ({
    meta: [
      { title: "Auspiciá Jaikuaa — Tu marca junto al guaraní" },
      {
        name: "description",
        content:
          "Espacios para auspiciantes en Jaikuaa: Palabra del día, juegos, cartel LED del Penal y muro de Auspiciantes Fundadores.",
      },
      { property: "og:title", content: "Auspiciá Jaikuaa" },
      { property: "og:description", content: "Sumá tu marca a la plataforma paraguaya para aprender guaraní." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/auspiciantes" }],
  }),
  component: AuspiciantesPage,
});

/** Vista de ejemplo de cómo aparece la marca dentro de un juego. */
function GameMock({ emoji, title, feminine }: { emoji: string; title: string; feminine?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-4 text-center">
      <div className="font-display text-lg font-bold text-foreground">
        <span aria-hidden>{emoji}</span> {title}
      </div>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {feminine ? "Presentada por" : "Presentado por"} <span className="font-bold text-accent">Tu marca</span>
      </p>
    </div>
  );
}

function SlotCard({ title, children, mock }: { title: string; children: ReactNode; mock: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      {mock}
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function AuspiciantesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Para auspiciantes
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Tu marca, junto al guaraní
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Jaikuaa es gratis para los paraguayos gracias a las empresas que lo acompañan. Sumá tu marca a una causa
              de identidad nacional, en los espacios que la gente usa todos los días.
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>Quiero ser auspiciante</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title="Por qué auspiciar Jaikuaa">
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="🇵🇾" title="Identidad nacional">
              Un proyecto declarado de Interés Nacional y Educativo por el Senado (Declaración N.° 547/2026) y de
              interés lingüístico por la Secretaría de Políticas Lingüísticas (Resolución N.° 116/2026).
            </InfoCard>
            <InfoCard emoji="📅" title="Presencia diaria">
              La Palabra del día y los juegos son lo que los usuarios abren todos los días. Tu marca acompaña ese hábito.
            </InfoCard>
            <InfoCard emoji="🎓" title="Asociación positiva">
              Tu marca queda unida a la educación y al orgullo por nuestra lengua, no a una publicidad que interrumpe.
            </InfoCard>
          </div>
        </Section>

        <Section title="Espacios disponibles" intro="Así aparece tu marca dentro de la plataforma.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SlotCard title="Palabra del día" mock={<GameMock emoji="📅" title="Palabra del día" feminine />}>
              Una palabra guaraní por día, con audio humano. El espacio más visitado de la plataforma.
            </SlotCard>
            <SlotCard
              title="Juegos educativos"
              mock={
                <div className="grid gap-2">
                  <GameMock emoji="🥯" title="Ahorcado con chipas" />
                  <GameMock emoji="🔤" title="Sopa de letras" />
                </div>
              }
            >
              Un auspiciante por juego: Ahorcado, Sopa de letras, Memoria y Penales. Tu marca se ve durante toda la
              partida.
            </SlotCard>
            <SlotCard
              title="Cartel LED del Penal"
              mock={
                <div className="overflow-hidden rounded-lg bg-neutral-900 px-3 py-4 text-center font-mono text-sm font-bold tracking-widest text-amber-400">
                  TU MARCA AQUÍ
                </div>
              }
            >
              El cartel del estadio del juego de Penales muestra el mensaje de tu marca en cada tiro.
            </SlotCard>
            <SlotCard
              title="Muro de Auspiciantes Fundadores"
              mock={
                <div className="flex flex-wrap justify-center gap-2 rounded-lg bg-background p-3">
                  {["Tu marca", "Fundador", "Fundador"].map((n, i) => (
                    <span key={i} className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold">
                      {n}
                    </span>
                  ))}
                </div>
              }
            >
              Las primeras empresas que acompañan el lanzamiento quedan en la portada de jaikuaa.com.
            </SlotCard>
            <SlotCard title="Premios para quienes más aprenden" mock={<div className="rounded-lg bg-background p-4 text-center text-3xl">🎁</div>}>
              Vales, descuentos o productos de tu marca para los usuarios más constantes. En preparación, conforme a
              las autorizaciones que correspondan.
            </SlotCard>
            <SlotCard title="Capacitación de tu personal" mock={<div className="rounded-lg bg-background p-4 text-center text-3xl">🤝</div>}>
              Guaraní para tu equipo de atención al cliente, con vocabulario de tu rubro validado por especialistas.
            </SlotCard>
          </div>
        </Section>

        <Section title="Reglas claras">
          <ul className="mx-auto max-w-3xl space-y-3 text-muted-foreground">
            <li>• No aceptamos marcas de apuestas, alcohol ni tabaco: en Jaikuaa también aprenden estudiantes.</li>
            <li>• Ninguna publicidad interrumpe una lección.</li>
            <li>• Las marcas no intervienen en el contenido en guaraní: lo elaboran y validan especialistas en la lengua.</li>
            <li>• Informes periódicos de presencia de marca: en desarrollo.</li>
          </ul>
        </Section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Programa Auspiciantes Fundadores</h2>
            <p className="mt-3 text-muted-foreground">
              Un grupo reducido de empresas paraguayas que acompañan el lanzamiento de Jaikuaa. Conversemos sobre el
              espacio que mejor se ajusta a tu marca.
            </p>
            <div className="mt-6">
              <WhatsAppCta message={MSG}>Escribir por WhatsApp</WhatsAppCta>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Guaraní Global Tech E.A.S. — RUC 80174299-4</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
