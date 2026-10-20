import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PlaceholderPath({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl" aria-hidden>
        🔜
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
        Próximamente
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {description}
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">
          Estamos preparando esta sección para que aprendas Guaraní de la manera más fácil y divertida.
        </p>
      </div>
      <Button asChild variant="cta" className="mt-8">
        <Link to="/guarani-escolar">← Volver a Guaraní Escolar</Link>
      </Button>
    </div>
  );
}
