import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Compartir un resultado por WhatsApp con el enlace a la portada de Jaikuaa. */
export function ShareResult({ text }: { text: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.jaikuaa.com";
  const href = `https://wa.me/?text=${encodeURIComponent(`${text} ${origin}/`)}`;
  return (
    <Button variant="outline" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Share2 aria-hidden /> Compartir por WhatsApp
      </a>
    </Button>
  );
}
