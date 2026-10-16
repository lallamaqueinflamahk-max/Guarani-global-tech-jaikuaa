import { createFileRoute, Link } from "@tanstack/react-router";
import { PrivateGate } from "@/components/private-gate";
import { SiteFooter } from "@/components/site-footer";
import { InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";

const MSG = "Hola, soy del sector audiovisual y quiero información sobre Ta'anga Jaikuaa (cine y guiones en guaraní).";

const REGISTROS = [
  { emoji: "🏙️", name: "Urbano · Jopara", desc: "Diálogos de calle, mercado y barrio, con la mezcla natural del habla cotidiana." },
  { emoji: "🌾", name: "Campesino · Guaraní profundo", desc: "Giros y modismos del interior para historias rurales y familiares." },
  { emoji: "📜", name: "Histórico · Solemne", desc: "Registro cuidado para series de época, documentales y relatos patrimoniales." },
] as const;

export const Route = createFileRoute("/cine")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Ta'anga Jaikuaa — Cine y guiones en guaraní" },
      { name: "description", content: "Herramienta y vitrina para el cine paraguayo: guiones bilingües, revisión lingüística humana y difusión de series y películas en guaraní." },
      { property: "og:title", content: "Ta'anga Jaikuaa — Cine y guiones en guaraní" },
      { property: "og:description", content: "Escribí, revisá y mostrá tu cine en guaraní. La vitrina del audiovisual paraguayo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/cine" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/cine" }],
  }),
  ssr: false,
  component: () => <PrivateGate><CinePage /></PrivateGate>,
});

function CinePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              🎬 Ta'anga Jaikuaa · Cine & Series
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Tu historia, en guaraní,
              <br />
              <span className="text-accent">en la pantalla grande</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              La herramienta para guionistas, directores y productoras que crean en guaraní y jopara, y la vitrina
              para mostrar el nuevo cine paraguayo al mundo.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <WhatsAppCta message={MSG}>Quiero escribir mi guion</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title="Para creadores" intro="Todo lo que necesitás para que tus diálogos en guaraní suenen verdaderos.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard emoji="📝" title="Guion bilingüe" tag="Próximamente">
              Formato profesional de escena, acción, personaje y diálogo, con castellano y guaraní lado a lado.
            </InfoCard>
            <InfoCard emoji="🧑‍🏫" title="Revisión humana">
              Docentes de la lengua revisan tus diálogos antes del rodaje. Nada se da por bueno sin una persona.
            </InfoCard>
            <InfoCard emoji="📚" title="Corpus validado">
              Consultá palabras y frases ya validadas, con audio de voces paraguayas reales.
            </InfoCard>
            <InfoCard emoji="📄" title="Exportación" tag="Próximamente">
              Descargá tu guion listo para presentar a fondos, festivales y registro de obra.
            </InfoCard>
          </div>
        </Section>

        <Section title="Elegí el tono de tu historia">
          <div className="grid gap-5 sm:grid-cols-3">
            {REGISTROS.map((r) => (
              <div key={r.name} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
                <span className="text-3xl" aria-hidden>{r.emoji}</span>
                <h3 className="font-display text-lg font-bold text-foreground">{r.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="La vitrina del cine paraguayo" intro="Fichas de series, cortos y películas hechas en Paraguay, con enlaces oficiales para verlas.">
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="🎞️" title="Estrenos y series">
              Afiche, sinopsis, equipo y dónde verla. Cada producción se suma con autorización de sus autores.
            </InfoCard>
            <InfoCard emoji="🎧" title="Aprender con escenas" tag="Próximamente">
              Fragmentos cortos con subtítulos bilingües para practicar el oído con actores reales.
            </InfoCard>
            <InfoCard emoji="🏆" title="Semillero de historias" tag="Próximamente">
              Convocatorias de micro-guiones y monólogos en guaraní para nuevos talentos.
            </InfoCard>
          </div>
        </Section>

        <Section title="¿Querés jugar primero?">
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h3 className="font-display text-xl font-bold text-foreground">Ta'anga · Claqueta de Jai</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Jai es el director. Vos completás el diálogo de cada escena hasta que grite «¡Corte! ¡Quedó perfecta!».
            </p>
            <Link to="/juegos/taanga" className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90">
              🎬 Jugar ahora
            </Link>
          </div>
        </Section>

        <Section title="Productoras y auspiciantes">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm text-muted-foreground">
              Revisión lingüística para rodajes, presencia en la vitrina y auspicio de convocatorias. Escribinos y te
              contamos las opciones.
            </p>
            <div className="mt-6">
              <WhatsAppCta message="Hola, represento a una productora/marca y quiero conocer Ta'anga Jaikuaa.">
                Hablar con Jaikuaa
              </WhatsAppCta>
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
