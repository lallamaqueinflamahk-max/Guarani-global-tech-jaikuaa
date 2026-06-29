import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/guarani-escolar/tema")({
  head: () => ({ meta: [{ title: "Jaikuaa — Práctica por Tema" }] }),
  component: () => <Outlet />,
});
