import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aranduka — Aprendé idiomas. Cambiá tu vida." },
      { name: "description", content: "La primera plataforma paraguaya de idiomas, con el guaraní en el corazón." },
      { property: "og:title", content: "Aranduka — Aprendé idiomas. Cambiá tu vida." },
      { property: "og:description", content: "La primera plataforma paraguaya de idiomas, con el guaraní en el corazón." },
    ],
  }),
  component: Index,
});

const languages = [
  {
    name: "Guaraní",
    flag: "🇵🇾",
    description: "Ñane ñe'ẽ. Aprendé la lengua del corazón de Paraguay.",
  },
  {
    name: "Inglés",
    flag: "🇺🇸",
    description: "Abrí puertas al mundo con el idioma global.",
  },
  {
    name: "Portugués",
    flag: "🇧🇷",
    description: "Conectá con vecinos, cultura y oportunidades.",
  },
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeaturedLanguages />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="w-full border-b border-border/50 bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
        >
          Aranduka
          <span aria-hidden="true" className="text-2xl">
            🐆
          </span>
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Aprendé idiomas.
          <br />
          <span className="text-accent">Cambiá tu vida.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          La primera plataforma paraguaya de idiomas, con el guaraní en el corazón.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button variant="cta" size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>Empezar gratis</Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link to="/auth" search={{ mode: "login" }}>Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeaturedLanguages() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Idiomas destacados
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((language) => (
            <LanguageCard key={language.name} {...language} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LanguageCard({
  name,
  flag,
  description,
}: {
  name: string;
  flag: string;
  description: string;
}) {
  return (
    <Card className="group overflow-hidden border-border/60 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg">
      <CardContent className="flex flex-col items-center p-8 text-center">
        <span aria-hidden="true" className="text-5xl sm:text-6xl">
          {flag}
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-card-foreground">
          {name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function Footer() {
  return <SiteFooter />;
}
