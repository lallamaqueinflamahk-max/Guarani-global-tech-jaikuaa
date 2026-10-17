import { createFileRoute } from "@tanstack/react-router";
import { studioHandlers } from "@/lib/studio-proxy";

export const Route = createFileRoute("/studio/")({
  server: { handlers: studioHandlers },
});