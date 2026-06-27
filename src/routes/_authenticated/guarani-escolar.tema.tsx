import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/guarani-escolar/tema")({
  head: () => ({ meta: [{ title: "Aranduka — Práctica por Tema" }] }),
  component: () => <Outlet />,
});
