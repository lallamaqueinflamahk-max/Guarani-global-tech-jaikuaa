import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";
import { SUPPORT_WHATSAPP } from "@/lib/contact";

const MSG = "Hola, quisiera información sobre Jaikuaa Invest para radicarme o invertir en Paraguay.";

const RUBROS = [
  {
    emoji: "⚖️",
    title: "Legal y radicación",
    desc: "Residencia permanente, radicación, cédula, apertura de sociedades (E.A.S., S.A.), asesoría tributaria.",
  },
  {
    emoji: "🏡",
    title: "Inmuebles y terrenos",
    desc: "Compra de inmuebles urbanos y rurales, alquileres, verificación de títulos y mensura.",
  },
  {
    emoji: "🏢",
    title: "Apertura de empresas",
    desc: "Constitución de empresas, permisos municipales, régimen maquila, zonas francas.",
  },
  {
    emoji: "🌱",
    title: "Agro e inversión rural",
    desc: "Estudios de suelo, campos, ganadería, forestación y conexión con cooperativas.",
  },
] as const;

function leadHref(rubro: string) {
  const text = `Hola, vengo de Jaikuaa Invest. Quiero pedir presupuesto del rubro «${rubro}».`;
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export const Route = createFileRoute("/inversion")({
  head: () => ({
    meta: [
      { title: "Jaikuaa Invest — Invertí y radicate en Paraguay" },
      {
        name: "description",
        content:
          "Directorio verificado de empresas paraguayas para extranjeros: residencia, inmuebles, apertura de empresas y agro. Pedí presupuesto directo desde la plataforma.",
      },
      { property: "og:title", content: "Jaikuaa Invest — Invertí y radicate en Paraguay" },
      {
        property: "og:description",
        content: "Directorio verificado de empresas paraguayas para extranjeros: residencia, inmuebles, empresas y agro.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/inversion" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/inversion" }],
  }),
  component: InversionPage,
});

function InversionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Jaikuaa Invest
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Invertí y radicate en Paraguay
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Un directorio verificado de empresas paraguayas por rubro. Elegí lo que necesitás y pedí presupuesto
              directo, sin intermediarios ocultos.
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>Consultar por WhatsApp</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section
          title="Rubros disponibles"
          intro="Cada rubro tendrá un máximo de 2 a 3 empresas verificadas. Los cupos marcados están disponibles para empresas interesadas."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {RUBROS.map((r) => (
              <div key={r.title} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{r.emoji}</span>
                  <h3 className="font-display text-lg font-bold text-foreground">{r.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                <ul className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <li
                      key={n}
                      className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">Cupo {n} — disponible</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Verificado
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href={leadHref(r.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-95"
                >
                  Pedir presupuesto de este rubro
                </a>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Por qué Paraguay">
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="💵" title="Régimen fiscal atractivo">
              Impuestos bajos y estables (IVA 10 %, régimen 10-10-10) y facilidades para la repatriación de capitales.
            </InfoCard>
            <InfoCard emoji="🌎" title="Puerta del Mercosur">
              Ubicación estratégica, hidrovía del río Paraguay y acceso a los mercados de la región.
            </InfoCard>
            <InfoCard emoji="🗣️" title="Un país bilingüe">
              Español y guaraní son lenguas oficiales. Con Jaikuaa, el idioma deja de ser una barrera para hacer
              negocios.
            </InfoCard>
          </div>
        </Section>

        <Section title="Para empresas paraguayas">
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h3 className="font-display text-xl font-bold text-foreground">¿Querés aparecer en el directorio?</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Ofrecemos 2 a 3 cupos por rubro. Tu empresa recibe consultas de presupuesto de extranjeros interesados en
              invertir o radicarse en Paraguay, con reporte mensual de contactos.
            </p>
            <div className="mt-6">
              <WhatsAppCta message="Hola, mi empresa quiere ocupar un cupo en el directorio Jaikuaa Invest.">
                Quiero un cupo para mi empresa
              </WhatsAppCta>
            </div>
          </div>
        </Section>

        <Section title="Con total transparencia">
          <ul className="mx-auto max-w-3xl space-y-3 text-muted-foreground">
            <li>• Jaikuaa no presta servicios legales, inmobiliarios ni financieros: conecta con empresas verificadas.</li>
            <li>• Cada empresa del directorio firma un acuerdo y pasa por una verificación básica de antecedentes.</li>
            <li>• Jaikuaa no garantiza resultados de inversión; siempre recomendamos asesoría profesional independiente.</li>
          </ul>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
