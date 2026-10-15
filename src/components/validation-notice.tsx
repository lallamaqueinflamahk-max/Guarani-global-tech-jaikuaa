import { ShieldCheck } from "lucide-react";

/**
 * Sello de protocolo académico para secciones cuyo contenido en guaraní está
 * en homologación por docentes del Ateneo. Regla: solo los expertos validan
 * el guaraní; el sello comunica el proceso con transparencia.
 */
export function ValidationNotice() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2.5 text-center text-xs font-medium text-primary sm:text-sm"
    >
      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong>Protocolo académico:</strong> contenido curricular en proceso de homologación con
        docentes del Ateneo de Lengua y Cultura Guaraní.
      </span>
    </div>
  );
}

export function ValidationBadge() {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      En homologación
    </span>
  );
}
