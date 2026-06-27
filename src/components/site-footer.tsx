import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 font-display text-lg font-bold text-primary sm:justify-start">
              Aranduka <span aria-hidden>🐆</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Hecho en Paraguay 🇵🇾 con amor por nuestra lengua.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link to="/sobre" className="text-muted-foreground transition-colors hover:text-foreground">
              Sobre Aranduka
            </Link>
            <Link to="/privacidad" className="text-muted-foreground transition-colors hover:text-foreground">
              Política de Privacidad
            </Link>
            <Link to="/terminos" className="text-muted-foreground transition-colors hover:text-foreground">
              Términos y Condiciones
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border/50 pt-6 sm:flex-row sm:justify-between">
          <p className="font-display text-xs font-medium tracking-wide text-muted-foreground">
            Aprendé · Hablá · Ñane Ñe'ẽ
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Aranduka. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <span aria-hidden>🔒</span> Tus datos están protegidos
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <span aria-hidden>🇵🇾</span> Hecho en Paraguay
      </span>
    </div>
  );
}
