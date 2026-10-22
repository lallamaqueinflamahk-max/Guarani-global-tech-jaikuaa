import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/practica")({
  beforeLoad: () => {
    throw redirect({ to: "/validacion" });
  },
});