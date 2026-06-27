import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPath } from "@/components/guarani-escolar/placeholder";

export const Route = createFileRoute("/_authenticated/guarani-escolar/tema")({
  head: () => ({ meta: [{ title: "Aranduka — Práctica por Tema" }] }),
  component: TemaPlaceholder,
});

function TemaPlaceholder() {
  return (
    <PlaceholderPath
      title="Práctica por Tema"
      description="Práctica por Tema te va a permitir reforzar justo lo que más te cuesta."
    />
  );
}
