import { ShieldCheck } from "lucide-react";

/**
 * Aviso para secciones cuyo contenido en guaraní todavía no fue validado.
 * Regla: solo los especialistas validan el guaraní. Por el protocolo con el Ateneo,
 * aquí no se nombra al Ateneo ni se usan palabras como "homologación" o "aval".
 */
export function ValidationNotice() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2.5 text-center text-xs font-medium text-primary sm:text-sm"
    >
      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong>Contenido en validación:</strong> especialistas en la lengua lo están revisando antes
        de usarlo en clase.
      </span>
    </div>
  );
}

export function ValidationBadge() {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      En validación
    </span>
  );
}
