import { useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { SUPPORT_MESSAGE, SUPPORT_WHATSAPP } from "@/lib/contact";

// En los juegos y en el panel de administración el botón molestaría, así que no se muestra.
const HIDDEN_PREFIXES = ["/juegos", "/admin", "/piloto-ateneo"];

/** Botón flotante de soporte por WhatsApp. */
export function SupportWhatsApp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  const href = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">¿Consultas? Escribinos</span>
    </a>
  );
}
