import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPath } from "@/components/guarani-escolar/placeholder";

export const Route = createFileRoute("/_authenticated/guarani-escolar/rescate")({
  head: () => ({ meta: [{ title: "Aranduka — Modo Rescate" }] }),
  component: RescatePlaceholder,
});

function RescatePlaceholder() {
  return (
    <PlaceholderPath
      title="Modo Rescate"
      description="El Modo Rescate te va a ayudar a repasar lo más importante antes de tu prueba."
    />
  );
}
