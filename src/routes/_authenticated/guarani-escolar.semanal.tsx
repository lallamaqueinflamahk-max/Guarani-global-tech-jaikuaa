import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPath } from "@/components/guarani-escolar/placeholder";

export const Route = createFileRoute("/_authenticated/guarani-escolar/semanal")({
  head: () => ({ meta: [{ title: "Aranduka — Plan Semanal" }] }),
  component: SemanalPlaceholder,
});

function SemanalPlaceholder() {
  return (
    <PlaceholderPath
      title="Plan Semanal"
      description="El Plan Semanal te va a dar una rutina clara para estudiar Guaraní todos los días."
    />
  );
}
